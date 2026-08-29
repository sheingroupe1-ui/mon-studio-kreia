import { progressAt, type AnalysisProgress } from "./analysis-stages";
import {
  NETWORK_MESSAGE,
  runReviseAnalysis,
  runReviseProduction,
  type OkErr,
} from "./analyze-core";
import { createId } from "./ids";
import {
  persistJob,
  pruneJobFiles,
  readJob,
  tryLockJob,
  type PersistedJob,
} from "./job-store";
import { ideaProgressAt, IDEA_PHASE_ORDER, resumeIdeaPhase } from "./idea-stages";
import { runIdeaSlice } from "./idea-pipeline";
import { runProductionSlice } from "./engines/production";
import { runPipelineSlice, type PipelinePhase } from "./pipeline";
import type {
  AnalysisCheckpoint,
  AnalyzeInput,
  AudioChunk,
  FrameCapture,
  GenerateInput,
  IdeaCheckpoint,
  IdeaPhase,
  IdeateInput,
  ProjectKind,
  ReviseAnalysisInput,
  ReviseProductionInput,
} from "./types";

export const JOB_TYPES = [
  "analyze",
  "generate",
  "ideate",
  "revise-analysis",
  "revise-production",
] as const;

export type JobType = (typeof JOB_TYPES)[number];
export type JobStatus = "pending" | "running" | "ok" | "error";
export const JOB_MISSING = "La session d'analyse n'est plus disponible. Relancez l'analyse.";

export type JobSnapshot = {
  id: string;
  type: JobType;
  status: JobStatus;
  result?: unknown;
  error?: string;
  frameCount?: number;
  progress?: AnalysisProgress;
  phase?: string;
  debug?: string;
};

type JobRecord = JobSnapshot & {
  createdAt: number;
  updatedAt: number;
  frames: FrameCapture[];
  audioChunks: AudioChunk[];
  phase: PipelinePhase | IdeaPhase | "generate" | "revise" | "done";
  working: boolean;
  checkpoint?: AnalysisCheckpoint | IdeaCheckpoint;
  payload?: unknown;
  debug?: string;
};

const MAX_AGE_MS = 30 * 60_000;
const MAX_JOB_FRAMES = 12;
const MAX_JPEG_CHARS = 80_000;
const MAX_JOB_AUDIO = 12;
const MAX_AUDIO_CHUNK_CHARS = 240_000;
const LOCK_HOLD_MS = 150_000;
const STORE_KEY = Symbol.for("kreia.jobs.v3");

function store(): Map<string, JobRecord> {
  const g = globalThis as typeof globalThis & { [STORE_KEY]?: Map<string, JobRecord> };
  const existing = g[STORE_KEY];
  if (existing) return existing;
  const next = new Map<string, JobRecord>();
  g[STORE_KEY] = next;
  return next;
}

function toPersisted(job: JobRecord): PersistedJob {
  return {
    id: job.id,
    type: job.type,
    status: job.status,
    result: job.result,
    error: job.error,
    progress: job.progress,
    checkpoint: job.checkpoint as AnalysisCheckpoint | undefined,
    payload: job.payload,
    phase: job.phase,
    working: job.working,
    debug: job.debug,
    createdAt: job.createdAt,
    updatedAt: Date.now(),
    frames: job.frames,
    audioChunks: job.audioChunks,
  };
}

function fromPersisted(data: PersistedJob): JobRecord {
  const type = isJobType(data.type) ? data.type : "analyze";
  return {
    id: data.id,
    type,
    status: data.status,
    result: data.result,
    error: data.error,
    frameCount: data.frames.length,
    progress: data.progress,
    phase: (data.phase as JobRecord["phase"]) || "validate",
    debug: data.debug,
    createdAt: data.createdAt,
    updatedAt: data.updatedAt,
    frames: Array.isArray(data.frames) ? data.frames : [],
    audioChunks: Array.isArray(data.audioChunks) ? data.audioChunks : [],
    working: Boolean(data.working),
    checkpoint: data.checkpoint,
    payload: data.payload,
  };
}

async function flush(job: JobRecord, light = false): Promise<void> {
  job.updatedAt = Date.now();
  store().set(job.id, job);
  await persistJob(toPersisted(job), { light });
}

