import type { AnalysisProgress } from "./analysis-stages";
import {
  NETWORK_MESSAGE,
  runAnalyze,
  runGenerate,
  runReviseAnalysis,
  runReviseProduction,
  type OkErr,
} from "./analyze-core";
import { createId } from "./ids";
import { persistJob, pruneJobFiles, readJob, type PersistedJob } from "./job-store";
import type {
  AnalyzeInput,
  AudioChunk,
  FrameCapture,
  GenerateInput,
  ReviseAnalysisInput,
  ReviseProductionInput,
} from "./types";

export const JOB_TYPES = [
  "analyze",
  "generate",
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
};

type JobRecord = JobSnapshot & {
  createdAt: number;
  updatedAt: number;
  frames: FrameCapture[];
  audioChunks: AudioChunk[];
  done: Promise<JobSnapshot>;
};

const MAX_AGE_MS = 30 * 60_000;
const MAX_JOB_FRAMES = 12;
const MAX_JPEG_CHARS = 80_000;
const MAX_JOB_AUDIO = 12;
const MAX_AUDIO_CHUNK_CHARS = 240_000;
const STORE_KEY = Symbol.for("kreia.jobs.v2");

function store(): Map<string, JobRecord> {
  const g = globalThis as typeof globalThis & {
    [STORE_KEY]?: Map<string, JobRecord>;
  };
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
    createdAt: job.createdAt,
    updatedAt: Date.now(),
    frames: job.frames,
    audioChunks: job.audioChunks,
  };
}

function fromPersisted(data: PersistedJob): JobRecord {
  const type = isJobType(data.type) ? data.type : "analyze";
  const snap: JobSnapshot = {
    id: data.id,
    type,
    status: data.status,
    result: data.result,
    error: data.error,
    frameCount: data.frames.length,
    progress: data.progress,
  };
  return {
    ...snap,
    createdAt: data.createdAt,
    updatedAt: data.updatedAt,
    frames: Array.isArray(data.frames) ? data.frames : [],
    audioChunks: Array.isArray(data.audioChunks) ? data.audioChunks : [],
    done: Promise.resolve(snap),
  };
}

function flush(job: JobRecord, light = false) {
  job.updatedAt = Date.now();
  persistJob(toPersisted(job), { light });
}

function load(id: string): JobRecord | null {
  const mem = store().get(id);
  if (mem) return mem;
  const disk = readJob(id);
  if (!disk) return null;
  const record = fromPersisted(disk);
  store().set(id, record);
  return record;
}

function prune() {
  const now = Date.now();
  for (const [id, job] of store()) {
    if (now - job.createdAt > MAX_AGE_MS) store().delete(id);
  }
  pruneJobFiles();
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
  };
}

export function isJobType(value: unknown): value is JobType {
  return typeof value === "string" && (JOB_TYPES as readonly string[]).includes(value);
}

