import type { ProductionPlan, ProjectKind, SceneProduction, VideoAnalysis } from "../types.ts";
import { composeLockedVideoPrompt, fitDialoguesToScenes, formatLockedDialogue, linesForScene } from "./dialogues.ts";
import {
  collapseAnalysisScenes,
  expectedSceneCount,
  inferSourceDuration,
  packDurations,
} from "./duration.ts";
import { expandCharacterIds } from "./continuity.ts";

export function durationFromProject(input: {
  durationSeconds?: number;
  frameTimes?: number[];
  analysis?: VideoAnalysis | null;
}): number {
  const lastSpoken = Math.max(
    0,
    ...(input.analysis?.dialogues?.lines ?? []).map((line) => Number(line.endTime ?? line.startTime ?? 0)),
  );
  return inferSourceDuration(input.durationSeconds, {
    frameTimes: input.frameTimes,
    lastDialogueTime: lastSpoken,
  });
}

export function splitAnalysis(analysis: VideoAnalysis, durationSeconds: number): VideoAnalysis {
  const duration = durationFromProject({ durationSeconds, analysis });
  if (duration <= 0) return analysis;
  const before = analysis.scenes.length;
  const scenes = collapseAnalysisScenes(analysis.scenes, duration);
  return fitDialoguesToScenes(
    { ...analysis, scenes, sceneCountEstimate: scenes.length },
    before,
    duration,
  );
}

function kindFromAnalysis(analysis: VideoAnalysis): ProjectKind {
  const type = analysis.characters[0]?.characterType;
  if (type === "fruit_humanoid") return "fruit-humanoid";
  if (type === "angel") return "angel";
  return "human";
}

function sceneFromAnalysis(
  analysis: VideoAnalysis,
  index: number,
  duration: ReturnType<typeof packDurations>[number],
  previous?: SceneProduction,
): SceneProduction {
  const scene = analysis.scenes[index];
  const n = scene?.number ?? index + 1;
  const owned = linesForScene(analysis.dialogues?.lines ?? [], n);
  const locked = formatLockedDialogue(owned);
  let who = "";
  try {
    who = scene ? expandCharacterIds(scene.characters, analysis.characters) : "";
  } catch {
    who = scene?.characters.join(", ") ?? "";
  }
  const style = analysis.visualStyle.lockedStylePhrase;
  const draft: SceneProduction = {
    number: n,
    duration,
    characters: scene?.characters ?? previous?.characters ?? [],
    location: previous?.location || scene?.setting || "",
    action: previous?.action || scene?.action || "",
    emotion: previous?.emotion || scene?.emotion || "",
    camera: previous?.camera || scene?.camera || "",
    lighting: previous?.lighting || scene?.lighting || "",
    visualStyle: previous?.visualStyle || style,
    audio: previous?.audio || scene?.audio || "",
    dialogue: locked,
    videoPrompt: "",
    continuityNotes:
      previous?.continuityNotes ||
      (index === 0 ? "Même identité, mêmes traits, même style." : `Suite de la scène ${String(index).padStart(2, "0")}.`),
  };
  try {
    draft.videoPrompt = composeLockedVideoPrompt({
      kind: kindFromAnalysis(analysis),
      scene: draft,
      analysis,
      lines: owned,
    });
  } catch {
    draft.videoPrompt = "";
  }
  if (!draft.videoPrompt) {
    const spoken = locked
      ? `Spoken French dialogue, one speaker at a time: ${locked}`
      : "No spoken dialogue.";
    draft.videoPrompt = `${style}. ${draft.location}. ${who}. Action: ${draft.action}. Camera: ${draft.camera}. ${spoken}`;
  }
  return draft;
}

export function splitProduction(
  production: ProductionPlan,
  analysis: VideoAnalysis,
  durationSeconds: number,
): ProductionPlan {
  const fitted = splitAnalysis(analysis, durationSeconds);
  const duration = durationFromProject({ durationSeconds, analysis: fitted });
  const expected = expectedSceneCount(duration);
  const durations = packDurations(duration);
  const scenes = Array.from({ length: expected }, (_, i) =>
    sceneFromAnalysis(
      fitted,
      i,
      durations[i] ?? 10,
      production.scenes.find((s) => s.number === i + 1) ?? production.scenes[i],
    ),
  );
  const first = scenes[0];
  return {
    ...production,
    hook: {
      ...production.hook,
      duration: first?.duration ?? production.hook.duration,
    },
    scenes,
  };
}
