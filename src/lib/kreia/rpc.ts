/** Client-side helpers around TanStack Start server functions. */

const LOG = "[kreia]";

/** Keep analysis RPC payloads under typical preview/proxy body limits. */
export const MAX_ANALYZE_CHARS = 380_000;

export const TRANSPORT_MESSAGE = "L'analyse n'a pas pu aboutir. Réessayez.";

export function logKreia(stage: string, detail?: unknown) {
  if (detail === undefined) {
    console.info(LOG, stage);
    return;
  }
  console.info(LOG, stage, detail);
}

export function logKreiaError(stage: string, err: unknown) {
  console.error(LOG, stage, err);
}

function errorText(err: unknown): string {
  if (err instanceof Error) return err.message;
  if (typeof err === "string") return err;
  return "";
}

export function isTransportError(err: unknown): boolean {
  const lower = errorText(err).toLowerCase();
  if (!lower) return false;
  return (
    lower.includes("failed to fetch") ||
    lower.includes("networkerror") ||
    lower.includes("load failed") ||
    lower.includes("network request failed") ||
    lower.includes("impossible de contacter") ||
    lower.includes("n'a pas pu aboutir") ||
    lower.includes("payload too large") ||
    lower.includes("413") ||
    lower.includes("<!doctype") ||
    lower.includes("<html") ||
    lower.includes("no-js ie") ||
    lower.includes("cloudflare") ||
    ((lower.includes("cannot read properties of undefined") ||
      lower.includes("cannot read property")) &&
      lower.includes("ok"))
  );
}

export function userFacingError(err: unknown, fallback: string): string {
  const msg = errorText(err).trim();
  if (!msg) return fallback;

  const lower = msg.toLowerCase();
  if (isTransportError(err)) return TRANSPORT_MESSAGE;
  if (lower.includes("introuvable") || lower.includes("n'est plus disponible")) {
    return "La session d'analyse n'est plus disponible. Relancez l'analyse.";
  }
  if (lower.includes("aborted") || lower.includes("timeout") || lower.includes("timed out")) {
    return "L'analyse a dépassé le délai imparti. Réessayez avec une vidéo plus courte.";
  }
  if (
    lower.includes("invariant failed") ||
    lower.includes("content-type header") ||
    lower.includes("expected result to be resolved") ||
    lower === "forbidden"
  ) {
    return "L'analyse n'a pas pu être terminée. La réponse reçue est invalide. Veuillez réessayer.";
  }
  return msg;
}

type OkResult<T> = T & { ok: true };
type FailResult = { ok: false; error?: string; message?: string };

function isOkShape(value: unknown): value is { ok: boolean } {
  return (
    Boolean(value) &&
    typeof value === "object" &&
    typeof (value as { ok?: unknown }).ok === "boolean"
  );
}

function summarizeRpc(value: unknown) {
  if (value == null) return value;
  if (typeof value !== "object") return String(value).slice(0, 220);
  const rec = value as Record<string, unknown>;
  return {
    keys: Object.keys(rec).slice(0, 12),
    ok: rec.ok,
    hasResult: "result" in rec,
    hasError: "error" in rec,
    resultOk:
      rec.result && typeof rec.result === "object"
        ? (rec.result as { ok?: unknown }).ok
        : undefined,
  };
}

/**
 * TanStack Start's client wrapper does `return middleware.result`.
 * Depending on content-type / proxy, the RPC layer may hand us:
 *   1. the handler value `{ ok, ... }`
 *   2. the serialized envelope `{ result, error, context }`
 *   3. `undefined` (empty body, 413, aborted HMR, stripped header)
 * Never read `.ok` until the value is known to be an ok-shaped object.
 */
export function readServerResult<T extends { ok: boolean }>(value: T, label: string): T;
export function readServerResult<T extends { ok: boolean }>(
  value: T | { result?: T | null; error?: unknown } | null | undefined,
  label: string,
): T;
export function readServerResult(value: unknown, label: string): { ok: boolean };
export function readServerResult(
  value: unknown,
  label: string,
): { ok: boolean } {
  if (value instanceof Error) {
    logKreiaError(`${label} RPC threw`, value);
    throw value;
  }

  if (value && typeof value === "object") {
    const rec = value as { result?: unknown; error?: unknown; ok?: unknown };

    if (rec.error instanceof Error) {
      logKreiaError(`${label} RPC error field`, rec.error);
      throw rec.error;
    }

    if (
      typeof rec.error === "string" &&
      rec.error.trim() &&
      rec.result === undefined &&
      typeof rec.ok !== "boolean"
    ) {
      logKreiaError(`${label} RPC string error`, rec.error);
      throw new Error(rec.error);
    }

    if (isOkShape(rec.result)) {
      return rec.result;
    }
    if (isOkShape(rec)) {
      return rec;
    }
  }

  logKreiaError(`${label} empty RPC result`, summarizeRpc(value));
  throw new Error(TRANSPORT_MESSAGE);
}

export function failMessage(
  result: { error?: string; message?: string } | null | undefined,
  fallback: string,
): string {
  const text = (result?.error ?? result?.message ?? "").trim();
  if (!text) return fallback;
  const lower = text.toLowerCase();
  if (
    lower.startsWith("<!doctype") ||
    lower.startsWith("<html") ||
    lower.includes("no-js ie") ||
    lower.includes("cloudflare") ||
    lower.includes("introuvable") ||
    lower.includes("n'est plus disponible") ||
    (lower.startsWith("{") && lower.includes("error"))
  ) {
    return fallback;
  }
  return text;
}

export function fitAnalyzePayload<F extends { t: number; dataUrl: string }>(input: {
  frames: F[];
  audioWavBase64: string | null;
}): {
  frames: F[];
  audioWavBase64: string | null;
  droppedAudio: boolean;
  droppedFrames: number;
} {
  let frames = input.frames.slice();
  let audioWavBase64 = input.audioWavBase64;
  let droppedAudio = false;
  const size = () =>
    frames.reduce((n, f) => n + f.dataUrl.length, 0) + (audioWavBase64?.length ?? 0);

  if (size() > MAX_ANALYZE_CHARS && audioWavBase64) {
    audioWavBase64 = null;
    droppedAudio = true;
  }

  const startCount = frames.length;
  while (size() > MAX_ANALYZE_CHARS && frames.length > 2) {
    const idx = Math.min(frames.length - 2, Math.max(1, Math.floor(frames.length / 2)));
    frames = frames.filter((_, i) => i !== idx);
  }

  return {
    frames,
    audioWavBase64,
    droppedAudio,
    droppedFrames: startCount - frames.length,
  };
}

export type { OkResult, FailResult };
