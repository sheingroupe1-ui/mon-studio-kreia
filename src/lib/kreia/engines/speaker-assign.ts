import { chat } from "../llm.ts";
import { tryExtractJson } from "../parse.ts";
import type { CharacterSheet, DialogueLine, VideoAnalysis } from "../types.ts";
import type { DialoguePassDebug } from "./pass-debug.ts";
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
  sceneCharactersByNumber?: Map<number, string[]>,
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
    const candidatesForLine = sceneCharactersByNumber?.get(line.sceneNumber);
    if (candidatesForLine?.length && !candidatesForLine.includes(matched.id)) return line;
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

export async function assignSpeakersWithLlm(
  analysis: VideoAnalysis,
  debug?: DialoguePassDebug,
): Promise<VideoAnalysis> {
  const lines = analysis.dialogues?.lines ?? [];
  const characters = analysis.characters ?? [];
  const already = lines.filter((line) => Boolean(line.speakerId)).length;
  if (debug) {
    debug.speakersAttempted = false;
    debug.speakersOk = false;
    debug.speakersMatched = `${already}/${lines.length}`;
    debug.speakersError = undefined;
  }
  if (!lines.length || !characters.length) {
    if (debug) debug.speakersError = !lines.length ? "no-lines" : "no-characters";
    return analysis;
  }
  if (debug) debug.speakersAttempted = true;
  const roster = characters.map((c) => ({
    id: c.id,
    name: c.name,
    sourceName: c.sourceName,
    designation: c.designation,
    sex: c.sex,
    role: c.role,
    prominence: c.prominence,
  }));
  const rosterIds = roster.map((r) => r.id);
  const sceneCharactersByNumber = new Map(
    (analysis.scenes ?? []).map((s) => [s.number, (s.characters ?? []).filter(Boolean)]),
  );
  const payload = lines.map((line) => {
    const present = sceneCharactersByNumber.get(line.sceneNumber);
    const candidates = present?.length ? present : rosterIds;
    return {
      id: line.id,
      order: line.order,
      text: line.sourceText || line.displayText,
      time: line.timeHint || line.startTime,
      hint: line.speakerLabel || line.speakerId,
      sceneNumber: line.sceneNumber,
      candidates,
    };
  });
  const result = await chat({
    messages: [
      {
        role: "system",
        content: `Tu attribues chaque réplique au bon locuteur.
Règles :
- Ne change JAMAIS le texte des répliques.
- speakerId = l'ID fourni du personnage qui PRONONCE la réplique, ou "NARRATOR" pour une voix off.
- Pour chaque réplique, le champ "candidates" liste les SEULS personnages présents dans cette scène. speakerId DOIT être l'un de ces candidats (ou "NARRATOR"). N'assigne JAMAIS un personnage absent de cette scène, même s'il existe ailleurs dans le projet.
- Si le transcript tague clairement un nom ("Marie : …"), utilise ce nom pour choisir le candidat correspondant en priorité absolue sur toute autre règle.
- S'il y a 3 candidats ou plus dans une scène, ne te fie PAS uniquement à l'alternance : utilise le contenu de la réplique (qui est nommé, qui répond à qui, le ton, l'âge/rôle du personnage) pour choisir parmi les candidats listés.
- S'il ne reste que 2 candidats après restriction par scène, un échange = locuteurs qui alternent. "Oui" / "Non" / une réponse courte = l'autre personnage. Une phrase qui apostrophe un prénom ("Marie, attends") est dite par l'autre.
- Interdit de coller toutes les répliques sur CHARACTER_01.
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
    if (debug) {
      debug.speakersOk = false;
      debug.speakersError = result.error;
      debug.speakersMatched = `${already}/${lines.length}`;
    }
    return analysis;
  }
  const parsed = tryExtractJson(result.text);
  const assigned = applySpeakerAssignments(
    lines,
    parseAssignments(parsed),
    characters,
    sceneCharactersByNumber,
  );
  const dialogues = {
    ...(analysis.dialogues ?? { language: null, source: "unavailable" as const, rawTranscript: null, lines: [] }),
    lines: assigned,
  };
  const matched = assigned.filter((line) => Boolean(line.speakerId)).length;
  if (debug) {
    debug.speakersOk = true;
    debug.speakersMatched = `${matched}/${assigned.length}`;
  }
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