export function getJob(id: string): JobSnapshot | null {
  prune();
  const mem = store().get(id);
  const disk = readJob(id);

  if (disk && (disk.status === "ok" || disk.status === "error")) {
    if (mem) {
      if (mem.status !== disk.status || mem.updatedAt < disk.updatedAt) {
        mem.status = disk.status;
        mem.result = disk.result;
        mem.error = disk.error;
        mem.progress = disk.progress;
        mem.updatedAt = disk.updatedAt;
      }
      return snapshot(mem);
    }
    const record = fromPersisted(disk);
    store().set(id, record);
    return snapshot(record);
  }

  if (mem) return snapshot(mem);
  if (!disk) return null;
  const record = fromPersisted(disk);
  store().set(id, record);
  return snapshot(record);
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

async function execute(
  type: JobType,
  payload: unknown,
  onProgress?: (progress: AnalysisProgress) => void,
): Promise<OkErr<Record<string, unknown>>> {
  switch (type) {
    case "analyze":
      return runAnalyze(payload as AnalyzeInput, onProgress);
    case "generate":
      return runGenerate(payload as GenerateInput);
    case "revise-analysis":
      return runReviseAnalysis(payload as ReviseAnalysisInput);
    case "revise-production":
      return runReviseProduction(payload as ReviseProductionInput);
    default:
      return { ok: false, error: NETWORK_MESSAGE };
  }
}

function runRecord(record: JobRecord, payload: unknown): Promise<JobSnapshot> {
  record.status = "running";
  flush(record, false);
  console.info("[ANALYSIS SESSION] start", { session: record.id, type: record.type });
  const beat = setInterval(() => {
    record.updatedAt = Date.now();
    flush(record, true);
  }, 8000);
  const done = (async () => {
    try {
      const out = await execute(record.type, payload, (progress) => {
        record.progress = progress;
        record.updatedAt = Date.now();
        flush(record, true);
        console.info("[ANALYSIS SESSION] progress", {
          session: record.id,
          step: progress.step,
          label: progress.label,
        });
      });
      if (!out || typeof out.ok !== "boolean") {
        record.status = "error";
        record.error = NETWORK_MESSAGE;
      } else if (!out.ok) {
        record.status = "error";
        record.error = out.error || NETWORK_MESSAGE;
        record.result = out;
      } else {
        record.status = "ok";
        record.result = out;
      }
    } catch (err) {
      console.error("[ANALYSIS FAILED]", {
        session: record.id,
        errorName: err instanceof Error ? err.name : "Error",
        errorMessage: err instanceof Error ? err.message : String(err),
        stack: err instanceof Error ? err.stack : undefined,
        wasAborted: err instanceof Error && err.name === "AbortError",
      });
      record.status = "error";
      record.error = err instanceof Error && err.message.trim() ? err.message : NETWORK_MESSAGE;
    } finally {
      clearInterval(beat);
      flush(record, false);
    }
    console.info("[ANALYSIS SESSION] done", { session: record.id, status: record.status });
    return snapshot(record);
  })();
  record.done = done;
  return done;
}

export function createJob(type: JobType): JobSnapshot {
  prune();
  const id = createId("job");
  const record: JobRecord = {
    id,
    type,
    status: "pending",
    createdAt: Date.now(),
    updatedAt: Date.now(),
    frames: [],
    audioChunks: [],
    done: Promise.resolve({ id, type, status: "pending" }),
  };
  store().set(id, record);
  flush(record);
  console.info("[kreia:job] created", { id, type });
  return snapshot(record);
}

export function appendFrame(
  id: string,
  t: number,
  jpeg: string,
): { ok: true; snapshot: JobSnapshot } | { ok: false; error: string; status?: number } {
  prune();
  const job = load(id);
  if (!job) return { ok: false, error: JOB_MISSING, status: 404 };
  if (job.status !== "pending") {
    return { ok: false, error: "Ce travail n'accepte plus d'images." };
  }
  if (job.frames.length >= MAX_JOB_FRAMES) {
    return { ok: false, error: "Trop d'images." };
  }
  const dataUrl = toDataUrl(jpeg);
  if (!dataUrl) return { ok: false, error: "Image illisible ou trop lourde." };
  const time = Number(t);
  job.frames.push({ t: Number.isFinite(time) ? time : job.frames.length, dataUrl });
  flush(job);
  return { ok: true, snapshot: snapshot(job) };
}

export function appendAudio(
  id: string,
  t: number,
  wav: string,
): { ok: true; snapshot: JobSnapshot } | { ok: false; error: string; status?: number } {
  prune();
  const job = load(id);
  if (!job) return { ok: false, error: JOB_MISSING, status: 404 };
  if (job.status !== "pending") {
    return { ok: false, error: "Ce travail n'accepte plus d'audio." };
  }
  if (job.audioChunks.length >= MAX_JOB_AUDIO) {
    return { ok: false, error: "Trop de pistes audio." };
  }
  const raw = wav.trim();
  if (!raw || raw.length > MAX_AUDIO_CHUNK_CHARS) {
    return { ok: false, error: "Piste audio illisible ou trop lourde." };
  }
  const time = Number(t);
  job.audioChunks.push({
    t: Number.isFinite(time) ? time : job.audioChunks.length * 8,
    wavBase64: raw,
  });
  flush(job);
  return { ok: true, snapshot: snapshot(job) };
}

export function startPendingJob(
  id: string,
  payload: unknown,
): { snapshot: JobSnapshot; done: Promise<JobSnapshot> } | { error: string; status?: number } {
  prune();
  const job = load(id);
  if (!job) return { error: JOB_MISSING, status: 404 };
  if (job.status === "running" || job.status === "ok" || job.status === "error") {
    return { snapshot: snapshot(job), done: job.done };
  }
  const base =
    payload && typeof payload === "object" ? { ...(payload as Record<string, unknown>) } : {};
  if (job.type === "analyze") {
    base.frames = job.frames;
    base.audioChunks = job.audioChunks;
    delete base.audioWavBase64;
  }
  const done = runRecord(job, base);
  return { snapshot: snapshot(job), done };
}

export function startJob(
  type: JobType,
  payload: unknown,
): { snapshot: JobSnapshot; done: Promise<JobSnapshot> } {
  prune();
  const id = createId("job");
  const record: JobRecord = {
    id,
    type,
    status: "running",
    createdAt: Date.now(),
    updatedAt: Date.now(),
    frames: [],
    audioChunks: [],
    done: Promise.resolve({ id, type, status: "running" }),
  };
  store().set(id, record);
  const done = runRecord(record, payload);
  return { snapshot: snapshot(record), done };
}

export function waitForJob(id: string): Promise<JobSnapshot> | null {
  const job = load(id);
  return job ? job.done : null;
}
