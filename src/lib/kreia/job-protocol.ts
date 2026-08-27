export const JOB_TRANSPORT_MESSAGE = "L'analyse n'a pas pu aboutir. Réessayez.";
export const JOB_MISSING_MESSAGE = "La session d'analyse n'est plus disponible. Relancez l'analyse.";

export const KREIA_JOBS_PATH = "/kreia/jobs";

export type JobProgress = {
  step: number;
  total: number;
  label: string;
  segmentsDone?: number;
  segmentsTotal?: number;
  compact?: boolean;
};

export type JobClientSnapshot = {
  id: string;
  status: "pending" | "running" | "ok" | "error";
  result?: unknown;
  error?: string;
  frameCount?: number;
  progress?: JobProgress;
};

export function messageFromHttpBody(body: string, status: number): string {
  const trimmed = body.trim();
  if (!trimmed) {
    return status === 404 ? JOB_MISSING_MESSAGE : JOB_TRANSPORT_MESSAGE;
  }
  if (looksLikeHtml(trimmed)) return JOB_TRANSPORT_MESSAGE;
  try {
    const parsed = JSON.parse(trimmed) as { error?: unknown; ok?: unknown };
    if (parsed && typeof parsed.error === "string" && parsed.error.trim()) {
      const err = parsed.error.trim();
      if (/introuvable/i.test(err) || err.startsWith("{")) return JOB_MISSING_MESSAGE;
      return err.slice(0, 220);
    }
  } catch {
    /* not json */
  }
  if (/introuvable/i.test(trimmed) || trimmed.startsWith("{")) return JOB_MISSING_MESSAGE;
  if (status === 404) return JOB_MISSING_MESSAGE;
  if (status === 413) return "payload too large";
  return JOB_TRANSPORT_MESSAGE;
}

export class JobTransportError extends Error {
  phase: "post" | "poll";
  constructor(message: string, phase: "post" | "poll") {
    super(message);
    this.name = "JobTransportError";
    this.phase = phase;
  }
}

export function looksLikeHtml(text: string): boolean {
  const t = text.trim().slice(0, 120).toLowerCase();
  return (
    t.startsWith("<!doctype") ||
    t.startsWith("<html") ||
    t.includes("no-js ie") ||
    t.includes("cloudflare")
  );
}

export function parseJobSnapshot(value: unknown): JobClientSnapshot {
  if (!value || typeof value !== "object") {
    throw new Error(JOB_TRANSPORT_MESSAGE);
  }
  const rec = value as Record<string, unknown>;
  const status = rec.status;
  if (
    status !== "pending" &&
    status !== "running" &&
    status !== "ok" &&
    status !== "error"
  ) {
    throw new Error(JOB_TRANSPORT_MESSAGE);
  }
  const id = typeof rec.id === "string" ? rec.id : "";
  if (!id) throw new Error(JOB_TRANSPORT_MESSAGE);
  const progress =
    rec.progress && typeof rec.progress === "object"
      ? (rec.progress as JobProgress)
      : undefined;
  return {
    id,
    status,
    result: rec.result,
    error: typeof rec.error === "string" ? rec.error : undefined,
    frameCount: typeof rec.frameCount === "number" ? rec.frameCount : undefined,
    progress,
  };
}

export function isPostTransportError(err: unknown): boolean {
  return err instanceof JobTransportError && err.phase === "post";
}

export function jpegPayload(dataUrl: string): string {
  const marker = "base64,";
  const i = dataUrl.indexOf(marker);
  return i >= 0 ? dataUrl.slice(i + marker.length) : dataUrl;
}
