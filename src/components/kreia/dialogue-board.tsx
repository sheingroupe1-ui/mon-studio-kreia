import { ChevronDown, ChevronUp } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  applyDialogueEdits,
  dialogueCharCount,
  emptyPerformance,
  matchCharacter,
  reassignDialogueSpeaker,
  swatchForCharacter,
} from "@/lib/kreia/engines/dialogues";
import type { CharacterSheet, DialogueLine, DialoguePerformance, VideoAnalysis } from "@/lib/kreia/types";
import { cn } from "@/lib/utils";

function SpeakerPip({ colorVar }: { colorVar: string }) {
  return (
    <span
      className="inline-block size-2.5 shrink-0 rounded-full"
      style={{ background: `var(${colorVar})` }}
      aria-hidden
    />
  );
}

function SpeakerSelect({
  line,
  characters,
  onChange,
}: {
  line: DialogueLine;
  characters: CharacterSheet[];
  onChange: (speakerId: string | null) => void;
}) {
  return (
    <label className="relative inline-flex min-h-11 min-w-40 items-center">
      <span className="sr-only">Personnage qui parle</span>
      <select
        className="h-11 w-full appearance-none rounded-[var(--radius-md)] bg-[var(--bg-elevated)] pl-3 pr-8 text-sm text-[var(--fg)] shadow-[inset_0_0_0_1px_color-mix(in_oklab,var(--fg)_14%,transparent)] focus-visible:outline-none focus-visible:shadow-[inset_0_0_0_1px_var(--accent),0_0_0_3px_color-mix(in_oklab,var(--accent)_25%,transparent)]"
        value={line.speakerId ?? ""}
        onChange={(e) => onChange(e.target.value || null)}
      >
        <option value="">Attribution à vérifier</option>
        {characters.map((c) => (
          <option key={c.id} value={c.id}>
            {c.name || c.designation} ({c.id})
          </option>
        ))}
      </select>
      <ChevronDown className="pointer-events-none absolute right-2 size-4 text-[var(--fg-subtle)]" />
    </label>
  );
}

function PerformanceFields({
  line,
  editable,
  onChange,
}: {
  line: DialogueLine;
  editable: boolean;
  onChange: (performance: DialoguePerformance) => void;
}) {
  const p = line.performance ?? emptyPerformance();
  function patch(key: keyof DialoguePerformance, value: string | number) {
    onChange({ ...p, [key]: value });
  }
  const fields: Array<{ key: keyof DialoguePerformance; label: string; wide?: boolean }> = [
    { key: "emotionDominant", label: "Émotion" },
    { key: "tone", label: "Ton" },
    { key: "facialExpression", label: "Expression" },
    { key: "gaze", label: "Regard" },
    { key: "gesture", label: "Geste" },
    { key: "posture", label: "Posture" },
    { key: "tears", label: "Larmes" },
    { key: "evolution", label: "Évolution", wide: true },
  ];
  return (
    <div className="mt-3 grid gap-2 sm:grid-cols-2">
      {fields.map((field) => (
        <label
          key={field.key}
          className={field.wide ? "grid gap-1 sm:col-span-2" : "grid gap-1"}
        >
          <span className="text-[11px] font-medium uppercase tracking-[0.14em] text-[var(--fg-subtle)]">
            {field.label}
          </span>
          {editable ? (
            <Input
              className="h-11"
              value={String(p[field.key] ?? "")}
              onChange={(e) => patch(field.key, e.target.value)}
            />
          ) : (
            <span className="text-sm text-[var(--fg)]">{String(p[field.key] || "—")}</span>
          )}
        </label>
      ))}
      <label className="grid gap-1">
        <span className="text-[11px] font-medium uppercase tracking-[0.14em] text-[var(--fg-subtle)]">
          Intensité
        </span>
        {editable ? (
          <Input
            type="number"
            min={0}
            max={10}
            className="h-11"
            value={p.intensity || ""}
            onChange={(e) => patch("intensity", Math.min(10, Math.max(0, Number(e.target.value) || 0)))}
          />
        ) : (
          <span className="text-sm text-[var(--fg)]">{p.intensity ? `${p.intensity}/10` : "—"}</span>
        )}
      </label>
    </div>
  );
}

