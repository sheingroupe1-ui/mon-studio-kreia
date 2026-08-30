import type { SceneAnalysis, SceneDuration, SceneProduction } from "../types";

export const PROMPT_DURATIONS = [6, 8, 10] as const;
export const MAX_PROMPT_SECONDS = 10;

/** Exact scene count: ceil(duration / 10). A 60s source → 6 prompts. */
export function inferSourceDuration(
  declared: number | undefined,
  extras?: { frameTimes?: number[]; segmentEnds?: number[]; lastDialogueTime?: number },
): number {
  const candidates = [
    declared,
    ...(extras?.frameTimes ?? []),
    ...(extras?.segmentEnds ?? []),
    extras?.lastDialogueTime,
  ]
    .map((value) => Number(value))
    .filter((value) => Number.isFinite(value) && value > 0);
  if (!candidates.length) return 0;
  return Math.max(...candidates);
}

export function expectedSceneCount(sourceDuration: number): number {
  if (!Number.isFinite(sourceDuration) || sourceDuration <= 0) return 1;
  if (sourceDuration <= MAX_PROMPT_SECONDS) return 1;
  return Math.ceil(sourceDuration / MAX_PROMPT_SECONDS);
}

export function minSceneCount(sourceDuration: number): number {
  return expectedSceneCount(sourceDuration);
}

export function maxSceneCount(sourceDuration: number): number {
  return expectedSceneCount(sourceDuration);
}

export function chooseSceneCount(sourceDuration: number, _proposed?: number): number {
  return expectedSceneCount(sourceDuration);
}

export function sceneWindows(sourceDuration: number): Array<{ start: number; end: number }> {
  const duration = Math.max(0, Number(sourceDuration) || 0);
  const count = expectedSceneCount(duration);
  const windows: Array<{ start: number; end: number }> = [];
  for (let i = 0; i < count; i += 1) {
    const start = i * MAX_PROMPT_SECONDS;
    const end = i === count - 1 ? duration : Math.min(duration, (i + 1) * MAX_PROMPT_SECONDS);
    windows.push({ start, end: Math.max(start, end) });
  }
  return windows;
}

export function sceneIndexAt(time: number, sourceDuration: number): number {
  const windows = sceneWindows(sourceDuration);
  if (!windows.length) return 1;
  const t = Number.isFinite(time) ? Math.max(0, time) : 0;
  for (let i = 0; i < windows.length; i += 1) {
    const w = windows[i]!;
    const last = i === windows.length - 1;
    if (t >= w.start && (last ? t <= w.end + 0.001 : t < w.end)) return i + 1;
  }
  return windows.length;
}

export function formatClock(seconds: number): string {
  const s = Math.max(0, Number(seconds) || 0);
  const m = Math.floor(s / 60);
  const r = Math.floor(s % 60);
  return `${String(m).padStart(2, "0")}:${String(r).padStart(2, "0")}`;
}

export function closestPromptDuration(seconds: number): SceneDuration {
  if (seconds <= 7) return 6;
  if (seconds <= 9) return 8;
  return 10;
}

