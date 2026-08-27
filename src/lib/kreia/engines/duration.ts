import type { SceneAnalysis, SceneDuration, SceneProduction } from "../types";

export const PROMPT_DURATIONS = [6, 8, 10] as const;

/** Max scenes for a source: never more than one prompt per ~6s. */
export function maxSceneCount(sourceDuration: number): number {
  if (!Number.isFinite(sourceDuration) || sourceDuration <= 0) return 1;
  if (sourceDuration <= 11) return 1;
  if (sourceDuration <= 16) return 2;
  return Math.max(1, Math.round(sourceDuration / 6));
}

export function minSceneCount(sourceDuration: number): number {
  if (!Number.isFinite(sourceDuration) || sourceDuration <= 0) return 1;
  if (sourceDuration <= 16) return 1;
  return Math.max(1, Math.round(sourceDuration / 10));
}

export function chooseSceneCount(sourceDuration: number, proposed: number): number {
  const min = minSceneCount(sourceDuration);
  const max = maxSceneCount(sourceDuration);
  const p = Number.isFinite(proposed) ? Math.round(proposed) : min;
  return Math.min(max, Math.max(min, p));
}

export function closestPromptDuration(seconds: number): SceneDuration {
  if (seconds <= 7) return 6;
  if (seconds <= 9) return 8;
  return 10;
}

export function packDurations(sourceDuration: number, count: number): SceneDuration[] {
  const n = Math.max(1, Math.round(count));
  if (n === 1) return [closestPromptDuration(sourceDuration)];

  const share = sourceDuration / n;
  const durations: SceneDuration[] = Array.from({ length: n }, () => closestPromptDuration(share));
  let sum = durations.reduce((a, b) => a + b, 0);
  let guard = 0;
  while (Math.abs(sum - sourceDuration) > 1.25 && guard < 48) {
    guard += 1;
    if (sum > sourceDuration) {
      const idx = [...durations.keys()].reverse().find((i) => durations[i]! > 6);
      if (idx === undefined) break;
      const next: SceneDuration = durations[idx] === 10 ? 8 : 6;
      sum += next - durations[idx]!;
      durations[idx] = next;
    } else {
      const idx = durations.findIndex((d) => d < 10);
      if (idx < 0) break;
      const next: SceneDuration = durations[idx] === 6 ? 8 : 10;
      sum += next - durations[idx]!;
      durations[idx] = next;
    }
  }
  return durations;
}

export function totalPackedDuration(durations: readonly number[]): number {
  return durations.reduce((a, b) => a + b, 0);
}

export function splitEven(length: number, buckets: number): number[][] {
  const n = Math.max(1, length);
  const k = Math.min(n, Math.max(1, buckets));
  const out: number[][] = [];
  let cursor = 0;
  for (let i = 0; i < k; i += 1) {
    const remaining = n - cursor;
    const left = k - i;
    const size = Math.max(1, Math.round(remaining / left));
    const group: number[] = [];
    for (let j = 0; j < size && cursor < n; j += 1) {
      group.push(cursor);
      cursor += 1;
    }
    if (group.length) out.push(group);
  }
  while (cursor < n) {
    out[out.length - 1]!.push(cursor);
    cursor += 1;
  }
  return out;
}

function mergeText(values: string[], sep = " Puis "): string {
  const seen = new Set<string>();
  const parts: string[] = [];
  for (const raw of values) {
    const t = raw.trim();
    if (!t) continue;
    const key = t.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    parts.push(t);
  }
  return parts.join(sep);
}

function joinDialogues(values: (string | null | undefined)[]): string | null {
  const parts: string[] = [];
  const seen = new Set<string>();
  for (const raw of values) {
    const t = (raw ?? "").trim();
    if (!t) continue;
    const key = t.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    parts.push(t);
  }
  return parts.length ? parts.join("\n") : null;
}

function joinSpeakers(values: (string | null | undefined)[]): string | null {
  const joined = mergeText(
    values.filter((v): v is string => Boolean(v && v.trim())),
    ", ",
  );
  return joined || null;
}

