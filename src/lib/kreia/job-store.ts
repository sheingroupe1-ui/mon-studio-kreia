import { getSql } from "@/lib/db";
import type { AnalysisProgress } from "./analysis-stages";
import type { AnalysisCheckpoint, AudioChunk, FrameCapture } from "./types";

export type PersistedJob = {
  id: string;
  type: string;
  status: "pending" | "running" | "ok" | "error";
  result?: unknown;
  error?: string;
  progress?: AnalysisProgress;
  checkpoint?: AnalysisCheckpoint;
  payload?: unknown;
  phase?: string;
  working?: boolean;
  debug?: string;
  createdAt: number;
  updatedAt: number;
  frames: FrameCapture[];
  audioChunks: AudioChunk[];
};

const MAX_AGE_MS = 30 * 60_000;
const STALE_RUNNING_MS = 20 * 60_000;

function safeId(id: string): string | null {
  const trimmed = id.trim();
  if (!trimmed || trimmed.length > 80) return null;
  if (!/^[a-zA-Z0-9_-]+$/.test(trimmed)) return null;
  return trimmed;
}

let tableReady: Promise<void> | null = null;

async function ensureTable() {
  tableReady ??= (async () => {
    const sql = await getSql();
    await sql.query(`
      create table if not exists kreia_jobs (
        id text primary key,
        type text not null,
        status text not null,
        result jsonb,
        error text,
        progress jsonb,
        checkpoint jsonb,
        payload jsonb,
        frames jsonb not null default '[]'::jsonb,
        audio_chunks jsonb not null default '[]'::jsonb,
        phase text,
        working boolean not null default false,
        created_at bigint not null,
        updated_at bigint not null
      )
    `);
    await sql.query(
      `create index if not exists kreia_jobs_updated_at_idx on kreia_jobs (updated_at)`,
    );
  })().catch((err) => {
    tableReady = null;
    throw err;
  });
  await tableReady;
}

function asJson(value: unknown): string {
  return JSON.stringify(value ?? null);
}

function parseJson<T>(value: unknown, fallback: T): T {
  if (value == null) return fallback;
  if (typeof value === "string") {
    try {
      return JSON.parse(value) as T;
    } catch {
      return fallback;
    }
  }
  return value as T;
}

type JobRow = {
  id: string;
  type: string;
  status: string;
  result: unknown;
  error: string | null;
  progress: unknown;
  checkpoint: unknown;
  payload: unknown;
  frames: unknown;
  audio_chunks: unknown;
  phase: string | null;
  working: boolean | null;
  created_at: number | string;
  updated_at: number | string;
};

function rowToJob(row: JobRow): PersistedJob {
  const createdAt = Number(row.created_at) || Date.now();
  const updatedAt = Number(row.updated_at) || createdAt;
  const status =
    row.status === "pending" || row.status === "running" || row.status === "ok" || row.status === "error"
      ? row.status
      : "pending";
  return {
    id: row.id,
    type: row.type,
    status,
    result: parseJson(row.result, undefined),
    error: row.error ?? undefined,
    progress: parseJson(row.progress, undefined),
    checkpoint: parseJson(row.checkpoint, undefined),
    payload: parseJson(row.payload, undefined),
    phase: row.phase ?? undefined,
    working: Boolean(row.working),
    createdAt,
    updatedAt,
    frames: parseJson(row.frames, []),
    audioChunks: parseJson(row.audio_chunks, []),
  };
}