export function packDurations(sourceDuration: number, count?: number): SceneDuration[] {
  const windows = sceneWindows(sourceDuration);
  const n = Math.max(1, count ?? windows.length);
  if (n === windows.length) {
    return windows.map((w) => closestPromptDuration(Math.max(0.1, w.end - w.start)));
  }
  if (n === 1) return [closestPromptDuration(sourceDuration)];
  const share = sourceDuration / n;
  return Array.from({ length: n }, () => closestPromptDuration(Math.min(MAX_PROMPT_SECONDS, share)));
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

function bucketItems<T>(items: T[], count: number): T[][] {
  const k = Math.max(1, count);
  if (!items.length) return Array.from({ length: k }, () => []);
  if (items.length === k) return items.map((item) => [item]);
  if (items.length > k) {
    return splitEven(items.length, k).map((idxs) => idxs.map((i) => items[i]!));
  }
  const buckets: T[][] = Array.from({ length: k }, () => []);
  for (let i = 0; i < k; i += 1) {
    const src = Math.min(items.length - 1, Math.floor((i * items.length) / k));
    buckets[i]!.push(items[src]!);
  }
  return buckets;
}

function emptyAnalysisScene(index: number, duration: SceneDuration, start: number, end: number): SceneAnalysis {
  return {
    number: index + 1,
    estimatedDuration: duration,
    startHint: `${formatClock(start)} → ${formatClock(end)}`,
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
  };
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
  const windows = sceneWindows(sourceDuration);
  const durations = packDurations(sourceDuration);
  if (!scenes.length) {
    return windows.map((w, i) => emptyAnalysisScene(i, durations[i] ?? 10, w.start, w.end));
  }
  const expanding = scenes.length < windows.length;
  const groups = bucketItems(scenes, windows.length);
  return groups.map((chunk, i) => {
    const w = windows[i]!;
    const duration = durations[i] ?? closestPromptDuration(w.end - w.start);
    if (!chunk.length) return emptyAnalysisScene(i, duration, w.start, w.end);
    const first = chunk[0]!;
    const characters = [...new Set(chunk.flatMap((s) => s.characters))];
    return {
      ...first,
      number: i + 1,
      estimatedDuration: duration,
      startHint: `${formatClock(w.start)} → ${formatClock(w.end)}`,
      characters,
      setting: mergeText(chunk.map((s) => s.setting), " / ") || first.setting,
      action: mergeText(chunk.map((s) => s.action)) || first.action,
      emotion: mergeText(chunk.map((s) => s.emotion), " ; ") || first.emotion,
      camera: first.camera,
      lighting: first.lighting,
      audio: mergeText(chunk.map((s) => s.audio), " ; ") || first.audio,
      dialogue: expanding ? null : joinDialogues(chunk.map((s) => s.dialogue)),
      dialogueSpeaker: expanding ? first.dialogueSpeaker : joinSpeakers(chunk.map((s) => s.dialogueSpeaker)),
      styleNotes: mergeText(chunk.map((s) => s.styleNotes), " ; "),
      confidence: chunk.every((s) => s.confidence === "observed") ? "observed" : "inferred",
      silentReactions: chunk.flatMap((s) => s.silentReactions ?? []),
    };
  });
}

/** Filet : une seule scène IA + plusieurs répliques + durée > 16 s → scènes de production. */
export function splitOversizedAnalysisScene(
  scenes: SceneAnalysis[],
  sourceDuration: number,
): SceneAnalysis[] {
  const expected = expectedSceneCount(sourceDuration);
  if (sourceDuration <= 16 || expected <= 1) {
    return collapseAnalysisScenes(scenes, sourceDuration);
  }
  if (scenes.length === 1) {
    const scene = scenes[0]!;
    const units = (scene.dialogue ?? "")
      .split(/\n+/)
      .map((line) => line.trim())
      .filter(Boolean);
    const speakers = new Set(
      units
        .map((line) => {
          const m = line.match(/^(.+?)\s*[:—–]/);
          return m?.[1]?.trim();
        })
        .filter((name): name is string => Boolean(name && name.length < 40)),
    );
    if (units.length >= 2 || speakers.size >= 2) {
      const windows = sceneWindows(sourceDuration);
      const durations = packDurations(sourceDuration);
      const groups = bucketItems(units, expected);
      return windows.map((w, i) => {
        const chunk = groups[i] ?? [];
        return {
          ...scene,
          number: i + 1,
          estimatedDuration: durations[i] ?? 10,
          startHint: `${formatClock(w.start)} → ${formatClock(w.end)}`,
          action: scene.action,
          dialogue: chunk.length ? chunk.join("\n") : null,
          dialogueSpeaker: chunk.length === 1 ? chunk[0]!.split(/[:—–]/)[0]?.trim() ?? scene.dialogueSpeaker : scene.dialogueSpeaker,
          confidence: "inferred" as const,
        };
      });
    }
  }
  return collapseAnalysisScenes(scenes, sourceDuration);
}

export function collapseProductionScenes(
  scenes: SceneProduction[],
  sourceDuration: number,
): SceneProduction[] {
  const windows = sceneWindows(sourceDuration);
  const durations = packDurations(sourceDuration);
  if (!scenes.length) {
    return windows.map((w, i) => ({
      number: i + 1,
      duration: durations[i] ?? 10,
      characters: [],
      location: "",
      action: "",
      emotion: "",
      camera: "",
      lighting: "",
      visualStyle: "",
      audio: "",
      dialogue: null,
      videoPrompt: "",
      continuityNotes: i === 0 ? "" : `Suite de la scène ${String(i).padStart(2, "0")}.`,
    }));
  }
  const expanding = scenes.length < windows.length;
  const groups = bucketItems(scenes, windows.length);
  return groups.map((chunk, i) => {
    const first = chunk[0] ?? {
      number: i + 1,
      duration: 10 as SceneDuration,
      characters: [] as string[],
      location: "",
      action: "",
      emotion: "",
      camera: "",
      lighting: "",
      visualStyle: "",
      audio: "",
      dialogue: null as string | null,
      videoPrompt: "",
      continuityNotes: "",
    };
    return {
      ...first,
      number: i + 1,
      duration: durations[i] ?? closestPromptDuration(windows[i]!.end - windows[i]!.start),
      characters: [...new Set(chunk.flatMap((s) => s.characters))],
      location: mergeText(chunk.map((s) => s.location), " / ") || first.location,
      action: mergeText(chunk.map((s) => s.action)) || first.action,
      emotion: mergeText(chunk.map((s) => s.emotion), " ; ") || first.emotion,
      audio: mergeText(chunk.map((s) => s.audio), " ; ") || first.audio,
      dialogue: expanding ? null : joinDialogues(chunk.map((s) => s.dialogue)),
      videoPrompt: expanding ? "" : chunk.length === 1 ? first.videoPrompt : first.videoPrompt,
      formattedPrompt: expanding ? "" : first.formattedPrompt || "",
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
  const windows = sceneWindows(duration);
  return windows.map((w, i) => {
    let owned = times.filter((t) => t >= w.start && (i === windows.length - 1 ? t <= w.end : t < w.end));
    if (!owned.length) owned = [];
    return { index: i, start: w.start, end: w.end, frameTimes: owned };
  });
}

export function ideaSceneCount(durationSeconds: number): number {
  const d = Number.isFinite(durationSeconds) && durationSeconds > 0 ? durationSeconds : 60;
  return Math.min(24, expectedSceneCount(d));
}

export function defaultIdeaDuration(idea: string): number {
  const words = idea.trim().split(/\s+/).filter(Boolean).length;
  if (words < 20) return 30;
  if (words < 80) return 60;
  if (words < 160) return 120;
  return 180;
}
