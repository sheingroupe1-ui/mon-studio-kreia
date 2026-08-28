import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { ArrowLeft, LoaderCircle } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { AnalysisProgressView } from "@/components/kreia/analysis-progress.tsx";
import { AnalysisView } from "@/components/kreia/analysis-view.tsx";
import { ProductionView } from "@/components/kreia/production-view.tsx";
import { RevisePanel } from "@/components/kreia/revise-panel.tsx";
import { AppShell } from "@/components/kreia/shell.tsx";
import { Button } from "@/components/ui/button";
import { formatDuration, toAnalysisFrames } from "@/lib/kreia/frames";
import { runKreiaJob } from "@/lib/kreia/job-client";
import type { AnalysisProgress } from "@/lib/kreia/analysis-stages";
import { kindById, modeById } from "@/lib/kreia/kinds";
import {
  failMessage,
  logKreia,
  logKreiaError,
  userFacingError,
} from "@/lib/kreia/rpc";
import { useKreia } from "@/lib/kreia/store";
import { enforceProductionDialogues } from "@/lib/kreia/engines/dialogues";
import type { ProductionPlan, ReviseProductionInput, VideoAnalysis } from "@/lib/kreia/types";

export const Route = createFileRoute("/projects/$id")({ component: ProjectPage });

