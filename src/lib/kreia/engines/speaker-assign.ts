import { chat } from "../llm.ts";
import { tryExtractJson } from "../parse.ts";
import type { CharacterSheet, DialogueLine, VideoAnalysis } from "../types.ts";
import {
  applyLinesToScenes,
  displayCharacterName,
  isNarratorLabel,
  matchCharacter,
} from "./dialogues.ts";

export function applySpeakerAssignments(
  lines: DialogueLine[],
  assignments: Array<{ id?: string; order?: number; speakerId?: string; speakerLabel?: string }>,
  characters: CharacterSheet[],
): DialogueLine[] {
  return lines.map((line, index) => {
    const hit =
      assignments.find((item) => item.id && item.id === line.id) ??
      assignments.find((item) => item.order === line.order) ??
      assignments[index];
    if (!hit) return line;
    if (isNarratorLabel(hit.speakerId) || isNarratorLabel(hit.speakerLabel)) {
      return {
        ...line,
        speakerId: "NARRATOR",
        speakerLabel: "Narrateur",
        attribution: "certain",
      };
    }
    const matched =
      matchCharacter(hit.speakerId, characters) || matchCharacter(hit.speakerLabel, characters);
    if (!matched) return line;
    return {
      ...line,
      speakerId: matched.id,
      speakerLabel: displayCharacterName(matched),
      attribution: "certain",
    };
  });
}

function parseAssignments(raw: unknown): Array<{ id?: string; order?: number; speakerId?: string; speakerLabel?: string }> {
  const rec = raw && typeof raw === "object" ? (raw as Record<string, unknown>) : {};
  const list = Array.isArray(raw)
    ? raw
    : Array.isArray(rec.assignments)
      ? rec.assignments
      : Array.isArray(rec.lines)
        ? rec.lines
        : [];
  return list
    .filter((item): item is Record<string, unknown> => Boolean(item && typeof item === "object"))
    .map((item) => ({
      id: typeof item.id === "string" ? item.id : undefined,
      order: typeof item.order === "number" ? item.order : undefined,
      speakerId: typeof item.speakerId === "string" ? item.speakerId : undefined,
      speakerLabel:
        typeof item.speakerLabel === "string"
          ? item.speakerLabel
          : typeof item.speaker === "string"
            ? item.speaker
            : undefined,
    }));
}

export async function assignSpeakersWithLlm(analysis: VideoAnalysis): Promise<VideoAnalysis> {
  const lines = analysis.dialogues?.lines ?? [];
  const characters = analysis.characters ?? [];
  if (!lines.length || !characters.length) return analysis;
  const roster = characters.map((c) => ({
    id: c.id,
    name: c.name,
    sourceName: c.sourceName,
    designation: c.designation,
    sex: c.sex,
    prominence: c.prominence,
  }));
  const payload = lines.map((line) => ({
    id: line.id,
    order: line.order,
    text: line.sourceText || line.displayText,
    time: line.timeHint || line.startTime,
    hint: line.speakerLabel || line.speakerId,
  }));
  const result = await chat({
    messages: [
      {
        role: "system",
        content: `Tu attribues chaque réplique au bon locuteur.
Règles :
- Ne change JAMAIS le texte des répliques.
- speakerId = l'ID fourni du personnage qui PRONONCE la réplique, ou "NARRATOR" pour une voix off.
- Si le transcript tague "Marie : …", Marie dit cette réplique.
- Interdit de coller toutes les répliques sur CHARACTER_01.
- Un échange = locuteurs qui alternent. "Oui" / "Non" / une réponse courte = l'autre personnage.
- Une phrase qui apostrophe un prénom ("Marie, attends") est dite par l'autre.
JSON uniquement : { "assignments": [{ "id": "D001", "speakerId": "CHARACTER_01" }] }`,
      },
      {
        role: "user",
        content: `PERSONNAGES : ${JSON.stringify(roster)}
TRANSCRIPT : ${analysis.dialogues?.rawTranscript || analysis.audio.transcriptExcerpt || ""}
RÉPLIQUES : ${JSON.stringify(payload)}`,
      },
    ],
    maxTokens: 1200,
  });
  if (!result.ok) {
    console.info("[SPEAKERS] LLM skip", result.error);
    return analysis;
  }
  const parsed = tryExtractJson(result.text);
  const assigned = applySpeakerAssignments(lines, parseAssignments(parsed), characters);
  const dialogues = {
    ...(analysis.dialogues ?? { language: null, source: "unavailable" as const, rawTranscript: null, lines: [] }),
    lines: assigned,
  };
  console.info(
    "[SPEAKERS] assigned",
    assigned.map((line) => `${line.id}:${line.speakerLabel}`).join(", "),
  );
  return {
    ...analysis,
    dialogues,
    scenes: applyLinesToScenes(analysis.scenes, assigned),
  };
}
