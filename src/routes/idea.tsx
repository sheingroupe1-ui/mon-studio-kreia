import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Apple, Feather, ImagePlus, LoaderCircle, User } from "lucide-react";
import { useRef, useState } from "react";
import { toast } from "sonner";
import { AnalysisProgressView } from "@/components/kreia/analysis-progress.tsx";
import { AppShell } from "@/components/kreia/shell.tsx";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { defaultIdeaDuration, ideaSceneCount } from "@/lib/kreia/engines/duration";
import { runIdeaProject } from "@/lib/kreia/idea-run";
import { KIND_REGISTRY } from "@/lib/kreia/kinds";
import { userFacingError } from "@/lib/kreia/rpc";
import { useKreia } from "@/lib/kreia/store";
import type { CreativeDirection, IdeaCheckpoint, ProjectKind } from "@/lib/kreia/types";
import { VISUAL_STYLE_REGISTRY, type VisualStyleId } from "@/lib/kreia/visual-styles";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/idea")({ component: IdeaProject });

const DURATIONS = [
  { id: 30, label: "30 secondes" },
  { id: 60, label: "1 minute" },
  { id: 120, label: "2 minutes" },
  { id: 180, label: "3 minutes" },
] as const;

const DIRECTIONS: { id: CreativeDirection; label: string; body: string }[] = [
  {
    id: "strict",
    label: "Respect strict de mon idée",
    body: "Ne complète que l'indispensable. Les détails fournis restent intacts.",
  },
  {
    id: "balanced",
    label: "Mode équilibré",
    body: "Respecte l'idée et complète intelligemment ce qui manque.",
  },
  {
    id: "develop",
    label: "Laisser KREIA développer",
    body: "Enrichit l'histoire, les scènes et les rebondissements sans trahir le départ.",
  },
];