async function load(id: string): Promise<JobRecord | null> {
  const disk = await readJob(id);
  if (!disk) {
    store().delete(id);
    return null;
  }
  const record = fromPersisted(disk);
  const mem = store().get(id);
  if (mem) {
    mem.status = record.status;
    mem.result = record.result;
    mem.error = record.error;
    mem.progress = record.progress;
    mem.checkpoint = record.checkpoint;
    mem.payload = record.payload ?? mem.payload;
    mem.phase = record.phase;
    mem.working = record.working;
    mem.debug = record.debug;
    mem.frames = record.frames.length ? record.frames : mem.frames;
    mem.audioChunks = record.audioChunks.length ? record.audioChunks : mem.audioChunks;
    mem.updatedAt = record.updatedAt;
    return mem;
  }
  store().set(id, record);
  return record;
}

async function prune(): Promise<void> {
  const now = Date.now();
  for (const [id, job] of store()) {
    if (now - job.createdAt > MAX_AGE_MS) store().delete(id);
  }
  await pruneJobFiles();
}

function snapshot(job: JobRecord): JobSnapshot {
  return {
    id: job.id,
    type: job.type,
    status: job.status,
    result: job.result,
    error: job.error,
    frameCount: job.frames.length,
    progress: job.progress,
    phase: job.phase,
    debug: job.debug,
  };
}

export function isJobType(value: unknown): value is JobType {
  return typeof value === "string" && (JOB_TYPES as readonly string[]).includes(value);
}

export async function getJob(id: string): Promise<JobSnapshot | null> {
  await prune();
  const job = await load(id);
  return job ? snapshot(job) : null;
}

function toDataUrl(jpeg: string): string | null {
  const raw = jpeg.trim();
  if (!raw) return null;
  if (raw.startsWith("data:image/")) {
    if (raw.length > MAX_JPEG_CHARS) return null;
    return raw;
  }
  if (raw.length > MAX_JPEG_CHARS) return null;
  return `data:image/jpeg;base64,${raw}`;
}

function progressForPhase(phase: PipelinePhase): AnalysisProgress {
  if (phase === "validate") return progressAt(1);
  if (phase === "structure") return progressAt(2);
  if (phase === "transcript") return progressAt(2);
  if (phase === "cast") return progressAt(3);
  if (phase === "style") return progressAt(4);
  if (phase === "compact") return progressAt(5, { compact: true });
  if (phase === "segment") return progressAt(5);
  if (phase === "narrative") return progressAt(6);
  if (phase === "speakers") return progressAt(6);
  if (phase === "relationships") return progressAt(6);
  if (phase === "produce") return progressAt(7);
  return progressAt(7);
}

function isPhase(value: unknown): value is PipelinePhase {
  return (
    value === "validate" ||
    value === "structure" ||
    value === "transcript" ||
    value === "cast" ||
    value === "style" ||
    value === "compact" ||
    value === "segment" ||
    value === "narrative" ||
    value === "speakers" ||
    value === "relationships" ||
    value === "produce" ||
    value === "done"
  );
}

function isIdeaPhase(value: unknown): value is IdeaPhase {
  return typeof value === "string" && (IDEA_PHASE_ORDER as readonly string[]).includes(value);
}

