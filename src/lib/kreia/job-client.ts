import type { AnalysisCheckpoint, AnalyzeInput } from "./types";
import type { AnalysisProgress } from "./analysis-stages";
import {
  isPostTransportError,
  jpegPayload,
  JobTransportError,
  KREIA_JOBS_PATH,
  looksLikeHtml,
  messageFromHttpBody,
  parseJobSnapshot,
  type JobClientSnapshot,
} from "./job-protocol";
import { logKreia, logKreiaError, TRANSPORT_MESSAGE, userFacingError } from "./rpc";

export const JOB_POLL_MS = 1200;
export const JOB_WAIT_MS = 360_000;

export {
  isPostTransportError,
  JobTransportError,
  parseJobSnapshot,
  type JobClientSnapshot,
};

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function throwHttp(phase: "post" | "poll", status: number, body: string): never {
  throw new JobTransportError(messageFromHttpBody(body, status), phase);
}

async function readSnapshot(res: Response, phase: "post" | "poll"): Promise<JobClientSnapshot> {
  const text = await res.text();
  if (!res.ok) throwHttp(phase, res.status, text);
  if (looksLikeHtml(text)) throw new JobTransportError(TRANSPORT_MESSAGE, phase);
  if (!text.trim()) throw new JobTransportError(TRANSPORT_MESSAGE, phase);
  let parsed: unknown;
  try {
    parsed = JSON.parse(text) as unknown;
  } catch {
    throw new JobTransportError(TRANSPORT_MESSAGE, phase);
  }
  return parseJobSnapshot(parsed);
}

async function postOp(body: Record<string, unknown>): Promise<JobClientSnapshot> {
  let res: Response;
  try {
    res = await fetch(KREIA_JOBS_PATH, {
      method: "POST",
      headers: { "content-type": "application/json", accept: "application/json" },
      body: JSON.stringify(body),
    });
  } catch (err) {
    throw new JobTransportError(userFacingError(err, TRANSPORT_MESSAGE), "post");
  }
  return readSnapshot(res, "post");
}

async function pollJob(id: string): Promise<JobClientSnapshot> {
  let lastErr: unknown;
  for (let attempt = 0; attempt < 8; attempt++) {
    try {
      const snap = await postOp({ op: "poll", id });
      return snap;
    } catch (err) {
      lastErr = err;
      const msg = err instanceof Error ? err.message : "";
      const missing =
        /n'est plus disponible|introuvable/i.test(msg) ||
        (err instanceof JobTransportError && /session/i.test(err.message));
      if (!missing && attempt > 1) break;
      await sleep(400 * (attempt + 1));
    }
  }
  if (lastErr instanceof JobTransportError) {
    lastErr.phase = "poll";
    throw lastErr;
  }
  throw new JobTransportError(
    lastErr instanceof Error ? lastErr.message : TRANSPORT_MESSAGE,
    "poll",
  );
}

type OkResult<T> = T & { ok: true };
export type FailResult = {
  ok: false;
  error: string;
  checkpoint?: AnalysisCheckpoint;
  incomplete?: boolean;
};

function snapshotToResult<T extends { ok: true }>(
  snap: JobClientSnapshot,
): OkResult<T> | FailResult | null {
  if (snap.status === "ok") {
    const result = snap.result;
    if (result && typeof result === "object" && (result as { ok?: unknown }).ok === true) {
      return result as OkResult<T>;
    }
    if (result && typeof result === "object" && (result as { ok?: unknown }).ok === false) {
      const rec = result as {
        error?: unknown;
        checkpoint?: AnalysisCheckpoint;
        incomplete?: boolean;
      };
      return {
        ok: false,
        error: typeof rec.error === "string" ? rec.error : TRANSPORT_MESSAGE,
        checkpoint: rec.checkpoint,
        incomplete: rec.incomplete,
      };
    }
    return { ok: false, error: TRANSPORT_MESSAGE };
  }
  if (snap.status === "error") {
    const result = snap.result;
    const rec =
      result && typeof result === "object"
        ? (result as { checkpoint?: AnalysisCheckpoint; incomplete?: boolean; error?: string })
        : {};
    return {
      ok: false,
      error: snap.error || rec.error || TRANSPORT_MESSAGE,
      checkpoint: rec.checkpoint,
      incomplete: rec.incomplete,
    };
  }
  return null;
}

async function waitForDone<T extends { ok: true }>(
  created: JobClientSnapshot,
  startedAt: number,
  type: string,
  onProgress?: (progress: AnalysisProgress) => void,
): Promise<OkResult<T> | FailResult> {
  if (created.progress) onProgress?.(created.progress);
  const immediate = snapshotToResult<T>(created);
  if (immediate) return immediate;

  logKreia("job:poll-start", { id: created.id, type });
  while (Date.now() - startedAt < JOB_WAIT_MS) {
    await sleep(JOB_POLL_MS);
    let snap: JobClientSnapshot;
    try {
      snap = await pollJob(created.id);
    } catch (err) {
      logKreiaError("job:poll", err);
      throw err;
    }
    if (snap.progress) onProgress?.(snap.progress);
    const done = snapshotToResult<T>(snap);
    if (done) {
      if (done.ok) logKreia("job:ok", { id: created.id, ms: Date.now() - startedAt });
      else logKreia("job:error", { id: created.id, error: done.error });
      return done;
    }
  }

  throw new Error(
    "L'analyse a dépassé le délai imparti. Réessayez avec une vidéo plus courte.",
  );
}

async function runAnalyzeChunked<T extends { ok: true }>(
  payload: AnalyzeInput,
  startedAt: number,
  onProgress?: (progress: AnalysisProgress) => void,
): Promise<OkResult<T> | FailResult> {
  const created = await postOp({ op: "create", type: "analyze" });
  logKreia("[ANALYSIS SESSION] Created", { id: created.id, frames: payload.frames.length });
  for (const frame of payload.frames) {
    await postOp({
      op: "frame",
      id: created.id,
      t: frame.t,
      jpeg: jpegPayload(frame.dataUrl),
    });
  }
  for (const chunk of payload.audioChunks ?? []) {
    try {
      await postOp({
        op: "audio",
        id: created.id,
        t: chunk.t,
        wav: chunk.wavBase64,
      });
    } catch (err) {
      logKreiaError("job:audio-chunk", err);
      if (isPostTransportError(err)) break;
      throw err;
    }
  }
  const meta = {
    durationSeconds: payload.durationSeconds,
    width: payload.width,
    height: payload.height,
    kind: payload.kind,
    userNotes: payload.userNotes,
    checkpoint: payload.checkpoint,
  };
  const started = await postOp({ op: "start", id: created.id, payload: meta });
  logKreia("job:started", { id: started.id, frames: started.frameCount });
  return waitForDone<T>(started, startedAt, "analyze", onProgress);
}

export async function runKreiaJob<T extends { ok: true }>(
  type: string,
  payload: unknown,
  onProgress?: (progress: AnalysisProgress) => void,
): Promise<OkResult<T> | FailResult> {
  const startedAt = Date.now();
  logKreia("job:post", { type });

  if (
    type === "analyze" &&
    payload &&
    typeof payload === "object" &&
    Array.isArray((payload as AnalyzeInput).frames)
  ) {
    return runAnalyzeChunked<T>(payload as AnalyzeInput, startedAt, onProgress);
  }

  const created = await postOp({ op: "run", type, payload });
  return waitForDone<T>(created, startedAt, type, onProgress);
}
