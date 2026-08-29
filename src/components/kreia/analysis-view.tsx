import { Pencil } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatDuration, formatTimecode } from "@/lib/kreia/frames";
import { kindById, modeById } from "@/lib/kreia/kinds";
import type { KreiaProject, VideoAnalysis } from "@/lib/kreia/types";
import { DialogueBoard } from "./dialogue-board.tsx";
import { CharacterCast } from "./character-cast.tsx";
import { ConfidenceBadge } from "./confidence.tsx";
import { CopyButton } from "./copy-button.tsx";
import { Field, SectionCard } from "./section-card.tsx";

export function AnalysisView({
  project,
  onEdit,
  onAnalysisChange,
}: {
  project: KreiaProject;
  onEdit?: (focus?: string) => void;
  onAnalysisChange?: (analysis: VideoAnalysis) => void;
}) {
  const analysis = project.analysis;
  if (!analysis) return null;
  const kind = kindById(project.kind);
  const mode = modeById(project.mode);

  return (
    <div className="space-y-5">
      <SectionCard
        kicker="Lecture"
        title="Ce qui a été observé"
        action={
          onEdit ? (
            <Button variant="outline" size="sm" onClick={() => onEdit("analysis")}>
              <Pencil className="size-3.5" />
              Corriger
            </Button>
          ) : null
        }
      >
        <p className="text-sm leading-relaxed text-[var(--fg)]">{analysis.observedSummary}</p>
        <p className="mt-3 text-xs text-[var(--fg-subtle)]">
          Durée source {formatDuration(project.video.durationSeconds)} · {analysis.scenes.length}{" "}
          {analysis.scenes.length > 1 ? "scènes" : "scène"} ·{" "}
          {analysis.scenes.reduce((n, s) => n + s.estimatedDuration, 0)} s de prompts
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          <Badge tone="gold">{kind.label}</Badge>
          <Badge>{mode.label}</Badge>
          <Badge tone="muted">{analysis.narrative.genre || "Genre non identifié"}</Badge>
          <Badge tone="muted">{analysis.narrative.tone || "Ton non identifié"}</Badge>
        </div>
        {analysis.limitations.length ? (
          <div className="mt-5 rounded-[var(--radius-md)] bg-[var(--bg)] px-4 py-3">
            <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-[var(--fg-subtle)]">
              Limites de l'observation
            </p>
            <ul className="mt-2 space-y-1 text-sm text-[var(--fg-muted)]">
              {analysis.limitations.map((item) => (
                <li key={item}>— {item}</li>
              ))}
            </ul>
          </div>
        ) : null}
      </SectionCard>

      <SectionCard
        kicker="Structure"
        title="Histoire"
        action={<ConfidenceBadge value={analysis.narrative.confidence} />}
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Sujet" value={analysis.narrative.subject} />
          <Field label="Contexte" value={analysis.narrative.context} />
          <Field label="Situation initiale" value={analysis.narrative.initialSituation} />
          <Field label="Événement déclencheur" value={analysis.narrative.incitingIncident} />
          <Field label="Conflit" value={analysis.narrative.conflict} />
          <Field label="Enjeux" value={analysis.narrative.stakes} />
          <Field label="Climax" value={analysis.narrative.climax} />
          <Field label="Résolution" value={analysis.narrative.resolution} />
        </div>
        <div className="mt-4">
          <Field label="Récit" value={analysis.narrative.story} />
        </div>
      </SectionCard>

      <SectionCard
        kicker="Premières secondes"
        title="Hook original"
        action={<ConfidenceBadge value={analysis.hook.confidence} />}
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Ce qui se passe" value={analysis.hook.firstSecondsDescription} />
          <Field label="Mécanisme d'attention" value={analysis.hook.attentionMechanism} />
          <Field label="Information révélée" value={analysis.hook.revealedInfo} />
          <Field label="Conflit introduit" value={analysis.hook.introducedConflict} />
          <Field label="Curiosité créée" value={analysis.hook.curiosityCreated} />
          <Field label="Pourquoi continuer" value={analysis.hook.whyContinue} />
        </div>
      </SectionCard>

      <SectionCard kicker="Continuité" title="Personnages">
        <CharacterCast
          characters={analysis.characters}
          kind={project.kind}
          onChange={(characters) =>
            onAnalysisChange?.({
              ...analysis,
              characters: characters.map((c) => ({ ...c, userLocked: true })),
            })
          }
        />
      </SectionCard>

      <SectionCard
        kicker="Choix de production"
        title="Style visuel"
        action={<ConfidenceBadge value={analysis.visualStyle.confidence} />}
      >
        <p className="font-display text-2xl text-[var(--champagne)]">
          {analysis.visualStyle.lockedStylePhrase || "Style non verrouillé"}
        </p>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <Field label="Rendu" value={analysis.visualStyle.renderType} />
          <Field label="Style artistique" value={analysis.visualStyle.artisticStyle} />
          <Field label="Apparence des personnages" value={analysis.visualStyle.characterAppearance} />
          <Field label="Éclairage" value={analysis.visualStyle.lighting} />
          <Field label="Palette" value={analysis.visualStyle.colorPalette.join(" · ")} />
          <Field label="Atmosphère" value={analysis.visualStyle.atmosphere} />
          <Field label="Caméra" value={analysis.visualStyle.cameraMovement} />
          <Field label="Rythme" value={analysis.visualStyle.pace} />
        </div>
      </SectionCard>

      <SectionCard kicker="Audio" title="Piste sonore">
        <div className="flex flex-wrap gap-2">
          <Badge tone={analysis.audio.dialoguePresent ? "ok" : "muted"}>
            Dialogue {analysis.audio.dialoguePresent ? "présent" : "non observé"}
          </Badge>
          <Badge tone={analysis.audio.voiceOverPresent ? "ok" : "muted"}>Voix off</Badge>
          <Badge tone={analysis.audio.musicPresent ? "ok" : "muted"}>Musique</Badge>
          <Badge tone={analysis.audio.ambiencePresent ? "ok" : "muted"}>Ambiance</Badge>
          <Badge tone={analysis.audio.sfxPresent ? "ok" : "muted"}>Bruitages</Badge>
        </div>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <Field label="Source" value={analysis.audio.source} />
          <Field label="Rythme" value={analysis.audio.rhythm} />
        </div>
        <div className="mt-3">
          <Field label="Notes" value={analysis.audio.notes} />
        </div>
        {analysis.audio.transcriptExcerpt ? (
          <div className="mt-3">
            <Field label="Extrait de transcription" value={analysis.audio.transcriptExcerpt} />
          </div>
        ) : null}
      </SectionCard>

      <SectionCard kicker="Paroles" title="Dialogues verrouillés">
        <DialogueBoard analysis={analysis} onChange={onAnalysisChange} />
      </SectionCard>

      <SectionCard
        kicker="Découpage"
        title={`${analysis.scenes.length} scène${analysis.scenes.length > 1 ? "s" : ""}`}
      >
        <div className="space-y-3">
          {[...analysis.scenes].sort((a, b) => a.number - b.number).map((scene) => (
            <article
              key={scene.number}
              className="rounded-[var(--radius-lg)] bg-[var(--bg)] p-4"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h3 className="font-display text-xl">
                  Scène {String(scene.number).padStart(2, "0")}
                </h3>
                <div className="flex gap-2">
                  <Badge tone="gold">~{Math.round(scene.estimatedDuration)} s</Badge>
                  {scene.startHint ? (
                    <Badge tone="muted">{scene.startHint}</Badge>
                  ) : null}
                  <ConfidenceBadge value={scene.confidence} />
                </div>
              </div>
              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                <Field label="Lieu" value={scene.setting} />
                <Field label="Caméra" value={scene.camera} />
                <Field label="Action" value={scene.action} />
                <Field label="Émotion" value={scene.emotion} />
                <Field
                  label="Personnages"
                  value={scene.characters.join(", ")}
                  empty="Aucun identifié"
                />
                <Field label="Audio" value={scene.audio} />
              </div>
              {scene.silentReactions?.length ? (
                <div className="mt-3 space-y-1">
                  <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-[var(--fg-subtle)]">
                    Personnages silencieux
                  </p>
                  {scene.silentReactions.map((reaction) => (
                    <p key={`${reaction.characterId}-${reaction.expression}`} className="text-sm text-[var(--fg-muted)]">
                      {reaction.characterLabel || reaction.characterId}
                      {" — "}
                      {[reaction.expression, reaction.gaze, reaction.gesture, reaction.posture]
                        .filter(Boolean)
                        .join(" · ") || "présent, sans parole"}
                    </p>
                  ))}
                </div>
              ) : null}
              {scene.dialogue ? (
                <div className="mt-3 rounded-[var(--radius-sm)] bg-[var(--bg-elevated)] px-3 py-2 text-sm italic">
                  {scene.dialogueSpeaker ? `${scene.dialogueSpeaker} : ` : ""}
                  {scene.dialogue}
                </div>
              ) : (
                <p className="mt-3 text-xs text-[var(--fg-subtle)]">
                  Aucun dialogue observé dans cette scène.
                </p>
              )}
            </article>
          ))}
        </div>
      </SectionCard>

      {project.frames.length ? (
        <SectionCard kicker="Matériau" title="Photogrammes extraits">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {project.frames.map((frame) => (
              <figure key={frame.t}>
                <img
                  src={frame.dataUrl}
                  alt=""
                  className="aspect-video w-full rounded-[var(--radius-md)] object-cover outline outline-1 -outline-offset-1 outline-white/10"
                />
                <figcaption className="mt-1.5 font-mono text-[10px] text-[var(--fg-subtle)]">
                  {formatTimecode(frame.t)}
                </figcaption>
              </figure>
            ))}
          </div>
          <div className="mt-3 flex justify-end">
            <CopyButton
              text={analysis.observedSummary}
              label="Copier le résumé"
            />
          </div>
        </SectionCard>
      ) : null}
    </div>
  );
}
