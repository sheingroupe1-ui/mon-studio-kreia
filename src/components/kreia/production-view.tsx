import { Download, Pencil } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { downloadText, projectToMarkdown } from "@/lib/kreia/export";
import { dialogueCharCount, matchCharacter, swatchForCharacter } from "@/lib/kreia/engines/dialogues";
import { formatClock, sceneWindows } from "@/lib/kreia/engines/duration";
import type { KreiaProject } from "@/lib/kreia/types";
import { CopyButton } from "./copy-button.tsx";
import { Field, PromptBlock, SectionCard } from "./section-card.tsx";

const SECTIONS = [
  { id: "hook", label: "Hook" },
  { id: "scenario", label: "Histoire" },
  { id: "characters", label: "Personnages" },
  { id: "scenes", label: "Scènes" },
] as const;

export function ProductionView({
  project,
  onEdit,
}: {
  project: KreiaProject;
  onEdit?: (focus: string) => void;
}) {
  const plan = project.production;
  if (!plan) return null;

  return (
    <div className="space-y-5">
      <nav className="sticky top-16 z-20 -mx-4 flex gap-2 overflow-x-auto bg-[color-mix(in_oklab,var(--bg)_88%,transparent)] px-4 py-3 backdrop-blur-md sm:mx-0 sm:rounded-[var(--radius-lg)] sm:px-3">
        {SECTIONS.map((s) => (
          <a
            key={s.id}
            href={`#${s.id}`}
            className="shrink-0 rounded-full px-3 py-2 text-sm text-[var(--fg-muted)] shadow-[inset_0_0_0_1px_var(--border)] hover:text-[var(--fg)]"
          >
            {s.label}
          </a>
        ))}
        <div className="ml-auto shrink-0">
          <Button
            variant="outline"
            size="sm"
            onClick={() =>
              downloadText(
                `${project.title.replace(/\s+/g, "-").toLowerCase()}.md`,
                projectToMarkdown(project),
              )
            }
          >
            <Download className="size-3.5" />
            Exporter
          </Button>
        </div>
      </nav>

      <SectionCard
        id="hook"
        kicker="01"
        title="Hook reconstruit"
        action={
          <div className="flex gap-2">
            <Badge tone="gold">{plan.hook.duration} s</Badge>
            {onEdit ? (
              <Button variant="outline" size="sm" onClick={() => onEdit("hook")}>
                <Pencil className="size-3.5" />
                Modifier
              </Button>
            ) : null}
            <CopyButton text={plan.hook.visualPrompt} />
          </div>
        }
      >
        <p className="font-display text-2xl leading-snug text-[var(--fg)]">
          {plan.hook.reconstructed}
        </p>
        <p className="mt-2 text-sm text-[var(--fg-muted)]">{plan.hook.mechanism}</p>
        <div className="mt-4">
          <p className="mb-2 text-[11px] font-medium uppercase tracking-[0.14em] text-[var(--fg-subtle)]">
            Prompt visuel
          </p>
          <PromptBlock text={plan.hook.visualPrompt} />
        </div>
      </SectionCard>

      <SectionCard
        id="scenario"
        kicker="02"
        title="Histoire"
        action={
          onEdit ? (
            <Button variant="outline" size="sm" onClick={() => onEdit("scenario")}>
              <Pencil className="size-3.5" />
              Modifier
            </Button>
          ) : null
        }
      >
        <Field label="Logline" value={plan.scenario.logline} />
        <div className="mt-4">
          <Field label="Synopsis" value={plan.scenario.synopsis} />
        </div>
        <div className="mt-4">
          <Field label="Structure" value={plan.scenario.structure} />
        </div>
        <div className="mt-4">
          <Field label="Dialogues" value={plan.scenario.dialoguesNote} />
        </div>
      </SectionCard>

      <SectionCard id="characters" kicker="03" title="Personnages">
        <div className="space-y-4">
          {plan.characters.map((c) => (
            <article key={c.id} className="rounded-[var(--radius-lg)] bg-[var(--bg)] p-4">
              <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                <h3 className="font-mono text-sm text-[var(--accent)]">{c.id}</h3>
                <div className="flex gap-2">
                  {onEdit ? (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onEdit(`character:${c.id}`)}
                    >
                      <Pencil className="size-3.5" />
                      Modifier
                    </Button>
                  ) : null}
                  <CopyButton text={c.imagePrompt} />
                </div>
              </div>
              <Field label="Bible de continuité" value={c.bible} />
              <div className="mt-3">
                <p className="mb-2 text-[11px] font-medium uppercase tracking-[0.14em] text-[var(--fg-subtle)]">
                  Prompt image de référence
                </p>
                <PromptBlock text={c.imagePrompt} />
              </div>
            </article>
          ))}
        </div>
      </SectionCard>

      <SectionCard id="scenes" kicker="04" title="Découpage et prompts vidéo">
        <div className="space-y-4">
          {[...plan.scenes].sort((a, b) => a.number - b.number).map((scene) => {
            const windows = sceneWindows(project.video.durationSeconds);
            const window = windows[scene.number - 1];
            return (
            <article
              key={scene.number}
              className="rounded-[var(--radius-lg)] bg-[var(--bg)] p-4 sm:p-5"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <h3 className="font-display text-2xl">
                    Scène {String(scene.number).padStart(2, "0")}
                  </h3>
                  {window ? (
                    <p className="mt-1 text-xs text-[var(--fg-subtle)]">
                      Durée : {formatClock(window.start)} → {formatClock(window.end)}
                      {" · "}
                      {scene.duration} secondes
                    </p>
                  ) : null}
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <Badge tone="gold">{scene.duration} s</Badge>
                  {onEdit ? (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onEdit(`scene:${scene.number}`)}
                    >
                      <Pencil className="size-3.5" />
                      Modifier
                    </Button>
                  ) : null}
                  <CopyButton text={scene.videoPrompt} />
                </div>
              </div>
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <Field
                  label="Personnages"
                  value={scene.characters.join(", ")}
                  empty="Aucun"
                />
                <Field label="Lieu" value={scene.location} />
                <Field label="Action" value={scene.action} />
                <Field label="Émotion" value={scene.emotion} />
                <Field label="Caméra" value={scene.camera} />
                <Field label="Éclairage" value={scene.lighting} />
                <Field label="Style visuel" value={scene.visualStyle} />
                <Field label="Audio" value={scene.audio} />
              </div>
              {(() => {
                const lines = (project.analysis?.dialogues?.lines ?? [])
                  .filter((l) => l.sceneNumber === scene.number)
                  .sort((a, b) => a.order - b.order);
                if (!lines.length && !scene.dialogue) {
                  return (
                    <p className="mt-3 text-xs text-[var(--fg-subtle)]">Pas de dialogue.</p>
                  );
                }
                const total = dialogueCharCount(lines);
                return (
                  <div className="mt-3 space-y-2">
                    <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-[var(--fg-subtle)]">
                      TOTAL DIALOGUES : {total} caractères
                    </p>
                    {lines.length
                      ? lines.map((line) => {
                          const character = matchCharacter(
                            line.speakerId,
                            project.analysis?.characters ?? [],
                          );
                          const swatch = swatchForCharacter(character, 0);
                          return (
                            <p
                              key={line.id}
                              className="rounded-[var(--radius-sm)] bg-[var(--bg-elevated)] px-3 py-2 text-sm italic"
                              style={{ boxShadow: `inset 3px 0 0 var(${swatch.cssVar})` }}
                            >
                              <span className="not-italic font-medium text-[var(--fg)]">
                                {line.speakerLabel || "À vérifier"}
                              </span>
                              {" — "}
                              {line.displayText || line.sourceText}
                            </p>
                          );
                        })
                      : (
                        <p className="whitespace-pre-wrap rounded-[var(--radius-sm)] bg-[var(--bg-elevated)] px-3 py-2 text-sm italic text-[var(--fg)]">
                          {scene.dialogue}
                        </p>
                      )}
                  </div>
                );
              })()}
              {scene.continuityNotes ? (
                <p className="mt-2 text-xs text-[var(--fg-muted)]">
                  Continuité : {scene.continuityNotes}
                </p>
              ) : null}
              <div className="mt-4">
                <p className="mb-2 text-[11px] font-medium uppercase tracking-[0.14em] text-[var(--fg-subtle)]">
                  Prompt vidéo
                </p>
                <PromptBlock text={scene.videoPrompt} />
              </div>
            </article>
            );
          })}
        </div>
      </SectionCard>
    </div>
  );
}
