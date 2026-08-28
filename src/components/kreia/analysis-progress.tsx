import { LoaderCircle } from "lucide-react";
import { ANALYSIS_STEPS, type AnalysisProgress } from "@/lib/kreia/analysis-stages";
import { IDEA_STEPS } from "@/lib/kreia/idea-stages";
import { cn } from "@/lib/utils";

export function AnalysisProgressView({
  progress,
  mode = "video",
}: {
  progress: AnalysisProgress | null;
  mode?: "video" | "idea";
}) {
  if (!progress) return null;
  const current = progress.step;
  const steps = mode === "idea" ? IDEA_STEPS : ANALYSIS_STEPS;
  return (
    <div className="rounded-[var(--radius-lg)] bg-[var(--bg-elevated)] p-4 shadow-[var(--shadow-border)]">
      <p className="flex items-center gap-2 text-sm text-[var(--fg)]">
        <LoaderCircle className="size-4 animate-spin text-[var(--accent)]" />
        {progress.step}/{progress.total} — {progress.label}
      </p>
      {mode === "idea" ? (
        <p className="mt-1 text-xs text-[var(--fg-subtle)]">Création à partir de votre idée — sans vidéo.</p>
      ) : typeof progress.segmentsDone === "number" && typeof progress.segmentsTotal === "number" ? (
        <p className="mt-1 text-xs text-[var(--fg-subtle)]">
          Analyse des segments : {progress.segmentsDone} / {progress.segmentsTotal}
        </p>
      ) : progress.compact ? (
        <p className="mt-1 text-xs text-[var(--fg-subtle)]">
          Style choisi appliqué. Scènes et narration en cours.
        </p>
      ) : typeof progress.productionScenesDone === "number" && typeof progress.productionScenesTotal === "number" ? (
        <p className="mt-1 text-xs text-[var(--fg-subtle)]">
          Génération des prompts — scène {progress.productionScenesDone} / {progress.productionScenesTotal}
        </p>
      ) : typeof progress.castBatchesDone === "number" && typeof progress.castBatchesTotal === "number" ? (
        <p className="mt-1 text-xs text-[var(--fg-subtle)]">
          Identification des personnages — lot {progress.castBatchesDone} / {progress.castBatchesTotal}
        </p>
      ) : current === 3 ? (
        <p className="mt-1 text-xs text-[var(--fg-subtle)]">
          Identification : 15 à 40 s, parfois jusqu'à 1 minute.
        </p>
      ) : (
        <p className="mt-1 text-xs text-[var(--fg-subtle)]">Étape en cours.</p>
      )}
      {progress.debug && mode === "video" ? (
        <p className="mt-2 break-all font-mono text-[10px] text-[var(--fg-subtle)]">{progress.debug}</p>
      ) : null}
      <ol className="mt-4 space-y-1.5">
        {steps.map((item, i) => {
          const n = i + 1;
          const state = n < current ? "done" : n === current ? "now" : "todo";
          return (
            <li
              key={item.id}
              className={cn(
                "flex items-center gap-2 text-xs",
                state === "now" && "text-[var(--fg)]",
                state === "done" && "text-[var(--fg-muted)]",
                state === "todo" && "text-[var(--fg-subtle)]",
              )}
            >
              <span
                className={cn(
                  "flex size-5 items-center justify-center rounded-full font-mono text-[10px]",
                  state === "now" && "bg-[var(--accent-fill)] text-[var(--fg)]",
                  state === "done" && "bg-[var(--bg-subtle)]",
                  state === "todo" && "bg-[var(--bg)]",
                )}
              >
                {n}
              </span>
              {item.label}
            </li>
          );
        })}
      </ol>
    </div>
  );
}