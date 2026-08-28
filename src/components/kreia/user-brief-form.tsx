import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { createId } from "@/lib/kreia/ids";
import type { UserBrief } from "@/lib/kreia/user-brief";

export function UserBriefForm({
  brief,
  onChange,
}: {
  brief: UserBrief;
  onChange: (next: UserBrief) => void;
}) {
  function patch(partial: Partial<UserBrief>) {
    onChange({ ...brief, ...partial });
  }

  return (
    <div className="space-y-5">
      <div>
        <h2 className="font-display text-2xl">Brief utilisateur</h2>
        <p className="mt-1 text-sm text-[var(--fg-muted)]">
          Facultatif — mais recommandé. Aidez KREIA à mieux comprendre votre vidéo.
        </p>
        <p className="mt-2 text-sm leading-relaxed text-[var(--fg-subtle)]">
          Vous avez regardé la vidéo et vous pouvez déjà donner quelques informations.
          Décrivez ce que vous avez compris, les personnages remarqués ou les éléments
          à conserver. KREIA s'en sert comme contexte, pas comme remplacement de l'analyse.
        </p>
      </div>

      <label className="block text-[11px] font-medium uppercase tracking-[0.14em] text-[var(--fg-subtle)]">
        Résumé de l'histoire
        <Textarea
          className="mt-2"
          value={brief.story}
          onChange={(e) => patch({ story: e.target.value })}
          placeholder="Résumez avec vos propres mots ce qui se passe dans la vidéo..."
        />
      </label>

      <div>
        <div className="flex items-center justify-between gap-2">
          <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-[var(--fg-subtle)]">
            Personnages déjà identifiés
          </p>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() =>
              patch({
                characters: [
                  ...brief.characters,
                  { id: createId("hint"), name: "", description: "" },
                ],
              })
            }
          >
            <Plus className="size-3.5" />
            Ajouter un personnage
          </Button>
        </div>
        <p className="mt-1 text-sm text-[var(--fg-muted)]">Facultatif. KREIA cherchera aussi les autres.</p>
        <div className="mt-3 space-y-3">
          {brief.characters.map((c, i) => (
            <div
              key={c.id}
              className="rounded-[20px] bg-[var(--bg-elevated)] p-4 shadow-[var(--shadow-border)]"
            >
              <div className="flex items-center justify-between gap-2">
                <p className="font-mono text-[11px] tracking-wide text-[var(--accent)]">
                  Personnage {String(i + 1).padStart(2, "0")}
                </p>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() =>
                    patch({ characters: brief.characters.filter((item) => item.id !== c.id) })
                  }
                >
                  <Trash2 className="size-3.5" />
                  Retirer
                </Button>
              </div>
              <label className="mt-3 block text-xs text-[var(--fg-subtle)]">
                Nom
                <Input
                  className="mt-1"
                  value={c.name}
                  placeholder="Sarah"
                  onChange={(e) =>
                    patch({
                      characters: brief.characters.map((item) =>
                        item.id === c.id ? { ...item, name: e.target.value } : item,
                      ),
                    })
                  }
                />
              </label>
              <label className="mt-3 block text-xs text-[var(--fg-subtle)]">
                Description
                <Textarea
                  className="mt-1"
                  value={c.description}
                  placeholder="Femme noire d'environ 30 ans, cheveux longs noirs, robe rouge."
                  onChange={(e) =>
                    patch({
                      characters: brief.characters.map((item) =>
                        item.id === c.id ? { ...item, description: e.target.value } : item,
                      ),
                    })
                  }
                />
              </label>
            </div>
          ))}
        </div>
      </div>

      <label className="block text-[11px] font-medium uppercase tracking-[0.14em] text-[var(--fg-subtle)]">
        Nombre de personnages remarqués
        <Input
          className="mt-2"
          inputMode="numeric"
          value={brief.expectedCount}
          onChange={(e) => patch({ expectedCount: e.target.value.replace(/[^\d]/g, "") })}
          placeholder="3"
        />
      </label>

      <label className="block text-[11px] font-medium uppercase tracking-[0.14em] text-[var(--fg-subtle)]">
        Éléments importants à conserver
        <Textarea
          className="mt-2"
          value={brief.keep}
          onChange={(e) => patch({ keep: e.target.value })}
          placeholder="Indiquez les éléments que KREIA doit absolument respecter..."
        />
      </label>

      <label className="block text-[11px] font-medium uppercase tracking-[0.14em] text-[var(--fg-subtle)]">
        Précisions supplémentaires
        <Textarea
          className="mt-2"
          value={brief.extra}
          onChange={(e) => patch({ extra: e.target.value })}
          placeholder="Ajoutez toute autre information qui pourrait aider KREIA..."
        />
      </label>
    </div>
  );
}
