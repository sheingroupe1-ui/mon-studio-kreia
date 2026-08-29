import { LoaderCircle } from "lucide-react";
import { ANALYSIS_STEPS, type AnalysisProgress } from "@/lib/kreia/analysis-stages";
import { formatDialoguePassDebug, type DialoguePassDebug } from "@/lib/kreia/engines/pass-debug";
import { IDEA_STEPS } from "@/lib/kreia/idea-stages";
import { cn } from "@/lib/utils";

export function DialogueDebugPanel({
  debug,
}: {
  debug?: DialoguePassDebug | string | null;
}) {
  const text = typeof debug === "string" ? debug.trim() : formatDialoguePassDebug(debug).trim();
  if (!text) return null;
  return (
    <div className="mt-3 rounded-[var(--radius-md)] bg-[var(--bg)] p-3">
      <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-[var(--fg-subtle)]">
        Diagnostic attribution
      </p>
      <pre className="mt-2 select-all whitespace-pre-wrap break-all font-mono text-[11px] leading-relaxed text-[var(--fg)]">
        {text}
      </pre>
      <p className="mt-2 text-[11px] text-[var(--fg-subtle)]">
        Sélectionnez ce texte et copiez-le si l’attribution est incorrecte.
      </p>
    </div>
  );
}

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
          Analyse de la scène {progress.segmentsDone} / {progress.segmentsTotal}
        </p>
      ) : progress.compact ? (
        <p className="mt-1 text-xs text-[var(--fg-subtle)]">
          Style choisi appliqué. Scènes et narration en cours.
        </p>
      ) : typeof progress.speakerScenesDone === "number" && typeof progress.speakerScenesTotal === "number" ? (
        <p className="mt-1 text-xs text-[var(--fg-subtle)]">
          Attribution des dialogues — scène {progress.speakerScenesDone} / {progress.speakerScenesTotal}
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
      {mode === "video" ? <DialogueDebugPanel debug={progress.debug} /> : null}
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