export async function persistJob(job: PersistedJob, opts?: { light?: boolean }): Promise<void> {
  const id = safeId(job.id);
  if (!id) return;
  try {
    const sql = await getSql();
    await ensureTable();
    const now = Date.now();
    const frames = opts?.light ? undefined : job.frames ?? [];
    const audio = opts?.light ? undefined : job.audioChunks ?? [];
    if (opts?.light) {
      await sql.query(
        `update kreia_jobs set
          type = $2,
          status = $3,
          result = $4::jsonb,
          error = $5,
          progress = $6::jsonb,
          checkpoint = $7::jsonb,
          payload = $8::jsonb,
          phase = $9,
          working = $10,
          updated_at = $11
        where id = $1`,
        [
          id,
          job.type,
          job.status,
          asJson(job.result ?? null),
          job.error ?? null,
          asJson(job.progress ?? null),
          asJson(job.checkpoint ?? null),
          asJson(job.payload ?? null),
          job.phase ?? null,
          Boolean(job.working),
          now,
        ],
      );
      return;
    }
    await sql.query(
      `insert into kreia_jobs (
          id, type, status, result, error, progress, checkpoint, payload,
          frames, audio_chunks, phase, working, created_at, updated_at
        ) values (
          $1, $2, $3, $4::jsonb, $5, $6::jsonb, $7::jsonb, $8::jsonb,
          $9::jsonb, $10::jsonb, $11, $12, $13, $14
        )
        on conflict (id) do update set
          type = excluded.type,
          status = excluded.status,
          result = excluded.result,
          error = excluded.error,
          progress = excluded.progress,
          checkpoint = excluded.checkpoint,
          payload = excluded.payload,
          frames = excluded.frames,
          audio_chunks = excluded.audio_chunks,
          phase = excluded.phase,
          working = excluded.working,
          updated_at = excluded.updated_at`,
      [
        id,
        job.type,
        job.status,
        asJson(job.result ?? null),
        job.error ?? null,
        asJson(job.progress ?? null),
        asJson(job.checkpoint ?? null),
        asJson(job.payload ?? null),
        asJson(frames),
        asJson(audio),
        job.phase ?? null,
        Boolean(job.working),
        job.createdAt || now,
        now,
      ],
    );
  } catch (err) {
    console.error("[ANALYSIS SESSION] persist failed", job.id, err);
  }
}

export async function readJob(id: string): Promise<PersistedJob | null> {
  const safe = safeId(id);
  if (!safe) return null;
  try {
    const sql = await getSql();
    await ensureTable();
    const rows = await sql.query<JobRow>("select * from kreia_jobs where id = $1", [safe]);
    const row = rows[0];
    if (!row) return null;
    const parsed = rowToJob(row);
    if (Date.now() - parsed.createdAt > MAX_AGE_MS) {
      await forgetJob(safe);
      return null;
    }
    if (
      parsed.status === "running" &&
      Date.now() - (parsed.updatedAt || parsed.createdAt) > STALE_RUNNING_MS
    ) {
      parsed.status = "error";
      parsed.error = "L'analyse a dépassé le délai prévu. Reprenez l'analyse.";
      parsed.working = false;
      await persistJob(parsed, { light: true });
    }
    return parsed;
  } catch (err) {
    console.error("[ANALYSIS SESSION] read failed", id, err);
    return null;
  }
}

export async function tryLockJob(id: string): Promise<PersistedJob | null> {
  const safe = safeId(id);
  if (!safe) return null;
  try {
    const sql = await getSql();
    await ensureTable();
    const staleBefore = Date.now() - 150_000;
    const rows = await sql.query<JobRow>(
      `update kreia_jobs
       set working = true, updated_at = $2
       where id = $1
         and status = 'running'
         and (working = false or updated_at < $3)
       returning *`,
      [safe, Date.now(), staleBefore],
    );
    const row = rows[0];
    return row ? rowToJob(row) : null;
  } catch (err) {
    console.error("[ANALYSIS SESSION] lock failed", id, err);
    return null;
  }
}

export async function forgetJob(id: string): Promise<void> {
  const safe = safeId(id);
  if (!safe) return;
  try {
    const sql = await getSql();
    await ensureTable();
    await sql.query("delete from kreia_jobs where id = $1", [safe]);
  } catch {
    /* missing is fine */
  }
}

export async function pruneJobFiles(): Promise<void> {
  try {
    const sql = await getSql();
    await ensureTable();
    const cutoff = Date.now() - MAX_AGE_MS;
    await sql.query("delete from kreia_jobs where created_at < $1", [cutoff]);
  } catch {
    /* ignore */
  }
}