async function runAnalyzeSlice(job: JobRecord): Promise<void> {
  const base =
    job.payload && typeof job.payload === "object" ? { ...(job.payload as Record<string, unknown>) } : {};
  const data = { ...base, frames: job.frames, audioChunks: job.audioChunks } as AnalyzeInput;
  const inferred = Number(data.durationSeconds) || 0;
  const frameCount = job.frames.length;
  const longForm = inferred > 10;
  console.info(
    `[PIPELINE] duration=${data.durationSeconds} frames=${frameCount} isLongForm=${longForm}`,
  );
  const phase: PipelinePhase = isPhase(job.phase) ? job.phase : "validate";
  job.progress = progressForPhase(phase);
  job.debug = `phase=${phase} frames=${job.frames.length} step=${job.progress.step}`;
  job.progress = { ...job.progress, debug: job.debug };
  await flush(job, true);
  console.info("[PIPELINE] Session:", job.id);
  console.info("[PIPELINE] Current step:", phase, job.progress);
  const slice = await runPipelineSlice({ data, checkpoint: job.checkpoint as AnalysisCheckpoint | undefined, phase });
  job.checkpoint = slice.checkpoint;
  job.progress = {
    ...slice.progress,
    debug: [
      `phase=${slice.nextPhase} done=${slice.done} chars=${slice.checkpoint.characters?.length ?? 0}`,
      slice.progress.debug,
    ]
      .filter(Boolean)
      .join(" | "),
  };
  job.phase = slice.nextPhase;
  job.debug = job.progress.debug;
  if (slice.awaitingCastReview) {
    job.status = "ok";
    job.result = {
      ok: true,
      awaitingCastReview: true,
      checkpoint: slice.checkpoint,
      characters: slice.checkpoint.characters ?? [],
    };
    job.error = undefined;
    job.phase = slice.nextPhase;
    return;
  }
  if (slice.awaitingDialogueReview) {
    job.status = "ok";
    job.result = {
      ok: true,
      awaitingDialogueReview: true,
      checkpoint: slice.checkpoint,
      analysis: slice.analysis,
    };
    job.error = undefined;
    job.phase = slice.nextPhase;
    return;
  }
  if (slice.done && slice.analysis) {
    job.status = "ok";
    job.result = {
      ok: true,
      analysis: slice.analysis,
      production: slice.production,
      checkpoint: slice.checkpoint,
    };
    job.error = undefined;
    job.phase = "done";
    return;
  }
  if (slice.done && slice.error) {
    job.status = "error";
    job.error = slice.error;
    job.debug = `phase=${phase} error=${slice.error}`;
    job.result = { ok: false, error: slice.error, checkpoint: slice.checkpoint, incomplete: true, debug: job.debug };
    job.phase = "done";
  }
}

async function runIdeaJobSlice(job: JobRecord): Promise<void> {
  const data = (job.payload && typeof job.payload === "object" ? job.payload : {}) as IdeateInput;
  const phase: IdeaPhase = isIdeaPhase(job.phase)
    ? job.phase
    : resumeIdeaPhase(job.checkpoint as IdeaCheckpoint | undefined);
  job.progress = ideaProgressAt(phase);
  job.debug = `idea phase=${phase}`;
  job.progress = { ...job.progress, debug: job.debug };
  await flush(job, true);
  console.info("[IDEA PIPELINE]", { session: job.id, phase });
  const slice = await runIdeaSlice({
    data,
    checkpoint: job.checkpoint as IdeaCheckpoint | undefined,
    phase,
  });
  job.checkpoint = slice.checkpoint;
  job.progress = { ...slice.progress, debug: `idea next=${slice.nextPhase}` };
  job.phase = slice.nextPhase;
  job.debug = job.progress.debug;
  if (slice.done && slice.analysis) {
    job.status = "ok";
    job.result = {
      ok: true,
      analysis: slice.analysis,
      production: slice.production,
      checkpoint: slice.checkpoint,
    };
    job.error = undefined;
    job.phase = "done";
    return;
  }
  if (slice.done && slice.error) {
    job.status = "error";
    job.error = slice.error;
    job.debug = `idea phase=${phase} error=${slice.error}`;
    job.result = {
      ok: false,
      error: slice.error,
      checkpoint: slice.checkpoint,
      incomplete: true,
      failedPhase: phase,
    };
    job.phase = "done";
  }
}

async function runProduceJobSlice(job: JobRecord): Promise<void> {
  const data = (job.payload && typeof job.payload === "object" ? job.payload : {}) as GenerateInput;
  job.progress = progressAt(7);
  await flush(job, true);
  const slice = await runProductionSlice({
    ...data,
    checkpoint: (job.checkpoint as AnalysisCheckpoint | undefined) ?? data.checkpoint,
  });
  job.checkpoint = slice.checkpoint;
  job.progress = slice.progress;
  job.debug = `produce ${slice.progress.productionScenesDone ?? 0}/${slice.progress.productionScenesTotal ?? 0}`;
  if (slice.done && slice.production) {
    job.status = "ok";
    job.result = { ok: true, production: slice.production, checkpoint: slice.checkpoint };
    job.error = undefined;
    job.phase = "done";
    return;
  }
  if (slice.done && slice.error) {
    job.status = "error";
    job.error = slice.error;
    job.result = { ok: false, error: slice.error, checkpoint: slice.checkpoint, incomplete: true };
    job.phase = "done";
    return;
  }
  job.phase = "produce";
}

