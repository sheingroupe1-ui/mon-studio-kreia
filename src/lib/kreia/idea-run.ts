import { defaultIdeaDuration, ideaSceneCount } from "./engines/duration";
import { ideaProgressAt } from "./idea-stages";
import { runKreiaJob } from "./job-client";
import type { AnalysisProgress } from "./analysis-stages";
import type {
  CreativeDirection,
  IdeaCheckpoint,
  IdeateInput,
  ProductionPlan,
  ProjectKind,
  VideoAnalysis,
} from "./types";

export type IdeaRunInput = {
  kind: ProjectKind;
  idea: string;
  extras: string;
  durationSeconds: number | null;
  direction: CreativeDirection;
  chosenStyleId?: string;
  chosenStyleText?: string;
  styleImageDataUrl?: string | null;
  checkpoint?: IdeaCheckpoint;
  onProgress: (progress: AnalysisProgress) => void;
};

export async function runIdeaProject(input: IdeaRunInput): Promise<
  | {
      ok: true;
      analysis: VideoAnalysis;
      production?: ProductionPlan;
      durationSeconds: number;
      sceneCount: number;
    }
  | { ok: false; error: string; checkpoint?: IdeaCheckpoint; failedPhase?: string }
> {
  const durationSeconds =
    input.durationSeconds && input.durationSeconds > 0
      ? input.durationSeconds
      : defaultIdeaDuration(input.idea);
  const sceneCount = ideaSceneCount(durationSeconds);
  input.onProgress(ideaProgressAt(input.checkpoint ? input.checkpoint.phase : "understand"));

  const payload: IdeateInput & { checkpoint?: IdeaCheckpoint } = {
    kind: input.kind,
    idea: input.idea.trim(),
    extras: input.extras.trim() || undefined,
    durationSeconds,
    sceneCount,
    direction: input.direction,
    chosenStyleId: input.chosenStyleId,
    chosenStyleText: input.chosenStyleText,
    styleImageDataUrl: input.styleImageDataUrl,
    userNotes: [input.idea.trim(), input.extras.trim()].filter(Boolean).join("\n"),
    checkpoint: input.checkpoint,
  };

  const result = await runKreiaJob<{
    ok: true;
    analysis: VideoAnalysis;
    production?: ProductionPlan;
  }>("ideate", payload, input.onProgress);

  if (!result.ok) {
    return {
      ok: false,
      error: result.error || "La construction du projet a échoué.",
      checkpoint: (result as { checkpoint?: IdeaCheckpoint }).checkpoint ?? input.checkpoint,
      failedPhase: undefined,
    };
  }
  if (!result.analysis) {
    return { ok: false, error: "Le projet n'a pas pu être lu. Réessayez.", checkpoint: input.checkpoint };
  }
  return {
    ok: true,
    analysis: result.analysis,
    production: result.production,
    durationSeconds,
    sceneCount,
  };
}
