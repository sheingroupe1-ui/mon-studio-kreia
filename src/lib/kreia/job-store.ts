import { mkdirSync, readFileSync, readdirSync, unlinkSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import type { AnalysisProgress } from "./analysis-stages";
import type { AudioChunk, FrameCapture } from "./types";

export type PersistedJob = {
  id: string;
  type: string;
  status: "pending" | "running" | "ok" | "error";
  result?: unknown;
  error?: string;
  progress?: AnalysisProgress;
  createdAt: number;
  updatedAt: number;
  frames: FrameCapture[];
  audioChunks: AudioChunk[];
};

const DIR = join("/tmp", "kreia-job-store");
const MAX_AGE_MS = 30 * 60_000;
/** Must stay above the longest vision+transcript run (≈ 12 min). */
const STALE_RUNNING_MS = 20 * 60_000;

function safeId(id: string): string | null {
  const trimmed = id.trim();
  if (!trimmed || trimmed.length > 80) return null;
  if (!/^[a-zA-Z0-9_-]+$/.test(trimmed)) return null;
  return trimmed;
}

function pathFor(id: string): string {
  return join(DIR, `${id}.json`);
}

function ensureDir() {
  mkdirSync(DIR, { recursive: true });
}

function readRaw(id: string): PersistedJob | null {
  try {
    const raw = readFileSync(pathFor(id), "utf8");
    const parsed = JSON.parse(raw) as PersistedJob;
    if (!parsed || parsed.id !== id) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function persistJob(job: PersistedJob, opts?: { light?: boolean }): void {
  const id = safeId(job.id);
  if (!id) return;
  try {
    ensureDir();
    const prev = opts?.light ? readRaw(id) : null;
    const payload: PersistedJob = {
      ...job,
      id,
      updatedAt: Date.now(),
      frames: opts?.light ? (prev?.frames ?? job.frames ?? []) : job.frames ?? [],
      audioChunks: opts?.light ? (prev?.audioChunks ?? job.audioChunks ?? []) : job.audioChunks ?? [],
    };
    writeFileSync(pathFor(id), JSON.stringify(payload));
  } catch (err) {
    console.error("[ANALYSIS SESSION] persist failed", job.id, err);
  }
}

export function readJob(id: string): PersistedJob | null {
  const safe = safeId(id);
  if (!safe) return null;
  const parsed = readRaw(safe);
  if (!parsed) return null;
  if (Date.now() - parsed.createdAt > MAX_AGE_MS) {
    forgetJob(safe);
    return null;
  }
  if (
    parsed.status === "running" &&
    Date.now() - (parsed.updatedAt || parsed.createdAt) > STALE_RUNNING_MS
  ) {
    console.error("[ANALYSIS FAILED]", {
      session: parsed.id,
      currentStep: parsed.progress?.label,
      wasAborted: false,
      timeout: true,
      errorMessage: "stale running job",
    });
    parsed.status = "error";
    parsed.error = "L'analyse a dépassé le délai prévu. Reprenez l'analyse.";
    persistJob(parsed, { light: true });
  }
  return parsed;
}

export function forgetJob(id: string): void {
  const safe = safeId(id);
  if (!safe) return;
  try {
    unlinkSync(pathFor(safe));
  } catch {
    /* missing is fine */
  }
}

export function pruneJobFiles(): void {
  try {
    ensureDir();
    const now = Date.now();
    for (const name of readdirSync(DIR)) {
      if (!name.endsWith(".json")) continue;
      const full = join(DIR, name);
      try {
        const parsed = JSON.parse(readFileSync(full, "utf8")) as PersistedJob;
        if (!parsed?.createdAt || now - parsed.createdAt > MAX_AGE_MS) unlinkSync(full);
      } catch {
        unlinkSync(full);
      }
    }
  } catch {
    /* ignore */
  }
}