function ProjectPage() {
  const { id } = Route.useParams();
  const navigate = useNavigate();
  const open = useKreia((s) => s.open);
  const current = useKreia((s) => s.current);
  const patchCurrent = useKreia((s) => s.patchCurrent);
  const setProduction = useKreia((s) => s.setProduction);
  const setAnalysis = useKreia((s) => s.setAnalysis);

  const [tab, setTab] = useState<"analysis" | "plan">("analysis");
  const [busy, setBusy] = useState(false);
  const [revise, setRevise] = useState<string | null>(null);
  const [progress, setProgress] = useState<AnalysisProgress | null>(null);

  useEffect(() => {
    void open(id).then((p) => {
      if (!p) {
        toast.error("Projet introuvable.");
        void navigate({ to: "/projects" });
        return;
      }
      if (p.production) setTab("plan");
    });
  }, [id, open, navigate]);

  if (!current || current.id !== id) {
    return (
      <AppShell>
        <p className="text-sm text-[var(--fg-muted)]">Ouverture du projet…</p>
      </AppShell>
    );
  }

  async function onGenerate() {
    if (!current?.analysis) return;
    setBusy(true);
    setProgress({ step: 7, total: 7, label: "Préparation de votre projet" });
    await patchCurrent({ status: "generating" });
    try {
      logKreia("generate:start", { id: current.id, kind: current.kind });
      const result = await runKreiaJob<{ ok: true; production: ProductionPlan }>(
        "generate",
        {
          analysis: current.analysis,
          kind: current.kind,
          mode: current.mode,
          userNotes: current.userNotes,
          durationSeconds: current.video.durationSeconds,
        },
        setProgress,
      );
      if (!result.ok) {
        const message = failMessage(
          result,
          "Le plan de production n'a pas pu être lu. Réessayez.",
        );
        await patchCurrent({ status: "analysis-ready", errorMessage: message });
        toast.error(message);
        return;
      }
      await setProduction(result.production);
      setTab("plan");
      toast.success("Plan de production généré.");
    } catch (err) {
      logKreiaError("generate:failed", err);
      const message = userFacingError(
        err,
        "Le plan de production n'a pas pu être généré. Réessayez.",
      );
      await patchCurrent({ status: "analysis-ready", errorMessage: message });
      toast.error(message);
    } finally {
      setBusy(false);
      setProgress(null);
    }
  }

  async function applyRevision(instruction: string) {
    if (!current) return;
    setBusy(true);
    try {
      if (!current.production || tab === "analysis") {
        if (!current.analysis) return;
        logKreia("revise-analysis:start");
        const result = await runKreiaJob<{ ok: true; analysis: VideoAnalysis }>(
          "revise-analysis",
          { analysis: current.analysis, instruction, kind: current.kind, durationSeconds: current.video.durationSeconds },
        );
        if (!result.ok) {
          toast.error(
            failMessage(result, "La correction n'a pas pu être appliquée de façon fiable."),
          );
          return;
        }
        await setAnalysis(result.analysis);
        await patchCurrent({
          analysisEdits: [...current.analysisEdits, instruction],
          production: undefined,
          status: "analysis-ready",
        });
        toast.success("Analyse mise à jour. Le plan devra être régénéré.");
      } else {
        const focus = parseFocus(revise);
        logKreia("revise-production:start");
        const result = await runKreiaJob<{ ok: true; production: ProductionPlan }>(
          "revise-production",
          {
            analysis: current.analysis!,
            production: current.production,
            kind: current.kind,
            mode: current.mode,
            instruction,
            durationSeconds: current.video.durationSeconds,
            focus,
          },
        );
        if (!result.ok) {
          toast.error(
            failMessage(result, "La modification n'a pas pu être appliquée de façon fiable."),
          );
          return;
        }
        await setProduction(result.production);
        toast.success("Plan mis à jour.");
      }
      setRevise(null);
    } catch (err) {
      logKreiaError("revise:failed", err);
      toast.error(
        userFacingError(
          err,
          "La correction n'a pas pu être envoyée. Réessayez.",
        ),
      );
    } finally {
      setBusy(false);
    }
  }

  async function onAnalysisChange(analysis: VideoAnalysis) {
    if (!current) return;
    const production = current.production
      ? enforceProductionDialogues(current.production, analysis, current.mode, current.kind)
      : current.production;
    await patchCurrent({
      analysis,
      production,
      analysisEdits: current.analysisEdits.includes("attribution manuelle")
        ? current.analysisEdits
        : [...current.analysisEdits, "attribution manuelle"],
    });
  }

  async function resumeAnalysis(fullRestart: boolean) {
    if (!current) return;
    setBusy(true);
    try {
      const frames = await toAnalysisFrames(current.frames);
      const result = await runKreiaJob<{ ok: true; analysis: VideoAnalysis }>("analyze", {
        frames,
        durationSeconds: current.video.durationSeconds,
        width: current.video.width,
        height: current.video.height,
        kind: current.kind,
        userNotes: current.userNotes,
        checkpoint: fullRestart ? undefined : current.analysisCheckpoint,
      });
      if (!result.ok) {
        const message = failMessage(result, "Analyse incomplète.");
        await patchCurrent({
          status: result.incomplete ? "incomplete" : "error",
          errorMessage: message,
          analysisCheckpoint: result.checkpoint,
          analysisIncomplete: Boolean(result.incomplete),
        });
        toast.error(message);
        return;
      }
      await setAnalysis(result.analysis);
      toast.success("Analyse prête à vérifier.");
    } catch (err) {
      toast.error(userFacingError(err, "L'analyse n'a pas pu aboutir. Réessayez."));
    } finally {
      setBusy(false);
    }
  }

  const still = current.thumbnailDataUrl || current.frames[0]?.dataUrl;

  return (
    <AppShell>
      {still ? (
        <div className="mb-6 overflow-hidden rounded-[28px] bg-[var(--bg-elevated)] p-2 shadow-[var(--shadow-border)]">
          <img
            src={still}
            alt=""
            className="aspect-[21/9] w-full rounded-[20px] object-cover outline outline-1 -outline-offset-1 outline-white/10"
          />
        </div>
      ) : null}
      {current.status === "incomplete" || current.analysisIncomplete ? (
        <div className="mb-6 rounded-[var(--radius-lg)] bg-[color-mix(in_oklab,var(--color-danger)_12%,transparent)] px-4 py-4">
          <p className="font-display text-xl">Analyse incomplète.</p>
          <p className="mt-1 text-sm text-[var(--fg-muted)]">
            {current.errorMessage ||
              (current.analysisCheckpoint?.failedMessage ??
                "Une étape n'a pas pu aboutir. Vous pouvez reprendre sans tout recommencer.")}
          </p>
          {current.analysisCheckpoint?.analyzedSegmentCount ? (
            <p className="mt-1 text-xs text-[var(--fg-subtle)]">
              Segments analysés : {current.analysisCheckpoint.analyzedSegmentCount}
            </p>
          ) : null}
          <div className="mt-3 flex flex-wrap gap-2">
            <Button
              type="button"
              disabled={busy || !current.frames.length}
              onClick={() => void resumeAnalysis(false)}
            >
              {busy ? <LoaderCircle className="size-4 animate-spin" /> : null}
              Reprendre l'analyse
            </Button>
            <Button
              type="button"
              variant="outline"
              disabled={busy || !current.frames.length}
              onClick={() => void resumeAnalysis(true)}
            >
              Recommencer l'analyse
            </Button>
          </div>
        </div>
      ) : null}
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <Link
            to="/projects"
            className="inline-flex items-center gap-1 text-sm text-[var(--fg-muted)] no-underline hover:text-[var(--fg)]"
          >
            <ArrowLeft className="size-4" />
            Mes projets
          </Link>
          <h1 className="mt-2 font-display text-3xl sm:text-4xl">{current.title}</h1>
          <p className="mt-1 text-sm text-[var(--fg-subtle)]">
            {kindById(current.kind).label} · {modeById(current.mode).label} ·{" "}
            {formatDuration(current.video.durationSeconds)}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {current.analysis ? (
            <div className="flex rounded-[var(--radius-md)] bg-[var(--bg-elevated)] p-1">
              <button
                type="button"
                onClick={() => setTab("analysis")}
                className={`h-9 rounded-[8px] px-3 text-sm ${tab === "analysis" ? "bg-[var(--bg-subtle)]" : "text-[var(--fg-muted)]"}`}
              >
                Analyse
              </button>
              <button
                type="button"
                onClick={() => current.production && setTab("plan")}
                disabled={!current.production}
                className={`h-9 rounded-[8px] px-3 text-sm ${tab === "plan" ? "bg-[var(--bg-subtle)]" : "text-[var(--fg-muted)]"}`}
              >
                Plan
              </button>
            </div>
          ) : null}
          {tab === "analysis" && current.analysis ? (
            <Button disabled={busy} onClick={() => void onGenerate()}>
              {busy ? (
                <>
                  <LoaderCircle className="size-4 animate-spin" />
                  Génération…
                </>
              ) : (
                "Générer mon projet"
              )}
            </Button>
          ) : null}
        </div>
      </div>
      {current.status === "error" && current.errorMessage ? (
        <p className="mb-5 rounded-[var(--radius-md)] bg-[color-mix(in_oklab,var(--color-danger)_14%,transparent)] px-4 py-3 text-sm text-[#f3c7bf]">
          {current.errorMessage}
        </p>
      ) : null}
      {progress ? (
        <div className="mb-5">
          <AnalysisProgressView progress={progress} />
        </div>
      ) : null}
      {tab === "analysis" && current.analysis ? (
        <AnalysisView
          project={current}
          onEdit={() => setRevise("analysis")}
          onAnalysisChange={(analysis) => void onAnalysisChange(analysis)}
        />
      ) : null}
      {tab === "plan" && current.production ? (
        <ProductionView project={current} onEdit={(focus) => setRevise(focus)} />
      ) : null}
      {!current.analysis ? (
        <p className="text-sm text-[var(--fg-muted)]">
          Ce projet n'a pas encore d'analyse. Relancez un import depuis Nouveau projet.
        </p>
      ) : null}
      {revise ? (
        <RevisePanel
          title={tab === "analysis" ? "Corriger l'analyse" : "Modifier cette partie du plan"}
          placeholder={
            tab === "analysis"
              ? "Ex. ce personnage est son frère, pas son mari. Je veux une maison africaine."
              : "Ex. raccourcir la scène 04 à 6 secondes, garder le même vêtement bleu."
          }
          busy={busy}
          onClose={() => setRevise(null)}
          onSubmit={(text) => void applyRevision(text)}
        />
      ) : null}
    </AppShell>
  );
}

function parseFocus(flag: string | null): ReviseProductionInput["focus"] {
  if (!flag || flag === "analysis") return { section: "all" };
  if (flag.startsWith("character:")) {
    return { section: "character", characterId: flag.slice(10) };
  }
  if (flag.startsWith("scene:")) {
    return { section: "scene", sceneNumber: Number(flag.slice(6)) };
  }
  if (
    flag === "hook" ||
    flag === "scenario" ||
    flag === "style" ||
    flag === "character" ||
    flag === "scene" ||
    flag === "all"
  ) {
    return { section: flag };
  }
  return { section: "all" };
}