async function runSingleShot(job: JobRecord): Promise<void> {
  const payload = job.payload;
  let out: OkErr<Record<string, unknown>>;
  try {
    switch (job.type) {
      case "generate":
        out = { ok: false, error: NETWORK_MESSAGE };
        break;
      case "revise-analysis":
        out = await runReviseAnalysis(payload as ReviseAnalysisInput);
        break;
      case "revise-production":
        out = await runReviseProduction(payload as ReviseProductionInput);
        break;
      default:
        out = { ok: false, error: NETWORK_MESSAGE };
    }
  } catch (err) {
    out = {
      ok: false,
      error: err instanceof Error && err.message.trim() ? err.message : NETWORK_MESSAGE,
    };
  }
  if (!out || typeof out.ok !== "boolean") {
    job.status = "error";
    job.error = NETWORK_MESSAGE;
  } else if (!out.ok) {
    job.status = "error";
    job.error = out.error || NETWORK_MESSAGE;
    job.result = out;
  } else {
    job.status = "ok";
    job.result = out;
  }
  job.phase = "done";
}

export async function advanceJob(id: string): Promise<JobSnapshot | null> {
  const current = await load(id);
  if (!current) return null;
  if (current.status === "ok" || current.status === "error") return snapshot(current);
  if (current.status !== "running") return snapshot(current);

  const locked = await tryLockJob(id);
  if (!locked) {
    const latest = await load(id);
    if (!latest) return snapshot(current);
    if (latest.status !== "running") return snapshot(latest);
    if (latest.working && Date.now() - latest.updatedAt < LOCK_HOLD_MS) {
      return snapshot(latest);
    }
  }

  const job = (await load(id)) ?? current;
  job.working = true;
  store().set(job.id, job);

  try {
    if (job.type === "analyze") await runAnalyzeSlice(job);
    else if (job.type === "ideate") await runIdeaJobSlice(job);
    else if (job.type === "generate") await runProduceJobSlice(job);
    else await runSingleShot(job);
  } catch (err) {
    console.error("[ANALYSIS FAILED]", {
      session: job.id,
      phase: job.phase,
      errorMessage: err instanceof Error ? err.message : String(err),
    });
    job.status = "error";
    job.error = err instanceof Error && err.message.trim() ? err.message : NETWORK_MESSAGE;
    job.debug = `phase=${job.phase} catch=${job.error}`;
    job.phase = "done";
  } finally {
    job.working = false;
    await flush(job, false);
  }
  return snapshot(job);
}

export async function createJob(type: JobType): Promise<JobSnapshot> {
  await prune();
  const id = createId("job");
  const record: JobRecord = {
    id,
    type,
    status: "pending",
    createdAt: Date.now(),
    updatedAt: Date.now(),
    frames: [],
    audioChunks: [],
    phase: type === "ideate" ? "understand" : "validate",
    working: false,
  };
  store().set(id, record);
  await flush(record);
  console.info("[kreia:job] created", { id, type });
  return snapshot(record);
}

export async function appendFrame(
  id: string,
  t: number,
  jpeg: string,
): Promise<{ ok: true; snapshot: JobSnapshot } | { ok: false; error: string; status?: number }> {
  await prune();
  const job = await load(id);
  if (!job) return { ok: false, error: JOB_MISSING, status: 404 };
  if (job.status !== "pending") return { ok: false, error: "Ce travail n'accepte plus d'images." };
  if (job.frames.length >= MAX_JOB_FRAMES) return { ok: false, error: "Trop d'images." };
  const dataUrl = toDataUrl(jpeg);
  if (!dataUrl) return { ok: false, error: "Image illisible ou trop lourde." };
  const time = Number(t);
  job.frames.push({ t: Number.isFinite(time) ? time : job.frames.length, dataUrl });
  await flush(job);
  return { ok: true, snapshot: snapshot(job) };
}

