import { createFileRoute, useNavigate } from "@tanstack/react-router";
import {
  Apple,
  Clapperboard,
  Feather,
  FileVideo,
  Lightbulb,
  Link as LinkIcon,
  LoaderCircle,
  Upload,
  User,
} from "lucide-react";
import { useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { AnalysisProgressView } from "@/components/kreia/analysis-progress.tsx";
import { CharacterCast } from "@/components/kreia/character-cast.tsx";
import { DialogueBoard } from "@/components/kreia/dialogue-board.tsx";
import { AppShell } from "@/components/kreia/shell.tsx";
import { UserBriefForm } from "@/components/kreia/user-brief-form.tsx";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { runFullVideoAnalysis } from "@/lib/kreia/analysis-run";
import { progressAt, type AnalysisProgress } from "@/lib/kreia/analysis-stages";
import { probeVideoUrl } from "@/lib/kreia/ai";
import {
  formatDuration,
  formatTimecode,
  loadVideoElement,
  MAX_VIDEO_BYTES,
  videoMetaFromElement,
} from "@/lib/kreia/frames";
import { FUTURE_KINDS, KIND_REGISTRY, MODE_REGISTRY } from "@/lib/kreia/kinds";
import { VISUAL_STYLE_REGISTRY, type VisualStyleId } from "@/lib/kreia/visual-styles";
import { emptyBrief, isBriefEmpty } from "@/lib/kreia/user-brief";
import type { UserBrief } from "@/lib/kreia/user-brief";
import { failMessage, logKreia, logKreiaError, readServerResult, userFacingError } from "@/lib/kreia/rpc";
import { useKreia } from "@/lib/kreia/store";
import type {
  AnalysisCheckpoint,
  CharacterSheet,
  FrameCapture,
  ProjectKind,
  ReconstructionMode,
  VideoAnalysis,
  VideoMeta,
} from "@/lib/kreia/types";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/new")({ component: NewProject });

type SourceKind = "file" | "tiktok" | "url";

function NewProject() {
  const navigate = useNavigate();
  const createDraft = useKreia((s) => s.createDraft);
  const setAnalysis = useKreia((s) => s.setAnalysis);
  const setProduction = useKreia((s) => s.setProduction);
  const patchCurrent = useKreia((s) => s.patchCurrent);
  const fileRef = useRef<HTMLInputElement>(null);

  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [flow, setFlow] = useState<"pick" | "video">("pick");
  const [source, setSource] = useState<SourceKind>("file");
  const [url, setUrl] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [objectUrl, setObjectUrl] = useState<string | null>(null);
  const [meta, setMeta] = useState<VideoMeta | null>(null);
  const [kind, setKind] = useState<ProjectKind>("human");
  const [mode, setMode] = useState<ReconstructionMode>("reconstruction");
  const [styleId, setStyleId] = useState<VisualStyleId | null>(null);
  const [styleText, setStyleText] = useState("");
  const [brief, setBrief] = useState<UserBrief>(emptyBrief());
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState<AnalysisProgress | null>(null);
  const [frames, setFrames] = useState<FrameCapture[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [failed, setFailed] = useState(false);
  const [incomplete, setIncomplete] = useState(false);
  const [checkpoint, setCheckpoint] = useState<AnalysisCheckpoint | null>(null);
  const [reviewingCast, setReviewingCast] = useState(false);
  const [reviewingDialogues, setReviewingDialogues] = useState(false);
  const [cast, setCast] = useState<CharacterSheet[]>([]);
  const [reviewAnalysis, setReviewAnalysis] = useState<VideoAnalysis | null>(null);
  const [reviewProjectId, setReviewProjectId] = useState<string | null>(null);
  const runningRef = useRef(false);

  const canAnalyze = Boolean(meta && objectUrl);

  const sourceLabel = useMemo(() => {
    if (file) return file.name;
    if (url.trim()) return url.trim();
    return null;
  }, [file, url]);

  function resetVideo() {
    if (objectUrl) URL.revokeObjectURL(objectUrl);
    setObjectUrl(null);
    setFile(null);
    setMeta(null);
    setFrames([]);
  }

  async function onPickFile(next: File | null) {
    setError(null);
    if (!next) return;
    if (!next.type.startsWith("video/")) {
      setError("Ce fichier n'est pas une vidéo compatible.");
      return;
    }
    if (next.size > MAX_VIDEO_BYTES) {
      setError("Cette vidéo est trop volumineuse (limite 140 Mo). Compressez-la puis réessayez.");
      return;
    }
    resetVideo();
    const src = URL.createObjectURL(next);
    try {
      const video = await loadVideoElement(src);
      setFile(next);
      setObjectUrl(src);
      setMeta(videoMetaFromElement(video, next.name, "file"));
      video.removeAttribute("src");
      video.load();
    } catch (err) {
      URL.revokeObjectURL(src);
      setError(err instanceof Error ? err.message : "Impossible de lire cette vidéo.");
    }
  }

  async function onSubmitUrl() {
    setError(null);
    const trimmed = url.trim();
    if (!trimmed) {
      setError("Collez un lien vidéo.");
      return;
    }
    logKreia("probe:start", { source, url: trimmed.slice(0, 180) });
    setBusy(true);
    try {
      const probeRaw = await probeVideoUrl({ data: { url: trimmed } });
      const probe = readServerResult(probeRaw, "probeVideoUrl");
      if (!probe.ok) {
        logKreia("probe:rejected", probe);
        setError(
          failMessage(
            probe,
            "Cette vidéo ne peut pas être récupérée directement depuis ce lien. Veuillez importer la vidéo.",
          ),
        );
        return;
      }
      resetVideo();
      try {
        const video = await loadVideoElement(trimmed);
        setObjectUrl(trimmed);
        setMeta(
          videoMetaFromElement(
            video,
            trimmed.split("/").pop() || "video",
            source === "tiktok" ? "tiktok" : "url",
            trimmed,
          ),
        );
        logKreia("probe:video-loaded");
      } catch (err) {
        logKreiaError("probe:video-load", err);
        setError(
          "Cette vidéo ne peut pas être analysée directement depuis ce lien. Veuillez importer la vidéo.",
        );
      }
    } catch (err) {
      logKreiaError("probe:failed", err);
      setError(
        userFacingError(
          err,
          "Cette vidéo ne peut pas être récupérée directement depuis ce lien. Veuillez importer la vidéo.",
        ),
      );
    } finally {
      setBusy(false);
    }
  }

  async function runAnalysis(opts?: { resume?: boolean; checkpoint?: AnalysisCheckpoint | null }) {
    if (runningRef.current) return;
    if (!meta || !objectUrl) {
      const message =
        "Aucune vidéo sélectionnée. Veuillez importer une vidéo avant de lancer l'analyse.";
      setFailed(true);
      setError(message);
      toast.error(message);
      return;
    }

    runningRef.current = true;
    setError(null);
    setFailed(false);
    setIncomplete(false);
    setBusy(true);
    setProgress(progressAt(1));

    try {
      const result = await runFullVideoAnalysis({
        meta,
        objectUrl,
        file,
        kind,
        mode,
        notes: "",
        brief,
        chosenStyleId: styleId ?? undefined,
        chosenStyleText: styleId === "custom" ? styleText : undefined,
        resume: opts?.resume,
        checkpoint: opts?.checkpoint ?? checkpoint,
        onProgress: setProgress,
        onFrames: setFrames,
        createDraft,
        currentProjectId: reviewProjectId ?? useKreia.getState().current?.id ?? null,
      });

      if (!result.ok) {
        if (result.checkpoint) setCheckpoint(result.checkpoint);
        setIncomplete(Boolean(result.incomplete && result.checkpoint));
        await patchCurrent({
          status: result.incomplete ? "incomplete" : "error",
          errorMessage: result.error,
          analysisCheckpoint: result.checkpoint,
          analysisIncomplete: Boolean(result.incomplete),
        });
        throw new Error(result.error);
      }

      if ("awaitingCastReview" in result && result.awaitingCastReview) {
        setCheckpoint(result.checkpoint);
        setCast(result.characters);
        setReviewingCast(true);
        setReviewProjectId(result.projectId);
        setProgress(progressAt(3));
        await patchCurrent({
          status: "analyzing",
          analysisCheckpoint: result.checkpoint,
        });
        toast.message("Vérifiez les personnages avant de continuer.");
        return;
      }

      if ("awaitingDialogueReview" in result && result.awaitingDialogueReview) {
        setCheckpoint(result.checkpoint);
        setReviewAnalysis(result.analysis);
        setReviewingDialogues(true);
        setReviewProjectId(result.projectId);
        setProgress(progressAt(6));
        await patchCurrent({
          status: "analyzing",
          analysis: result.analysis,
          analysisCheckpoint: result.checkpoint,
        });
        toast.message("Vérifiez les dialogues avant de générer les prompts.");
        return;
      }

      if (!("analysis" in result) || !result.analysis) {
        throw new Error("L'analyse n'a pas pu être terminée. La réponse reçue est invalide. Veuillez réessayer.");
      }
      await setAnalysis(result.analysis);
      const production = "production" in result ? result.production : undefined;
      if (production) await setProduction(production);
      toast.success(production ? "Prompts prêts à copier." : "Analyse prête à vérifier.");
      await navigate({ to: "/projects/$id", params: { id: result.projectId } });
    } catch (err) {
      logKreiaError("analyze:failed", err);
      const message = userFacingError(err, "L'analyse a échoué. Aucun contenu n'a été inventé.");
      setFailed(true);
      setError(message);
      toast.error(message);
    } finally {
      runningRef.current = false;
      setBusy(false);
    }
  }

  return (
    <AppShell>
      <div className="mx-auto max-w-3xl">
        <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-[var(--champagne)]">
          Nouveau projet
        </p>
        {flow === "pick" ? (
          <>
            <h1 className="mt-2 font-display text-4xl tracking-[-0.03em] sm:text-5xl">
              Comment voulez-vous commencer ?
            </h1>
            <p className="mt-2 text-sm text-[var(--fg-muted)]">Deux chemins, même résultat : un projet prêt à générer.</p>
            <div className="mt-8 grid gap-3 sm:grid-cols-2">
              <button
                type="button"
                onClick={() => setFlow("video")}
                className="rounded-[24px] bg-[var(--bg-elevated)] p-6 text-left shadow-[var(--shadow-border)]"
              >
                <Clapperboard className="size-5" />
                <h2 className="mt-4 font-display text-2xl">Reconstruire une vidéo</h2>
                <p className="mt-2 text-sm leading-relaxed text-[var(--fg-muted)]">
                  Importez une vidéo de référence. KREIA analyse sa structure pour reconstruire le projet.
                </p>
              </button>
              <button
                type="button"
                onClick={() => void navigate({ to: "/idea" })}
                className="rounded-[24px] bg-[var(--bg-elevated)] p-6 text-left shadow-[var(--shadow-border)]"
              >
                <Lightbulb className="size-5" />
                <h2 className="mt-4 font-display text-2xl">Partir d'une idée</h2>
                <p className="mt-2 text-sm leading-relaxed text-[var(--fg-muted)]">
                  Décrivez votre histoire. KREIA construit le projet de A à Z, sans vidéo.
                </p>
              </button>
            </div>
          </>
        ) : (
          <>
        <h1 className="mt-2 font-display text-4xl tracking-[-0.03em] sm:text-5xl">
          {step === 1 && "Ajouter la vidéo"}
          {step === 2 && "Type de reconstruction"}
          {step === 3 && "Lancer l'analyse"}
        </h1>
        <p className="mt-2 text-sm text-[var(--fg-muted)]">Étape {step} / 3</p>

        {step === 1 ? (
          <div className="mt-8 space-y-4">
            <div className="grid gap-2 sm:grid-cols-3">
              {(
                [
                  { id: "file" as const, label: "Fichier", Icon: Upload },
                  { id: "tiktok" as const, label: "TikTok", Icon: FileVideo },
                  { id: "url" as const, label: "Lien", Icon: LinkIcon },
                ] as const
              ).map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setSource(item.id)}
                  className={cn(
                    "rounded-[20px] px-4 py-3 text-left shadow-[var(--shadow-border)]",
                    source === item.id
                      ? "bg-[var(--accent-fill)]"
                      : "bg-[var(--bg-elevated)]",
                  )}
                >
                  <item.Icon className="size-4" />
                  <p className="mt-2 text-sm font-medium">{item.label}</p>
                </button>
              ))}
            </div>

            {source === "file" ? (
              <div className="rounded-[24px] bg-[var(--bg-elevated)] p-5 shadow-[var(--shadow-border)]">
                <input
                  ref={fileRef}
                  type="file"
                  accept="video/*"
                  className="hidden"
                  onChange={(e) => void onPickFile(e.target.files?.[0] ?? null)}
                />
                <Button type="button" onClick={() => fileRef.current?.click()}>
                  <Upload className="size-4" />
                  Importer une vidéo
                </Button>
                <p className="mt-3 text-xs text-[var(--fg-subtle)]">
                  MP4 ou WebM, jusqu'à 140 Mo. L'analyse reste sur cet appareil.
                </p>
              </div>
            ) : (
              <div className="rounded-[24px] bg-[var(--bg-elevated)] p-5 shadow-[var(--shadow-border)]">
                <div className="flex gap-2">
                  <Input
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    placeholder="https://"
                  />
                  <Button type="button" onClick={() => void onSubmitUrl()} disabled={busy}>
                    Vérifier
                  </Button>
                </div>
                <p className="mt-3 text-xs leading-relaxed text-[var(--fg-subtle)]">
                  Si la plateforme bloque l'accès, importez le fichier. KREIA n'invente
                  jamais une analyse à partir d'un lien mort.
                </p>
              </div>
            )}

            {meta ? (
              <div className="flex items-center justify-between gap-3 rounded-[20px] bg-[var(--bg-subtle)] px-4 py-3 text-sm">
                <div className="min-w-0">
                  <p className="truncate text-[var(--fg)]">{sourceLabel}</p>
                  <p className="text-[var(--fg-subtle)]">
                    {formatDuration(meta.durationSeconds)} · {meta.width}×{meta.height}
                  </p>
                </div>
                <Button variant="ghost" size="sm" onClick={resetVideo}>
                  Retirer
                </Button>
              </div>
            ) : null}
          </div>
        ) : null}

        {step === 2 ? (
          <div className="mt-8 space-y-8">
            <div className="grid gap-3 sm:grid-cols-3">
              {KIND_REGISTRY.map((item) => {
                const Icon = item.id === "human" ? User : item.id === "angel" ? Feather : Apple;
                const selected = kind === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setKind(item.id)}
                    className={cn(
                      "rounded-[24px] p-5 text-left shadow-[var(--shadow-border)] transition-colors duration-150",
                      selected
                        ? "bg-[var(--accent-fill)] text-[var(--fg)] shadow-[inset_0_0_0_1px_color-mix(in_oklab,var(--accent)_40%,transparent)]"
                        : "bg-[var(--bg-elevated)] text-[var(--fg)]",
                    )}
                  >
                    <Icon className="size-5" />
                    <h2 className="mt-3 font-display text-2xl">{item.label}</h2>
                    <p
                      className={cn(
                        "mt-2 text-sm leading-relaxed",
                        selected ? "text-[var(--accent)]" : "text-[var(--fg-muted)]",
                      )}
                    >
                      {item.description}
                    </p>
                  </button>
                );
              })}
            </div>
            <p className="text-xs text-[var(--fg-subtle)]">
              Plus tard : {FUTURE_KINDS.join(" · ")}.
            </p>
            <div>
              <h2 className="font-display text-2xl">Niveau de reconstruction</h2>
              <div className="mt-3 grid gap-3">
                {MODE_REGISTRY.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setMode(item.id)}
                    className={cn(
                      "rounded-[20px] px-4 py-4 text-left shadow-[var(--shadow-border)]",
                      mode === item.id
                        ? "bg-[var(--accent-fill)] shadow-[inset_0_0_0_1px_color-mix(in_oklab,var(--accent)_40%,transparent)]"
                        : "bg-[var(--bg-elevated)]",
                    )}
                  >
                    <p className="text-sm font-medium">{item.label}</p>
                    <p className="mt-1 text-sm text-[var(--fg-muted)]">{item.description}</p>
                  </button>
                ))}
              </div>
            </div>
            <UserBriefForm brief={brief} onChange={setBrief} />
            <div>
              <h2 className="font-display text-2xl">Style visuel</h2>
              <p className="mt-1 text-sm text-[var(--fg-muted)]">
                Choisissez le rendu des prompts. Il n'est plus détecté automatiquement.
              </p>
              <div className="mt-3 grid gap-2 sm:grid-cols-2">
                {VISUAL_STYLE_REGISTRY.map((item) => {
                  const selected = styleId === item.id;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setStyleId(item.id)}
                      className={cn(
                        "rounded-[20px] px-4 py-4 text-left shadow-[var(--shadow-border)]",
                        selected
                          ? "bg-[var(--accent-fill)] shadow-[inset_0_0_0_1px_color-mix(in_oklab,var(--accent)_40%,transparent)]"
                          : "bg-[var(--bg-elevated)]",
                      )}
                    >
                      <p className="text-sm font-medium">{item.label}</p>
                      <p className="mt-1 text-sm text-[var(--fg-muted)]">{item.description}</p>
                    </button>
                  );
                })}
              </div>
              {styleId === "custom" ? (
                <div className="mt-3">
                  <label className="text-[11px] font-medium uppercase tracking-[0.14em] text-[var(--fg-subtle)]">
                    Décrivez le style
                  </label>
                  <Textarea
                    className="mt-2"
                    value={styleText}
                    onChange={(e) => setStyleText(e.target.value)}
                    placeholder="Ex. 3D cartoon satiné, lumière chaude, textures de velours, caméra douce."
                  />
                </div>
              ) : null}
            </div>
          </div>
        ) : null}

        {step === 3 ? (
          <div className="mt-8 space-y-5">
            <div className="rounded-[24px] bg-[var(--bg-elevated)] p-5 shadow-[var(--shadow-border)]">
              <dl className="grid gap-3 text-sm sm:grid-cols-2">
                <div>
                  <dt className="text-[var(--fg-subtle)]">Source</dt>
                  <dd className="truncate">{sourceLabel}</dd>
                </div>
                <div>
                  <dt className="text-[var(--fg-subtle)]">Durée</dt>
                  <dd>{meta ? formatDuration(meta.durationSeconds) : "—"}</dd>
                </div>
                <div>
                  <dt className="text-[var(--fg-subtle)]">Type</dt>
                  <dd>{KIND_REGISTRY.find((k) => k.id === kind)?.label}</dd>
                </div>
                <div>
                  <dt className="text-[var(--fg-subtle)]">Mode</dt>
                  <dd>{MODE_REGISTRY.find((m) => m.id === mode)?.label}</dd>
                </div>
                <div>
                  <dt className="text-[var(--fg-subtle)]">Style visuel</dt>
                  <dd>
                    {styleId === "custom"
                      ? styleText.trim() || "Personnalisé"
                      : VISUAL_STYLE_REGISTRY.find((s) => s.id === styleId)?.label ?? "—"}
                  </dd>
                </div>
                <div>
                  <dt className="text-[var(--fg-subtle)]">Brief</dt>
                  <dd>{isBriefEmpty(brief) ? "Aucun" : "Renseigné"}</dd>
                </div>
              </dl>
            </div>
            {frames.length ? (
              <div className="flex gap-2 overflow-x-auto">
                {frames.map((f) => (
                  <img
                    key={f.t}
                    src={f.dataUrl}
                    alt={formatTimecode(f.t)}
                    className="h-16 w-28 rounded-[var(--radius-sm)] object-cover outline outline-1 -outline-offset-1 outline-white/10"
                  />
                ))}
              </div>
            ) : null}
            {progress && !reviewingCast && !reviewingDialogues ? <AnalysisProgressView progress={progress} /> : null}
            {reviewingCast ? (
              <div className="rounded-[24px] bg-[var(--bg-elevated)] p-5 shadow-[var(--shadow-border)]">
                <CharacterCast
                  characters={cast}
                  kind={kind}
                  warnings={checkpoint?.limitations}
                  validating={busy}
                  onChange={setCast}
                  onRerun={() => {
                    const next: AnalysisCheckpoint = {
                      ...(checkpoint ?? {
                        version: 1,
                        completed: [],
                        segments: [],
                        analyzedSegmentCount: 0,
                        incomplete: false,
                      }),
                      version: 1,
                      completed: (checkpoint?.completed ?? []).filter((s) => s !== "cast"),
                      characters: [],
                      castValidated: false,
                      incomplete: false,
                    };
                    setReviewingCast(false);
                    setCheckpoint(next);
                    void runAnalysis({ resume: true, checkpoint: next });
                  }}
                  onValidate={() => {
                    const next: AnalysisCheckpoint = {
                      ...(checkpoint ?? {
                        version: 1,
                        completed: ["cast"],
                        segments: [],
                        analyzedSegmentCount: 0,
                        incomplete: false,
                      }),
                      version: 1,
                      characters: cast,
                      castValidated: true,
                      incomplete: false,
                    };
                    setCheckpoint(next);
                    setReviewingCast(false);
                    void runAnalysis({ resume: true, checkpoint: next });
                  }}
                />
              </div>
            ) : null}
            {reviewingDialogues && reviewAnalysis ? (
              <div className="rounded-[24px] bg-[var(--bg-elevated)] p-5 shadow-[var(--shadow-border)]">
                <DialogueBoard
                  analysis={reviewAnalysis}
                  validating={busy}
                  onChange={setReviewAnalysis}
                  onValidate={() => {
                    const nextAnalysis = reviewAnalysis;
                    const next: AnalysisCheckpoint = {
                      ...(checkpoint ?? {
                        version: 1,
                        completed: ["narrative"],
                        segments: [],
                        analyzedSegmentCount: 0,
                        incomplete: false,
                      }),
                      version: 1,
                      analysis: nextAnalysis,
                      dialoguesValidated: true,
                      incomplete: false,
                    };
                    setCheckpoint(next);
                    setReviewingDialogues(false);
                    void runAnalysis({ resume: true, checkpoint: next });
                  }}
                />
              </div>
            ) : null}
          </div>
        ) : null}

        {error ? (
          <p className="mt-5 rounded-[var(--radius-md)] bg-[color-mix(in_oklab,var(--color-danger)_14%,transparent)] px-4 py-3 text-sm text-[#f3c7bf]">
            {error}
          </p>
        ) : null}

        <div className="mt-8 flex flex-wrap items-center justify-between gap-3">
          <Button
            type="button"
            variant="ghost"
            disabled={busy}
            onClick={() => {
              if (step === 1) setFlow("pick");
              else setStep((s) => (s === 1 ? 1 : ((s - 1) as 1 | 2)));
            }}
          >
            Retour
          </Button>
          {step < 3 ? (
            <Button
              type="button"
              disabled={
                (step === 1 && !canAnalyze) ||
                (step === 2 && (!styleId || (styleId === "custom" && !styleText.trim())))
              }
              onClick={() => setStep((s) => (s === 3 ? 3 : ((s + 1) as 2 | 3)))}
            >
              Continuer
            </Button>
          ) : reviewingCast ? null : (
            <div className="flex flex-wrap gap-2">
              <Button type="button" disabled={!canAnalyze || busy} onClick={() => void runAnalysis()}>
                {busy ? (
                  <>
                    <LoaderCircle className="size-4 animate-spin" />
                    Analyse en cours…
                  </>
                ) : incomplete ? (
                  "Recommencer l'analyse"
                ) : failed ? (
                  "Réessayer l'analyse"
                ) : (
                  "Analyser la vidéo"
                )}
              </Button>
              {incomplete && checkpoint && !busy ? (
                <Button
                  type="button"
                  variant="outline"
                  disabled={!canAnalyze}
                  onClick={() => void runAnalysis({ resume: true })}
                >
                  Reprendre l'analyse
                </Button>
              ) : null}
            </div>
          )}
        </div>
          </>
        )}
      </div>
    </AppShell>
  );
}