function IdeaProject() {
  const navigate = useNavigate();
  const createDraft = useKreia((s) => s.createDraft);
  const setAnalysis = useKreia((s) => s.setAnalysis);
  const setProduction = useKreia((s) => s.setProduction);
  const imageRef = useRef<HTMLInputElement>(null);

  const [step, setStep] = useState<1 | 2 | 3 | 4 | 5 | 6>(1);
  const [kind, setKind] = useState<ProjectKind>("human");
  const [idea, setIdea] = useState("");
  const [duration, setDuration] = useState<number | null>(null);
  const [customDuration, setCustomDuration] = useState("");
  const [styleId, setStyleId] = useState<VisualStyleId | null>(null);
  const [styleText, setStyleText] = useState("");
  const [styleImage, setStyleImage] = useState<string | null>(null);
  const [direction, setDirection] = useState<CreativeDirection>("balanced");
  const [extras, setExtras] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState<import("@/lib/kreia/analysis-stages").AnalysisProgress | null>(null);
  const [ideaCheckpoint, setIdeaCheckpoint] = useState<IdeaCheckpoint | undefined>(undefined);

  const resolvedDuration = duration ?? (customDuration ? Number.parseInt(customDuration, 10) || null : null);
  const previewDuration = resolvedDuration && resolvedDuration > 0 ? resolvedDuration : defaultIdeaDuration(idea);
  const previewScenes = ideaSceneCount(previewDuration);

  async function onPickImage(file: File | null) {
    if (!file || !file.type.startsWith("image/")) return;
    const url = URL.createObjectURL(file);
    try {
      const img = new Image();
      img.src = url;
      await new Promise((resolve, reject) => {
        img.onload = resolve;
        img.onerror = reject;
      });
      const canvas = document.createElement("canvas");
      const max = 720;
      const scale = Math.min(1, max / Math.max(img.width, img.height));
      canvas.width = Math.max(1, Math.round(img.width * scale));
      canvas.height = Math.max(1, Math.round(img.height * scale));
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      setStyleImage(canvas.toDataURL("image/jpeg", 0.72));
    } finally {
      URL.revokeObjectURL(url);
    }
  }

  async function build(resume?: IdeaCheckpoint) {
    if (idea.trim().length < 8) {
      setError("Racontez au moins quelques mots : c'est le seul champ obligatoire.");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const result = await runIdeaProject({
        kind,
        idea,
        extras,
        durationSeconds: resolvedDuration,
        direction,
        chosenStyleId: styleId ?? undefined,
        chosenStyleText: styleId === "custom" ? styleText : undefined,
        styleImageDataUrl: styleImage,
        checkpoint: resume,
        onProgress: setProgress,
      });
      if (!result.ok) {
        setIdeaCheckpoint(result.checkpoint);
        throw new Error(result.error);
      }
      const title = idea.trim().split(/\s+/).slice(0, 8).join(" ") || "Projet d'idée";
      const project = await createDraft({
        kind,
        mode: "inspiration",
        video: {
          durationSeconds: result.durationSeconds,
          width: 1920,
          height: 1080,
          fileName: title,
          source: "file",
        },
        frames: [],
        userNotes: [idea.trim(), extras.trim()].filter(Boolean).join("\n"),
      });
      await setAnalysis(result.analysis);
      if (result.production) await setProduction(result.production);
      toast.success(
        result.production
          ? `Projet prêt — ${result.sceneCount} scènes d'environ 10 secondes.`
          : "Histoire prête. Générez ensuite le plan de production.",
      );
      await navigate({ to: "/projects/$id", params: { id: project.id } });
    } catch (err) {
      const message = userFacingError(err, "La construction du projet a échoué.");
      setError(message.replace(/vidéo/gi, "idée"));
      toast.error(message.replace(/vidéo/gi, "idée"));
    } finally {
      setBusy(false);
    }
  }

  const titles = {
    1: "Univers de l'histoire",
    2: "Racontez votre idée",
    3: "Durée souhaitée",
    4: "Style visuel",
    5: "Direction créative",
    6: "Précisions",
  } as const;

  return (
    <AppShell>
      <div className="mx-auto max-w-3xl">
        <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-[var(--champagne)]">
          Partir d'une idée
        </p>
        <h1 className="mt-2 font-display text-4xl tracking-[-0.03em] sm:text-5xl">{titles[step]}</h1>
        <p className="mt-2 text-sm text-[var(--fg-muted)]">
          Étape {step} / 6 · seule l'idée est obligatoire
        </p>

        {step === 1 ? (
          <div className="mt-8 grid gap-3 sm:grid-cols-3">
            {KIND_REGISTRY.map((item) => {
              const Icon = item.id === "human" ? User : item.id === "angel" ? Feather : Apple;
              const selected = kind === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setKind(item.id)}
                  className={cn(
                    "rounded-[24px] p-5 text-left shadow-[var(--shadow-border)]",
                    selected
                      ? "bg-[var(--accent-fill)] shadow-[inset_0_0_0_1px_color-mix(in_oklab,var(--accent)_40%,transparent)]"
                      : "bg-[var(--bg-elevated)]",
                  )}
                >
                  <Icon className="size-5" />
                  <h2 className="mt-3 font-display text-2xl">{item.label}</h2>
                  <p className="mt-2 text-sm text-[var(--fg-muted)]">{item.description}</p>
                </button>
              );
            })}
          </div>
        ) : null}

        {step === 2 ? (
          <div className="mt-8">
            <label className="block text-[11px] font-medium uppercase tracking-[0.14em] text-[var(--fg-subtle)]">
              Racontez votre idée ou votre histoire
              <Textarea
                className="mt-2 min-h-40"
                value={idea}
                onChange={(e) => setIdea(e.target.value)}
                placeholder="Décrivez votre idée, votre histoire, les personnages que vous imaginez, ce qui doit se passer ou tout autre élément important."
              />
            </label>
            <p className="mt-3 text-sm text-[var(--fg-subtle)]">
              Quelques lignes suffisent. KREIA complète ce qui manque et respecte ce que vous précisez.
            </p>
          </div>
        ) : null}

        {step === 3 ? (
          <div className="mt-8 space-y-3">
            <p className="text-sm text-[var(--fg-muted)]">Facultatif. Chaque scène fait environ 10 secondes.</p>
            {DURATIONS.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => {
                  setDuration(item.id);
                  setCustomDuration("");
                }}
                className={cn(
                  "w-full rounded-[20px] px-4 py-4 text-left shadow-[var(--shadow-border)]",
                  duration === item.id ? "bg-[var(--accent-fill)]" : "bg-[var(--bg-elevated)]",
                )}
              >
                <p className="text-sm font-medium">{item.label}</p>
                <p className="mt-1 text-sm text-[var(--fg-muted)]">
                  {ideaSceneCount(item.id)} scènes
                </p>
              </button>
            ))}
            <div className="rounded-[20px] bg-[var(--bg-elevated)] p-4 shadow-[var(--shadow-border)]">
              <p className="text-sm font-medium">Durée personnalisée</p>
              <Input
                className="mt-2"
                inputMode="numeric"
                value={customDuration}
                placeholder="Secondes, ex. 90"
                onChange={(e) => {
                  setCustomDuration(e.target.value.replace(/[^\d]/g, ""));
                  setDuration(null);
                }}
              />
            </div>
            <p className="text-sm text-[var(--fg-subtle)]">
              Sans choix, KREIA proposera environ {previewDuration}s ({previewScenes} scènes).
            </p>
          </div>
        ) : null}

        {step === 4 ? (
          <div className="mt-8 space-y-4">
            <p className="text-sm text-[var(--fg-muted)]">Facultatif. Sinon KREIA choisit un style cohérent.</p>
            <div className="grid gap-2 sm:grid-cols-2">
              {VISUAL_STYLE_REGISTRY.map((item) => {
                const selected = styleId === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setStyleId(item.id)}
                    className={cn(
                      "rounded-[20px] px-4 py-4 text-left shadow-[var(--shadow-border)]",
                      selected ? "bg-[var(--accent-fill)]" : "bg-[var(--bg-elevated)]",
                    )}
                  >
                    <p className="text-sm font-medium">{item.label}</p>
                    <p className="mt-1 text-sm text-[var(--fg-muted)]">{item.description}</p>
                  </button>
                );
              })}
            </div>
            {styleId === "custom" ? (
              <label className="block text-[11px] font-medium uppercase tracking-[0.14em] text-[var(--fg-subtle)]">
                Style personnalisé
                <Textarea
                  className="mt-2"
                  value={styleText}
                  onChange={(e) => setStyleText(e.target.value)}
                  placeholder="Décrivez le rendu souhaité..."
                />
              </label>
            ) : null}
            <div className="rounded-[20px] bg-[var(--bg-elevated)] p-4 shadow-[var(--shadow-border)]">
              <p className="text-sm font-medium">Image d'inspiration</p>
              <p className="mt-1 text-sm text-[var(--fg-muted)]">Facultatif. Ambiance et lumière seulement.</p>
              <input
                ref={imageRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => void onPickImage(e.target.files?.[0] ?? null)}
              />
              <div className="mt-3 flex items-center gap-3">
                <Button type="button" variant="outline" onClick={() => imageRef.current?.click()}>
                  <ImagePlus className="size-4" />
                  Ajouter une image
                </Button>
                {styleImage ? (
                  <Button type="button" variant="ghost" onClick={() => setStyleImage(null)}>
                    Retirer
                  </Button>
                ) : null}
              </div>
              {styleImage ? (
                <img src={styleImage} alt="Inspiration" className="mt-3 h-24 w-40 rounded-[12px] object-cover" />
              ) : null}
            </div>
          </div>
        ) : null}

        {step === 5 ? (
          <div className="mt-8 grid gap-3">
            {DIRECTIONS.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setDirection(item.id)}
                className={cn(
                  "rounded-[20px] px-4 py-4 text-left shadow-[var(--shadow-border)]",
                  direction === item.id ? "bg-[var(--accent-fill)]" : "bg-[var(--bg-elevated)]",
                )}
              >
                <p className="text-sm font-medium">{item.label}</p>
                <p className="mt-1 text-sm text-[var(--fg-muted)]">{item.body}</p>
              </button>
            ))}
          </div>
        ) : null}

        {step === 6 ? (
          <div className="mt-8 space-y-5">
            <label className="block text-[11px] font-medium uppercase tracking-[0.14em] text-[var(--fg-subtle)]">
              Précisions supplémentaires
              <Textarea
                className="mt-2"
                value={extras}
                onChange={(e) => setExtras(e.target.value)}
                placeholder="Ajoutez tout ce que vous souhaitez préciser à KREIA Studio..."
              />
            </label>
            <dl className="grid gap-3 rounded-[24px] bg-[var(--bg-elevated)] p-5 text-sm shadow-[var(--shadow-border)] sm:grid-cols-2">
              <div>
                <dt className="text-[var(--fg-subtle)]">Univers</dt>
                <dd>{KIND_REGISTRY.find((k) => k.id === kind)?.label}</dd>
              </div>
              <div>
                <dt className="text-[var(--fg-subtle)]">Durée</dt>
                <dd>
                  {previewDuration}s · {previewScenes} scènes
                </dd>
              </div>
              <div>
                <dt className="text-[var(--fg-subtle)]">Style</dt>
                <dd>
                  {styleId
                    ? VISUAL_STYLE_REGISTRY.find((s) => s.id === styleId)?.label
                    : "Choisi par KREIA"}
                </dd>
              </div>
              <div>
                <dt className="text-[var(--fg-subtle)]">Direction</dt>
                <dd>{DIRECTIONS.find((d) => d.id === direction)?.label}</dd>
              </div>
            </dl>
            {progress ? <AnalysisProgressView progress={progress} mode="idea" /> : null}
          </div>
        ) : null}

        {error ? (
          <div className="mt-5 space-y-3 rounded-[var(--radius-md)] bg-[color-mix(in_oklab,var(--color-danger)_14%,transparent)] px-4 py-3 text-sm text-[#f3c7bf]">
            <p>{error}</p>
            <div className="flex flex-wrap gap-2">
              <Button type="button" variant="outline" disabled={busy} onClick={() => void build(ideaCheckpoint)}>
                Réessayer cette étape
              </Button>
              <Button
                type="button"
                variant="ghost"
                disabled={busy}
                onClick={() => {
                  setError(null);
                  setProgress(null);
                  setStep(2);
                }}
              >
                Modifier mon idée
              </Button>
            </div>
          </div>
        ) : null}

        <div className="mt-8 flex flex-wrap items-center justify-between gap-3">
          <Button
            type="button"
            variant="ghost"
            disabled={busy}
            onClick={() => {
              if (step === 1) {
                void navigate({ to: "/new" });
                return;
              }
              setStep((s) => (s - 1) as 1 | 2 | 3 | 4 | 5);
            }}
          >
            Retour
          </Button>
          {step < 6 ? (
            <Button
              type="button"
              disabled={step === 2 && idea.trim().length < 8}
              onClick={() => setStep((s) => (s + 1) as 2 | 3 | 4 | 5 | 6)}
            >
              Continuer
            </Button>
          ) : (
            <Button type="button" disabled={busy || idea.trim().length < 8} onClick={() => void build()}>
              {busy ? (
                <>
                  <LoaderCircle className="size-4 animate-spin" />
                  Construction…
                </>
              ) : (
                "Construire mon projet"
              )}
            </Button>
          )}
        </div>
      </div>
    </AppShell>
  );
}