export async function appendAudio(
  id: string,
  t: number,
  wav: string,
): Promise<{ ok: true; snapshot: JobSnapshot } | { ok: false; error: string; status?: number }> {
  await prune();
  const job = await load(id);
  if (!job) return { ok: false, error: JOB_MISSING, status: 404 };
  if (job.status !== "pending") return { ok: false, error: "Ce travail n'accepte plus d'audio." };
  if (job.audioChunks.length >= MAX_JOB_AUDIO) return { ok: false, error: "Trop de pistes audio." };
  const raw = wav.trim();
  if (!raw || raw.length > MAX_AUDIO_CHUNK_CHARS) {
    return { ok: false, error: "Piste audio illisible ou trop lourde." };
  }
  const time = Number(t);
  job.audioChunks.push({
    t: Number.isFinite(time) ? time : job.audioChunks.length * 8,
    wavBase64: raw,
  });
  await flush(job);
  return { ok: true, snapshot: snapshot(job) };
}

export async function startPendingJob(
  id: string,
  payload: unknown,
): Promise<{ snapshot: JobSnapshot } | { error: string; status?: number }> {
  await prune();
  const job = await load(id);
  if (!job) return { error: JOB_MISSING, status: 404 };
  if (job.status === "ok" || job.status === "error") return { snapshot: snapshot(job) };
  if (job.status === "running") {
    const advanced = await advanceJob(job.id);
    return { snapshot: advanced ?? snapshot(job) };
  }
  const base =
    payload && typeof payload === "object" ? { ...(payload as Record<string, unknown>) } : {};
  if (job.type === "analyze") {
    delete base.audioWavBase64;
    job.checkpoint = (base.checkpoint as AnalysisCheckpoint | undefined) ?? job.checkpoint;
    delete base.frames;
    delete base.audioChunks;
  }
  if (job.type === "ideate") {
    job.checkpoint = (base.checkpoint as IdeaCheckpoint | undefined) ?? job.checkpoint;
  }
  if (job.type === "generate") {
    job.checkpoint = (base.checkpoint as AnalysisCheckpoint | undefined) ?? job.checkpoint;
  }
  job.payload = base;
  job.status = "running";
  job.phase =
    job.type === "analyze"
      ? "validate"
      : job.type === "ideate"
        ? resumeIdeaPhase(job.checkpoint as IdeaCheckpoint | undefined)
        : job.type === "generate"
          ? "produce"
          : "generate";
  job.working = false;
  await flush(job);
  const advanced = await advanceJob(job.id);
  return { snapshot: advanced ?? snapshot(job) };
}

export async function startJob(
  type: JobType,
  payload: unknown,
): Promise<{ snapshot: JobSnapshot }> {
  await prune();
  const created = await createJob(type);
  const started = await startPendingJob(created.id, payload);
  if ("error" in started) {
    return {
      snapshot: {
        id: created.id,
        type,
        status: "error",
        error: started.error,
      },
    };
  }
  return started;
}

export async function identifyOnly(id: string): Promise<Record<string, unknown>> {
  const job = await load(id);
  if (!job) return { success: false, error: JOB_MISSING, status: 404 };
  const payload =
    job.payload && typeof job.payload === "object" ? (job.payload as Record<string, unknown>) : {};
  const kind = (typeof payload.kind === "string" ? payload.kind : "human") as ProjectKind;
  console.info("[CHARACTERS] ISOLATION TEST START", { id, frames: job.frames.length, kind });
  try {
    const { identifyCharacters } = await import("./engines/cast");
    const cast = await identifyCharacters({
      frames: job.frames,
      kind,
      durationSeconds: Number(payload.durationSeconds) || 0,
      width: Number(payload.width) || 0,
      height: Number(payload.height) || 0,
      userNotes: typeof payload.userNotes === "string" ? payload.userNotes : undefined,
      batchIndex: 0,
    });
    console.info("[CHARACTERS] ISOLATION TEST END", { id, count: cast.characters.length });
    return { success: true, characters: cast.characters, count: cast.characters.length };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("[CHARACTERS] ISOLATION TEST FAIL", { id, message });
    return { success: false, error: message };
  }
}
