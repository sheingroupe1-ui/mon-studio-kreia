import { createFileRoute, Link } from "@tanstack/react-router";
import { Clapperboard, Plus, Trash2 } from "lucide-react";
import { useEffect } from "react";
import { AppShell } from "@/components/kreia/shell.tsx";
import { Button } from "@/components/ui/button";
import { formatDuration } from "@/lib/kreia/frames";
import { kindById } from "@/lib/kreia/kinds";
import { useKreia } from "@/lib/kreia/store";

export const Route = createFileRoute("/projects/")({ component: ProjectsPage });

const STATUS: Record<string, string> = {
  draft: "Brouillon",
  analyzing: "Analyse",
  "analysis-ready": "À valider",
  generating: "Génération",
  complete: "Plan prêt",
  incomplete: "Incomplète",
};

function ProjectsPage() {
  const hydrate = useKreia((s) => s.hydrate);
  const index = useKreia((s) => s.index);
  const hydrated = useKreia((s) => s.hydrated);
  const remove = useKreia((s) => s.remove);

  useEffect(() => {
    void hydrate();
  }, [hydrate]);

  return (
    <AppShell>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-[var(--champagne)]">
            Archives
          </p>
          <h1 className="mt-1 font-display text-4xl">Mes projets</h1>
        </div>
        <Button asChild>
          <Link to="/new">
            <Plus className="size-4" />
            Nouveau
          </Link>
        </Button>
      </div>

      {!hydrated ? (
        <p className="mt-10 text-sm text-[var(--fg-muted)]">Chargement…</p>
      ) : index.length === 0 ? (
        <div className="mt-12 overflow-hidden rounded-[28px] bg-[var(--bg-elevated)] px-6 py-20 text-center shadow-[var(--shadow-border)]">
          <Clapperboard className="mx-auto size-8 text-[var(--accent)]" />
          <p className="mt-4 font-display text-3xl">Aucun projet pour l'instant</p>
          <p className="mx-auto mt-2 max-w-md text-sm text-[var(--fg-muted)]">
            Importez une vidéo de référence pour produire votre premier plan.
          </p>
        </div>
      ) : (
        <ul className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {index.map((p) => (
            <li
              key={p.id}
              className="rounded-[24px] bg-[var(--bg-elevated)] p-2 shadow-[var(--shadow-border)] transition-transform duration-200 ease-out hover:-translate-y-0.5"
            >
              <Link
                to="/projects/$id"
                params={{ id: p.id }}
                className="block no-underline"
              >
                <div className="overflow-hidden rounded-[16px] bg-[var(--bg-subtle)]">
                  {p.thumbnailDataUrl ? (
                    <img
                      src={p.thumbnailDataUrl}
                      alt=""
                      className="aspect-[16/9] w-full object-cover outline outline-1 -outline-offset-1 outline-white/10"
                    />
                  ) : (
                    <div className="flex aspect-[16/9] items-center justify-center text-[var(--fg-subtle)]">
                      <Clapperboard className="size-7" />
                    </div>
                  )}
                </div>
                <div className="px-3 pt-3">
                  <p className="truncate font-medium text-[var(--fg)]">{p.title}</p>
                  <p className="mt-1 text-xs text-[var(--fg-subtle)]">
                    {kindById(p.kind).label} · {formatDuration(p.durationSeconds)} ·{" "}
                    {STATUS[p.status] ?? p.status}
                  </p>
                </div>
              </Link>
              <div className="flex justify-end px-1 pb-1">
                <Button
                  variant="ghost"
                  size="sm"
                  aria-label="Supprimer"
                  onClick={() => void remove(p.id)}
                >
                  <Trash2 className="size-4" />
                </Button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </AppShell>
  );
}
