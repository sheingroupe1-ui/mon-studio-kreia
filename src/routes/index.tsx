import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, Clapperboard, Folder, Lock, Palette, Users } from "lucide-react";
import { useEffect } from "react";
import { AppShell } from "@/components/kreia/shell.tsx";
import { Mark } from "@/components/kreia/logo.tsx";
import { Button } from "@/components/ui/button";
import { formatDuration } from "@/lib/kreia/frames";
import { useKreia } from "@/lib/kreia/store";

export const Route = createFileRoute("/")({ component: Home });

const STEPS = [
  {
    n: "01",
    title: "Ajouter la vidéo",
    body: "Importez un fichier. Les liens TikTok sont acceptés, mais l'import reste la méthode fiable.",
  },
  {
    n: "02",
    title: "Choisir le type",
    body: "Histoire humaine, Fruit humanoïde ou Anges. Le moteur identifie chaque personnage selon son type réel.",
  },
  {
    n: "03",
    title: "Vérifier l'analyse",
    body: "Corrigez ce qui est faux avant toute génération. Rien n'est inventé pour combler les blancs.",
  },
  {
    n: "04",
    title: "Générer le plan",
    body: "Hook, bible personnages, style verrouillé, scènes et prompts vidéo prêts à coller.",
  },
];

function Home() {
  const hydrate = useKreia((s) => s.hydrate);
  const index = useKreia((s) => s.index);
  const hydrated = useKreia((s) => s.hydrated);

  useEffect(() => {
    void hydrate();
  }, [hydrate]);

  const recent = hydrated ? index.slice(0, 3) : [];

  return (
    <AppShell>
      <section className="stagger-in">
        <div className="letterbox relative overflow-hidden rounded-[32px] bg-[var(--bg-elevated)] shadow-[var(--shadow-border)]">
          <div className="title-card absolute inset-0" />
          <div className="relative grid items-center gap-10 px-6 py-14 sm:px-10 sm:py-16 lg:grid-cols-[minmax(10rem,0.7fr)_minmax(0,1.15fr)] lg:gap-14 lg:px-14 lg:py-20">
            <div className="mx-auto flex size-[min(52vw,13.5rem)] items-center justify-center sm:size-56">
              <Mark className="size-full" />
            </div>
            <div>
              <p className="text-[11px] font-medium uppercase tracking-[0.28em] text-[var(--champagne)]">
                Studio créatif
              </p>
              <h1 className="mt-4 font-display text-[clamp(3rem,7vw,5.4rem)] leading-[0.88] tracking-[-0.035em]">
                KREIA Studio
              </h1>
              <p className="mt-5 max-w-md font-display text-2xl leading-snug text-[var(--fg-muted)]">
                De la vidéo au plan de production.
              </p>
              <p className="mt-4 max-w-lg text-base leading-relaxed text-[var(--fg-muted)]">
                KREIA Studio ne résume pas. Il lit ce qui est raconté, comment c'est
                filmé, et à quoi ça ressemble — puis reconstruit un projet exploitable,
                scène par scène, sans trahir le style.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <Button asChild size="lg">
                  <Link to="/new">
                    Reconstruire une vidéo
                    <ArrowRight className="size-4" />
                  </Link>
                </Button>
                <Button asChild variant="outline" size="lg">
                  <Link to="/idea">
                    Partir d'une idée
                    <ArrowRight className="size-4" />
                  </Link>
                </Button>
                <Button asChild variant="outline" size="lg">
                  <Link to="/projects">
                    <Folder className="size-4" />
                    Mes projets
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </div>

        <ul className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
          <li className="flex items-center gap-3 rounded-[20px] bg-[var(--bg-elevated)] px-4 py-3 text-sm text-[var(--fg-muted)] shadow-[var(--shadow-border)]">
            <Clapperboard className="size-4 shrink-0 text-[var(--accent)]" />
            Hook, structure, langage de caméra
          </li>
          <li className="flex items-center gap-3 rounded-[20px] bg-[var(--bg-elevated)] px-4 py-3 text-sm text-[var(--fg-muted)] shadow-[var(--shadow-border)]">
            <Users className="size-4 shrink-0 text-[var(--accent)]" />
            Character ID verrouillés d'une scène à l'autre
          </li>
          <li className="flex items-center gap-3 rounded-[20px] bg-[var(--bg-elevated)] px-4 py-3 text-sm text-[var(--fg-muted)] shadow-[var(--shadow-border)]">
            <Palette className="size-4 shrink-0 text-[var(--accent)]" />
            Style visuel traité comme une contrainte
          </li>
          <li className="flex items-center gap-3 rounded-[20px] bg-[var(--bg-elevated)] px-4 py-3 text-sm text-[var(--fg-muted)] shadow-[var(--shadow-border)]">
            <Lock className="size-4 shrink-0 text-[var(--accent)]" />
            Observé, déduit et proposé restent séparés
          </li>
        </ul>
      </section>

      <section className="mt-10 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {STEPS.map((step) => (
          <article
            key={step.n}
            className="rounded-[24px] bg-[var(--bg-elevated)] p-5 shadow-[var(--shadow-border)] transition-transform duration-200 ease-out hover:-translate-y-0.5"
          >
            <p className="font-mono text-xs text-[var(--champagne)]">{step.n}</p>
            <h2 className="mt-2 font-display text-xl">{step.title}</h2>
            <p className="mt-2 text-sm leading-relaxed text-[var(--fg-muted)]">{step.body}</p>
          </article>
        ))}
      </section>

      {recent.length ? (
        <section className="mt-14">
          <div className="mb-4 flex items-end justify-between">
            <h2 className="font-display text-2xl">Projets récents</h2>
            <Link to="/projects" className="text-sm text-[var(--accent)]">
              Tout voir
            </Link>
          </div>
          <div className="grid gap-3 sm:grid-cols-3">
            {recent.map((p) => (
              <Link
                key={p.id}
                to="/projects/$id"
                params={{ id: p.id }}
                className="rounded-[24px] bg-[var(--bg-elevated)] p-2 no-underline shadow-[var(--shadow-border)] transition-transform duration-200 ease-out hover:-translate-y-0.5"
              >
                <div className="overflow-hidden rounded-[16px] bg-[var(--bg-subtle)]">
                  {p.thumbnailDataUrl ? (
                    <img
                      src={p.thumbnailDataUrl}
                      alt=""
                      className="aspect-video w-full object-cover outline outline-1 -outline-offset-1 outline-white/10"
                    />
                  ) : (
                    <div className="flex aspect-video items-center justify-center text-[var(--fg-subtle)]">
                      <Clapperboard className="size-6" />
                    </div>
                  )}
                </div>
                <div className="px-3 py-3">
                  <p className="truncate text-sm text-[var(--fg)]">{p.title}</p>
                  <p className="mt-1 text-xs text-[var(--fg-subtle)]">
                    {formatDuration(p.durationSeconds)}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </section>
      ) : null}
    </AppShell>
  );
}