export function DialogueBoard({
  analysis,
  onChange,
  onValidate,
  validating,
}: {
  analysis: VideoAnalysis;
  onChange?: (next: VideoAnalysis) => void;
  onValidate?: () => void;
  validating?: boolean;
}) {
  const lines = (analysis.dialogues?.lines ?? [])
    .slice()
    .sort((a, b) => a.order - b.order);
  const characters = analysis.characters;
  const editable = Boolean(onChange);

  function commit(nextLines: DialogueLine[]) {
    onChange?.(applyDialogueEdits(analysis, nextLines));
  }

  function move(index: number, dir: -1 | 1) {
    const ordered = lines.slice();
    const target = index + dir;
    if (target < 0 || target >= ordered.length) return;
    const a = ordered[index]!;
    const b = ordered[target]!;
    ordered[index] = { ...b, order: a.order };
    ordered[target] = { ...a, order: b.order };
    commit(ordered);
  }

  if (!lines.length) {
    return (
      <div className="space-y-3">
        <p className="text-sm text-[var(--fg-muted)]">
          Aucun dialogue identifiable. Rien n’a été inventé.
        </p>
        {onValidate ? (
          <Button type="button" disabled={validating} onClick={onValidate}>
            Valider les dialogues
          </Button>
        ) : null}
      </div>
    );
  }

  const unverified = lines.filter((l) => l.attribution === "unverified" || !l.speakerId).length;

  return (
    <div className="space-y-3">
      <p className="text-xs text-[var(--fg-subtle)]">
        Référence source :{" "}
        {analysis.dialogues.source === "transcript"
          ? "transcription"
          : analysis.dialogues.source === "subtitles"
            ? "sous-titres"
            : analysis.dialogues.source === "visual-inference"
              ? "contexte visuel"
              : "non disponible"}
        . Une réplique = un personnage, dans l’ordre source, avec l’interprétation observée.
      </p>
      {unverified ? (
        <p className="rounded-[var(--radius-md)] bg-[color-mix(in_oklab,var(--speaker-amber)_16%,transparent)] px-3 py-2 text-xs text-[var(--fg)]">
          {unverified} réplique{unverified > 1 ? "s" : ""} à attribuer. Choisis le personnage avant de générer.
        </p>
      ) : null}

      <ul className="space-y-2">
        {lines.map((line, index) => {
          const character = matchCharacter(line.speakerId, characters);
          const swatch = swatchForCharacter(
            character,
            Math.max(0, characters.findIndex((c) => c.id === line.speakerId)),
          );
          const sceneLines = lines.filter((l) => l.sceneNumber === line.sceneNumber);
          const chars = dialogueCharCount(sceneLines);
          const firstOfScene = sceneLines[0]?.id === line.id;
          return (
            <li key={line.id}>
              {firstOfScene ? (
                <p className="mb-2 mt-4 text-[11px] font-medium uppercase tracking-[0.14em] text-[var(--fg-subtle)]">
                  Scène {String(line.sceneNumber).padStart(2, "0")} · TOTAL DIALOGUES : {chars} caractères
                </p>
              ) : null}
              <article
                className={cn(
                  "rounded-[var(--radius-lg)] bg-[var(--bg)] p-3 sm:p-4",
                  line.attribution === "unverified" &&
                    "shadow-[inset_0_0_0_1px_color-mix(in_oklab,var(--speaker-amber)_55%,transparent)]",
                )}
                style={{
                  boxShadow: `inset 3px 0 0 var(${swatch.cssVar})`,
                }}
              >
                <div className="flex flex-wrap items-center gap-2">
                  <SpeakerPip colorVar={swatch.cssVar} />
                  <Badge tone="muted">{line.id}</Badge>
                  <Badge tone="muted">Réplique {line.order}</Badge>
                  {line.attribution === "unverified" ? (
                    <Badge tone="gold">Attribution à vérifier</Badge>
                  ) : (
                    <Badge tone="ok">Attribué</Badge>
                  )}
                  {editable ? (
                    <div className="ml-auto flex gap-1">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        disabled={index === 0}
                        onClick={() => move(index, -1)}
                        aria-label="Monter la réplique"
                      >
                        <ChevronUp className="size-4" />
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        disabled={index === lines.length - 1}
                        onClick={() => move(index, 1)}
                        aria-label="Descendre la réplique"
                      >
                        <ChevronDown className="size-4" />
                      </Button>
                    </div>
                  ) : null}
                </div>
                <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-start">
                  {editable ? (
                    <SpeakerSelect
                      line={line}
                      characters={characters}
                      onChange={(speakerId) => {
                        commit(
                          lines.map((item) =>
                            item.id === line.id
                              ? reassignDialogueSpeaker(item, speakerId, characters)
                              : item,
                          ),
                        );
                      }}
                    />
                  ) : (
                    <p className="flex min-h-11 items-center gap-2 text-sm font-medium">
                      <SpeakerPip colorVar={swatch.cssVar} />
                      {line.speakerLabel || "Locuteur à vérifier"}
                    </p>
                  )}
                  {editable ? (
                    <Textarea
                      className="min-h-20 flex-1"
                      value={line.displayText || line.sourceText}
                      onChange={(e) => {
                        const value = e.target.value;
                        commit(
                          lines.map((item) =>
                            item.id === line.id
                              ? { ...item, displayText: value, sourceText: item.sourceText || value }
                              : item,
                          ),
                        );
                      }}
                    />
                  ) : (
                    <p className="flex-1 text-sm italic leading-relaxed text-[var(--fg)]">
                      {line.displayText || line.sourceText || "…"}
                    </p>
                  )}
                </div>
                <PerformanceFields
                  line={line}
                  editable={editable}
                  onChange={(performance) => {
                    commit(
                      lines.map((item) => (item.id === line.id ? { ...item, performance } : item)),
                    );
                  }}
                />
              </article>
            </li>
          );
        })}
      </ul>
      {onValidate ? (
        <Button type="button" disabled={validating} onClick={onValidate}>
          Valider les dialogues
        </Button>
      ) : null}
    </div>
  );
}
