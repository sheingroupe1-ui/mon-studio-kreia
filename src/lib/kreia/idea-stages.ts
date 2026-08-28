import type { AnalysisProgress } from "./analysis-stages";
import type { IdeaPhase } from "./types";

export const IDEA_STEPS = [
  { id: "understand", label: "KREIA comprend votre idée" },
  { id: "story", label: "KREIA construit votre histoire" },
  { id: "characters", label: "KREIA construit vos personnages" },
  { id: "visual", label: "KREIA prépare l'univers visuel" },
  { id: "scenes", label: "KREIA découpe votre histoire en scènes" },
  { id: "dialogues", label: "KREIA prépare les dialogues" },
  { id: "prepare", label: "KREIA prépare votre projet" },
] as const;

export const IDEA_PHASE_ORDER: IdeaPhase[] = [
  "understand",
  "story",
  "characters",
  "visual",
  "scenes",
  "dialogues",
  "prepare",
];

export function ideaProgressAt(phase: IdeaPhase, extra?: Partial<AnalysisProgress>): AnalysisProgress {
  const i = IDEA_PHASE_ORDER.indexOf(phase);
  const idx = i < 0 ? 0 : i;
  const item = IDEA_STEPS[idx]!;
  return {
    step: idx + 1,
    total: IDEA_STEPS.length,
    label: item.label,
    ...extra,
  };
}

export function nextIdeaPhase(phase: IdeaPhase): IdeaPhase | "done" {
  const i = IDEA_PHASE_ORDER.indexOf(phase);
  if (i < 0 || i >= IDEA_PHASE_ORDER.length - 1) return "done";
  return IDEA_PHASE_ORDER[i + 1]!;
}

export function ideaPhaseLabel(phase: IdeaPhase): string {
  const i = IDEA_PHASE_ORDER.indexOf(phase);
  return IDEA_STEPS[i < 0 ? 0 : i]!.label;
}

export function resumeIdeaPhase(cp: { completed?: IdeaPhase[] } | undefined): IdeaPhase {
  if (!cp) return "understand";
  for (const phase of IDEA_PHASE_ORDER) {
    if (!cp.completed?.includes(phase)) return phase;
  }
  return "prepare";
}
