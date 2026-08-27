export const ANALYSIS_STEPS = [
  { id: "validate", label: "Vérification de la vidéo" },
  { id: "structure", label: "Analyse de la structure" },
  { id: "characters", label: "Identification des personnages" },
  { id: "style", label: "Analyse du style visuel" },
  { id: "scenes", label: "Analyse des scènes" },
  { id: "narrative", label: "Reconstruction narrative" },
  { id: "prepare", label: "Préparation de votre projet" },
] as const;

export type AnalysisStepId = (typeof ANALYSIS_STEPS)[number]["id"];

export type AnalysisProgress = {
  step: number;
  total: number;
  label: string;
  segmentsDone?: number;
  segmentsTotal?: number;
  compact?: boolean;
};

export function progressAt(step: number, extra?: Partial<AnalysisProgress>): AnalysisProgress {
  const i = Math.min(ANALYSIS_STEPS.length, Math.max(1, step)) - 1;
  const item = ANALYSIS_STEPS[i]!;
  return {
    step: i + 1,
    total: ANALYSIS_STEPS.length,
    label: item.label,
    ...extra,
  };
}