export function collapseAnalysisScenes(
  scenes: SceneAnalysis[],
  sourceDuration: number,
): SceneAnalysis[] {
  if (!scenes.length) {
    const duration = closestPromptDuration(sourceDuration);
    return [
      {
        number: 1,
        estimatedDuration: duration,
        startHint: "0s",
        characters: [],
        setting: "",
        action: "",
        emotion: "",
        camera: "",
        lighting: "",
        audio: "",
        dialogue: null,
        dialogueSpeaker: null,
        styleNotes: "",
        confidence: "inferred",
        silentReactions: [],
      },
    ];
  }
  const count = chooseSceneCount(sourceDuration, scenes.length);
  const groups = splitEven(scenes.length, count);
  const durations = packDurations(sourceDuration, groups.length);
  return groups.map((idxs, i) => {
    const chunk = idxs.map((j) => scenes[j]!);
    const first = chunk[0]!;
    const characters = [...new Set(chunk.flatMap((s) => s.characters))];
    return {
      ...first,
      number: i + 1,
      estimatedDuration: durations[i] ?? closestPromptDuration(sourceDuration / groups.length),
      startHint: first.startHint || `${Math.round((i * sourceDuration) / groups.length)}s`,
      characters,
      setting: mergeText(chunk.map((s) => s.setting), " / "),
      action: mergeText(chunk.map((s) => s.action)),
      emotion: mergeText(chunk.map((s) => s.emotion), " ; "),
      camera: first.camera,
      lighting: first.lighting,
      audio: mergeText(chunk.map((s) => s.audio), " ; "),
      dialogue: joinDialogues(chunk.map((s) => s.dialogue)),
      dialogueSpeaker: joinSpeakers(chunk.map((s) => s.dialogueSpeaker)),
      styleNotes: mergeText(chunk.map((s) => s.styleNotes), " ; "),
      confidence: chunk.every((s) => s.confidence === "observed") ? "observed" : "inferred",
      silentReactions: chunk.flatMap((s) => s.silentReactions ?? []),
    };
  });
}

export function collapseProductionScenes(
  scenes: SceneProduction[],
  sourceDuration: number,
): SceneProduction[] {
  if (!scenes.length) return scenes;
  const count = chooseSceneCount(sourceDuration, scenes.length);
  const groups = splitEven(scenes.length, count);
  const durations = packDurations(sourceDuration, groups.length);
  return groups.map((idxs, i) => {
    const chunk = idxs.map((j) => scenes[j]!);
    const first = chunk[0]!;
    return {
      ...first,
      number: i + 1,
      duration: durations[i] ?? closestPromptDuration(sourceDuration / groups.length),
      characters: [...new Set(chunk.flatMap((s) => s.characters))],
      location: mergeText(chunk.map((s) => s.location), " / "),
      action: mergeText(chunk.map((s) => s.action)),
      emotion: mergeText(chunk.map((s) => s.emotion), " ; "),
      audio: mergeText(chunk.map((s) => s.audio), " ; "),
      dialogue: joinDialogues(chunk.map((s) => s.dialogue)),
      continuityNotes:
        i === 0
          ? first.continuityNotes
          : `Suite de la scène ${String(i).padStart(2, "0")}. ${first.continuityNotes}`.trim(),
    };
  });
}

export type TimeSegment = {
  index: number;
  start: number;
  end: number;
  frameTimes: number[];
};

export function proposeSegments(duration: number, frameTimes: number[]): TimeSegment[] {
  const times = [...frameTimes].filter((t) => Number.isFinite(t)).sort((a, b) => a - b);
  const count = chooseSceneCount(duration, Math.max(1, Math.round(duration / 8)));
  if (count <= 1) {
    return [{ index: 0, start: 0, end: duration, frameTimes: times }];
  }
  const slice = duration / count;
  const segs: TimeSegment[] = [];
  for (let i = 0; i < count; i += 1) {
    const start = i * slice;
    const end = i === count - 1 ? duration : (i + 1) * slice;
    let owned = times.filter((t) => t >= start && (i === count - 1 ? t <= end : t < end));
    if (!owned.length && times.length) {
      const mid = (start + end) / 2;
      const nearest = times.reduce((a, b) => (Math.abs(b - mid) < Math.abs(a - mid) ? b : a));
      owned = [nearest];
    }
    segs.push({ index: i, start, end, frameTimes: owned });
  }
  return segs;
}
