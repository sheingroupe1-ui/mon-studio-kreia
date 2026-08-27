import { proposeSegments, type TimeSegment } from "./duration.ts";
import { chat } from "../llm.ts";
import { tryExtractJson } from "../parse.ts";
import type { SegmentNote } from "../types.ts";

export type StructureStatus = "complete" | "fallback";

export type VideoStructure = {
  duration: number;
  segments: SegmentNote[];
  structureStatus: StructureStatus;
  rhythm: string;
};

function logStructure(msg: string, extra?: unknown) {
  if (extra === undefined) console.info("[STRUCTURE]", msg);
  else console.info("[STRUCTURE]", msg, extra);
}

function logStructureError(subStep: string, err: unknown, extra?: Record<string, unknown>) {
  const error = err instanceof Error ? err : new Error(String(err ?? "unknown"));
  console.error("[STRUCTURE ERROR]", {
    exactSubStep: subStep,
    errorName: error.name,
    errorMessage: error.message,
    stack: error.stack,
    ...extra,
  });
}

function toNotes(segs: TimeSegment[]): SegmentNote[] {
  return segs.map((s) => ({
    index: s.index,
    start: s.start,
    end: s.end,
    frameTimes: Array.isArray(s.frameTimes) ? s.frameTimes : [],
  }));
}

export function fallbackStructure(durationSeconds: number, frameTimes: number[]): VideoStructure {
  const duration = Number.isFinite(durationSeconds) && durationSeconds > 0 ? durationSeconds : 1;
  const times = (frameTimes ?? []).filter((t) => Number.isFinite(t));
  const segs = proposeSegments(duration, times);
  const notes = segs.length ? toNotes(segs) : [{ index: 0, start: 0, end: duration, frameTimes: times }];
  return {
    duration,
    segments: notes,
    structureStatus: "fallback",
    rhythm: duration <= 11 ? "plan unique" : "rythme régulier",
  };
}

function pickStructureTimes(duration: number, frameTimes: number[]): number[] {
  const times = [...frameTimes].filter((t) => Number.isFinite(t)).sort((a, b) => a - b);
  if (times.length <= 3) return times;
  const marks = duration <= 12 ? [0, 0.5, 1] : [0, 0.25, 0.5, 0.75, 1];
  const picked: number[] = [];
  for (const m of marks) {
    const target = m * duration;
    const nearest = times.reduce((a, b) => (Math.abs(b - target) < Math.abs(a - target) ? b : a));
    if (!picked.some((t) => Math.abs(t - nearest) < 0.2)) picked.push(nearest);
  }
  return picked;
}

function parseStructureResponse(raw: unknown, duration: number, frameTimes: number[]): TimeSegment[] | null {
  if (raw == null) return null;
  const rec = typeof raw === "object" && !Array.isArray(raw) ? (raw as Record<string, unknown>) : null;
  const list = Array.isArray(raw)
    ? raw
    : rec && Array.isArray(rec.segments)
      ? rec.segments
      : rec && Array.isArray(rec.structure)
        ? rec.structure
        : rec && rec.data && typeof rec.data === "object" && Array.isArray((rec.data as { segments?: unknown }).segments)
          ? (rec.data as { segments: unknown[] }).segments
          : null;
  if (!list?.length) return null;
  const segs: TimeSegment[] = [];
  for (const [i, item] of list.entries()) {
    if (!item || typeof item !== "object") continue;
    const o = item as Record<string, unknown>;
    const start = Number(o.start ?? o.from ?? 0);
    const end = Number(o.end ?? o.to ?? duration);
    if (!Number.isFinite(start) || !Number.isFinite(end)) continue;
    const a = Math.max(0, Math.min(duration, start));
    const b = Math.max(a + 0.4, Math.min(duration, end));
    const owned = frameTimes.filter((t) => t >= a && t <= b);
    segs.push({
      index: i,
      start: a,
      end: b,
      frameTimes: owned.length ? owned : frameTimes.slice(0, 1),
    });
  }
  return segs.length ? segs : null;
}

async function requestStructure(duration: number, frameTimes: number[]): Promise<TimeSegment[] | null> {
  const marks = pickStructureTimes(duration, frameTimes);
  logStructure("Preparing structure request", { marks });
  logStructure("Request sent");
  const result = await chat({
    messages: [
      {
        role: "system",
        content:
          'Tu décris UNIQUEMENT la structure temporelle d\'une vidéo. Pas de personnages, pas d\'histoire détaillée. JSON : { "rhythm":"string", "segments":[{ "start":0, "end":1, "type":"opening|development|climax|resolution|main_sequence" }] }. Les segments couvrent 0 → durée sans trou.',
      },
      {
        role: "user",
        content: `Durée réelle : ${duration.toFixed(1)} s. Instants des images-clés : ${marks.map((t) => t.toFixed(1) + "s").join(", ") || "aucun"}. Découpe structurel approximatif (début / milieu / fin).`,
      },
    ],
    maxTokens: 700,
    timeoutMs: 20_000,
  });
  logStructure("Waiting for response");
  if (!result || typeof result !== "object") {
    logStructureError("response", "empty result", { responseReceived: false });
    return null;
  }
  const ok = "ok" in result && result.ok === true;
  logStructure("Response received", { ok, keys: Object.keys(result) });
  logStructure("Response type: " + typeof result);
  if (!ok || !("text" in result) || typeof result.text !== "string") {
    logStructureError("response", "ok" in result && !result.ok ? result.error : "no text", {
      responseReceived: true,
      responseType: typeof result,
    });
    return null;
  }
  logStructure("Parsing response");
  const parsed = tryExtractJson(result.text);
  const segs = parseStructureResponse(parsed, duration, frameTimes);
  return segs;
}

export async function analyzeStructure(args: {
  durationSeconds: number;
  frameTimes: number[];
  width?: number;
  height?: number;
}): Promise<VideoStructure> {
  const duration = Number(args.durationSeconds);
  const times = Array.isArray(args.frameTimes) ? args.frameTimes.filter((t) => Number.isFinite(t)) : [];
  logStructure("Starting analysis");
  logStructure(`Video source available: ${Number.isFinite(duration) && duration > 0}`);
  logStructure(`Duration: ${Number.isFinite(duration) ? duration.toFixed(1) : "invalid"} seconds`);
  logStructure("Frames extraction started");
  const marks = pickStructureTimes(duration, times);
  logStructure(`Frames extracted: ${marks.length}`, { times: marks });

  const fallback = fallbackStructure(duration, times);

  if (!Number.isFinite(duration) || duration <= 0) {
    logStructureError("validate", "invalid duration");
    return fallback;
  }

  try {
    let segs = await requestStructure(duration, times);
    if (!segs) {
      logStructure("Retrying once");
      try {
        segs = await requestStructure(duration, times);
      } catch (err) {
        logStructureError("retry", err, { framesCount: marks.length, responseReceived: false });
      }
    }
    if (segs?.length) {
      logStructure("Structure validated", { count: segs.length });
      const result: VideoStructure = {
        duration,
        segments: toNotes(segs),
        structureStatus: "complete",
        rhythm: segs.length <= 1 ? "plan unique" : `${segs.length} mouvements`,
      };
      logStructure("State updated");
      logStructure("Moving to step 3");
      return result;
    }
  } catch (err) {
    logStructureError("request", err, { framesCount: marks.length, responseReceived: false });
  }

  logStructure("Using fallback structure", { segments: fallback.segments.length });
  logStructure("State updated");
  logStructure("Moving to step 3");
  return fallback;
}
