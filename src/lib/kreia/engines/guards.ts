import { expectedSceneCount, MAX_PROMPT_SECONDS } from "./duration.ts";
import { linesForScene } from "./dialogues.ts";
import type { ProductionPlan, VideoAnalysis } from "../types.ts";

export function validateIsolatedProduction(
  analysis: VideoAnalysis,
  production: ProductionPlan,
  durationSeconds: number,
): string | null {
  const expected = expectedSceneCount(durationSeconds);
  if (durationSeconds > 10 && production.scenes.length < 2) {
    return `Vidéo de ${durationSeconds.toFixed(0)} s : au moins 2 scènes requises.`;
  }
  if (production.scenes.length !== expected) {
    return `Nombre de scènes ${production.scenes.length} ≠ ${expected} (durée ${durationSeconds.toFixed(0)} s).`;
  }
  for (const scene of production.scenes) {
    if (scene.duration > MAX_PROMPT_SECONDS) {
      return `Scène ${scene.number} dure ${scene.duration} s (> 10).`;
    }
    const owned = linesForScene(analysis.dialogues?.lines ?? [], scene.number);
    const prompt = `${scene.videoPrompt ?? ""}\n${scene.formattedPrompt ?? ""}`;
    const leaked = (analysis.dialogues?.lines ?? []).filter((line) => {
      if (line.sceneNumber === scene.number) return false;
      const text = (line.sourceText || line.displayText || "").trim();
      return text.length >= 12 && prompt.includes(text);
    });
    if (leaked.length) {
      return `Scène ${scene.number} contient des répliques d'une autre scène.`;
    }
    if (scene.dialogue && owned.length === 0 && (analysis.dialogues?.lines ?? []).length > owned.length) {
      const global = analysis.dialogues?.lines ?? [];
      if (global.length > 2 && scene.dialogue.split("\n").length >= global.length) {
        return `Scène ${scene.number} concentre tous les dialogues.`;
      }
    }
  }
  return null;
}
