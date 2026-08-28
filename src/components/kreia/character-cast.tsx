import { GitMerge, Pencil, Plus, RefreshCw, Trash2 } from "lucide-react";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  blankCharacter,
  duplicateWarnings,
  mergeCharacterPair,
  reindexCharacters,
} from "@/lib/kreia/engines/cast-edit";
import { swatchForCharacter } from "@/lib/kreia/engines/dialogues";
import { labelCharacterType } from "@/lib/kreia/engines/identity";
import type { CharacterSheet, CharacterType, ProjectKind } from "@/lib/kreia/types";
import { ConfidenceBadge } from "./confidence.tsx";
import { Field } from "./section-card.tsx";

const TYPES: { id: CharacterType; label: string }[] = [
  { id: "human", label: "Humain" },
  { id: "fruit_humanoid", label: "Fruit humanoïde" },
  { id: "angel", label: "Ange" },
  { id: "animated_character", label: "Animé" },
  { id: "animal_humanoid", label: "Animal humanoïde" },
  { id: "fantasy_character", label: "Fantastique" },
  { id: "unknown_character", label: "Inconnu" },
];

const PROMINENCE = {
  principal: "Principal",
  secondary: "Secondaire",
  punctual: "Ponctuel",
} as const;

export function CharacterCast({
  characters,
  kind,
  warnings,
  onChange,
  onRerun,
  onValidate,
  validating,
}: {
  characters: CharacterSheet[];
  kind: ProjectKind;
  warnings?: string[];
  onChange: (next: CharacterSheet[]) => void;
  onRerun?: () => void;
  onValidate?: () => void;
  validating?: boolean;
}) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [mergeFrom, setMergeFrom] = useState<string | null>(null);
  const extraWarnings = duplicateWarnings(characters);
  const allWarnings = [...(warnings ?? []), ...extraWarnings];

  function commit(next: CharacterSheet[]) {
    onChange(reindexCharacters(next, kind));
  }

  function update(id: string, patch: Partial<CharacterSheet>) {
    commit(
      characters.map((c) =>
        c.id === id ? { ...c, ...patch, userLocked: true } : c,
      ),
    );
  }

  function remove(id: string) {
    commit(characters.filter((c) => c.id !== id));
    if (editingId === id) setEditingId(null);
    if (mergeFrom === id) setMergeFrom(null);
  }

  function add() {
    const next = blankCharacter(kind, characters.length);
    commit([...characters, next]);
    setEditingId(next.id);
  }

  function mergeInto(targetId: string) {
    if (!mergeFrom || mergeFrom === targetId) {
      setMergeFrom(null);
      return;
    }
    const keep = characters.find((c) => c.id === targetId);
    const drop = characters.find((c) => c.id === mergeFrom);
    if (!keep || !drop) return;
    const merged = mergeCharacterPair(keep, drop);
    commit(characters.filter((c) => c.id !== drop.id).map((c) => (c.id === keep.id ? merged : c)));
    setMergeFrom(null);
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-[var(--fg-subtle)]">
            Personnages identifiés
          </p>
          <h2 className="font-display text-2xl text-[var(--fg)]">
            {characters.length} {characters.length > 1 ? "personnages détectés" : "personnage détecté"}
          </h2>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button type="button" variant="outline" size="sm" onClick={add}>
            <Plus className="size-3.5" />
            Ajouter
          </Button>
          {onRerun ? (
            <Button type="button" variant="outline" size="sm" onClick={onRerun} disabled={validating}>
              <RefreshCw className="size-3.5" />
              Relancer l'identification
            </Button>
          ) : null}
        </div>
      </div>

      {allWarnings.length ? (
        <div className="rounded-[var(--radius-md)] bg-[var(--bg)] px-4 py-3 text-sm text-[var(--fg-muted)]">
          {allWarnings.map((w) => (
            <p key={w}>— {w}</p>
          ))}
        </div>
      ) : null}

      {characters.length === 0 ? (
        <p className="text-sm text-[var(--fg-muted)]">
          Aucun personnage n'a été identifié. Ajoutez-en un manuellement ou relancez l'identification.
        </p>
      ) : (
        <ol className="grid gap-3">
          {characters.map((c, i) => {
            const editing = editingId === c.id;
            return (
              <li
                key={c.id}
                className="rounded-[var(--radius-lg)] bg-[var(--bg)] p-4 shadow-[inset_0_0_0_1px_var(--border)]"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <span
                      className="mt-1 size-2.5 shrink-0 rounded-full"
                      style={{ background: `var(${swatchForCharacter(c, i).cssVar})` }}
                    />
                    <div>
                      <p className="font-mono text-[11px] tracking-wide text-[var(--accent)]">
                        {i + 1} · {c.id}
                      </p>
                      <h3 className="font-display text-xl">{c.name || c.designation}</h3>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Badge>{labelCharacterType(c.characterType)}</Badge>
                    <Badge>{PROMINENCE[c.prominence]}</Badge>
                    <ConfidenceBadge value={c.nameConfidence} />
                  </div>
                </div>

                {editing ? (
                  <div className="mt-4 grid gap-3 sm:grid-cols-2">
                    <label className="text-xs text-[var(--fg-subtle)]">
                      Nom
                      <Input
                        className="mt-1"
                        value={c.name ?? ""}
                        onChange={(e) =>
                          update(c.id, {
                            name: e.target.value || null,
                            designation: e.target.value || c.designation,
                          })
                        }
                      />
                    </label>
                    <label className="text-xs text-[var(--fg-subtle)]">
                      Type
                      <select
                        className="mt-1 h-10 w-full rounded-[var(--radius-md)] bg-[var(--bg-elevated)] px-3 text-sm text-[var(--fg)]"
                        value={c.characterType ?? "unknown_character"}
                        onChange={(e) => update(c.id, { characterType: e.target.value as CharacterType })}
                      >
                        {TYPES.map((t) => (
                          <option key={t.id} value={t.id}>
                            {t.label}
                          </option>
                        ))}
                      </select>
                    </label>
                    <label className="text-xs text-[var(--fg-subtle)] sm:col-span-2">
                      Apparence
                      <Textarea
                        className="mt-1"
                        value={c.appearance}
                        onChange={(e) => update(c.id, { appearance: e.target.value })}
                      />
                    </label>
                    <label className="text-xs text-[var(--fg-subtle)]">
                      Cheveux
                      <Input className="mt-1" value={c.hair} onChange={(e) => update(c.id, { hair: e.target.value })} />
                    </label>
                    <label className="text-xs text-[var(--fg-subtle)]">
                      Yeux
                      <Input className="mt-1" value={c.eyes} onChange={(e) => update(c.id, { eyes: e.target.value })} />
                    </label>
                    <label className="text-xs text-[var(--fg-subtle)]">
                      Teint
                      <Input className="mt-1" value={c.complexion} onChange={(e) => update(c.id, { complexion: e.target.value })} />
                    </label>
                    <label className="text-xs text-[var(--fg-subtle)]">
                      Morphologie
                      <Input className="mt-1" value={c.morphology} onChange={(e) => update(c.id, { morphology: e.target.value })} />
                    </label>
                    <label className="text-xs text-[var(--fg-subtle)]">
                      Vêtements
                      <Input className="mt-1" value={c.clothing} onChange={(e) => update(c.id, { clothing: e.target.value })} />
                    </label>
                    <label className="text-xs text-[var(--fg-subtle)]">
                      Rôle
                      <Input className="mt-1" value={c.role} onChange={(e) => update(c.id, { role: e.target.value })} />
                    </label>
                  </div>
                ) : (
                  <div className="mt-3 grid gap-3 sm:grid-cols-2">
                    <Field label="Apparence" value={c.appearance} />
                    <Field label="Vêtements" value={c.clothing} />
                    <Field label="Âge apparent" value={c.ageApparent} />
                    <Field label="Rôle" value={c.role} />
                  </div>
                )}

                <div className="mt-4 flex flex-wrap gap-2">
                  <Button type="button" variant="ghost" size="sm" onClick={() => setEditingId(editing ? null : c.id)}>
                    <Pencil className="size-3.5" />
                    {editing ? "Fermer" : "Modifier"}
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => (mergeFrom ? mergeInto(c.id) : setMergeFrom(c.id))}
                  >
                    <GitMerge className="size-3.5" />
                    {mergeFrom === c.id ? "Choisir la cible…" : mergeFrom ? "Fusionner ici" : "Fusionner"}
                  </Button>
                  <Button type="button" variant="ghost" size="sm" onClick={() => remove(c.id)}>
                    <Trash2 className="size-3.5" />
                    Supprimer
                  </Button>
                </div>
              </li>
            );
          })}
        </ol>
      )}

      {onValidate ? (
        <Button type="button" disabled={validating} onClick={onValidate}>
          Valider les personnages
        </Button>
      ) : null}
    </div>
  );
}
