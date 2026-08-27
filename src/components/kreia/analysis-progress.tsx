import { LoaderCircle } from "lucide-react";
import { ANALYSIS_STEPS, type AnalysisProgress } from "@/lib/kreia/analysis-stages";
import { cn } from "@/lib/utils";

export function AnalysisProgressView({
  progress,
}: {
  progress: AnalysisProgress | null;
}) {
  if (!progress) return null;
  const current = progress.step;
  return (
    <div className="rounded-[var(--radius-lg)] bg-[var(--bg-elevated)] p-4 shadow-[var(--shadow-border)]">
      <p className="flex items-center gap-2 text-sm text-[var(--fg)]">
        <LoaderCircle className="size-4 animate-spin text-[var(--accent)]" />
        {progress.step}/{progress.total} — {progress.label}
      </p>
      {typeof progress.segmentsDone === "number" && typeof progress.segmentsTotal === "number" ? (
        <p className="mt-1 text-xs text-[var(--fg-subtle)]">
          Analyse des segments : {progress.segmentsDone} / {progress.segmentsTotal}
        </p>
      ) : progress.compact ? (
        <p className="mt-1 text-xs text-[var(--fg-subtle)]">
          Vidéo courte : personnages, style et scènes sont lus ensemble.
        </p>
      ) : (
        <p className="mt-1 text-xs text-[var(--fg-subtle)]">
          Étape en cours.
        </p>
      )}
      <ol className="mt-4 space-y-1.5">
        {ANALYSIS_STEPS.map((item, i) => {
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
