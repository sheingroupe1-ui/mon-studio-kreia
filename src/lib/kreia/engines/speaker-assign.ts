import { chat, type ChatContent } from "../llm.ts";
import { tryExtractJson } from "../parse.ts";
import type { CharacterSheet, DialogueLine, FrameCapture, SceneAnalysis, VideoAnalysis } from "../types.ts";
import type { DialoguePassDebug } from "./pass-debug.ts";
import {
  applyLinesToScenes,
  displayCharacterName,
  isNarratorLabel,
  matchCharacter,
} from "./dialogues.ts";
import { parseLineTime } from "./transcript-slice.ts";

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
      (sceneCharactersByNumber ? undefined : assignments[index]);
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

export function parseSceneTimeWindow(
  scene: SceneAnalysis | undefined,
  lines: DialogueLine[],
): { start: number; end: number } {
  const hint = scene?.startHint ?? "";
  const parts = hint.split(/\s*(?:→|->|–|—)\s*/);
  if (parts.length >= 2) {
    const start =
      parseLineTime(parts[0]!) ??
      (Number.isFinite(Number.parseFloat(parts[0]!)) ? Number.parseFloat(parts[0]!) : null);
    const end =
      parseLineTime(parts[1]!) ??
      (Number.isFinite(Number.parseFloat(parts[1]!)) ? Number.parseFloat(parts[1]!) : null);
    if (start != null && end != null) {
      return { start, end: end > start ? end : start + 10 };
    }
  }
  const times = lines
    .flatMap((line) => [line.startTime, line.endTime])
    .filter((value): value is number => typeof value === "number" && Number.isFinite(value));
  if (times.length) {
    const start = Math.min(...times);
    const end = Math.max(...times);
    return { start, end: end > start ? end : start + 10 };
  }
  const number = Math.max(1, scene?.number ?? 1);
  const start = (number - 1) * 10;
  return { start, end: start + 10 };
}

export function candidateIdsForScene(
  scene: SceneAnalysis | undefined,
  characters: CharacterSheet[],
  lines: DialogueLine[],
): string[] {
  const roster = characters.map((c) => c.id);
  const listed = (scene?.characters ?? []).filter((id) => roster.includes(id));
  if (listed.length >= 2) return listed;
  if (roster.length >= 2 && lines.length >= 2) return roster;
  return listed.length ? listed : roster;
}

export function pickFrameForLine(
  frames: FrameCapture[],
  line: DialogueLine,
  sceneWindow: { start: number; end: number },
): FrameCapture | undefined {
  const usable = frames.filter(
    (frame) => typeof frame.dataUrl === "string" && frame.dataUrl.startsWith("data:image/") && frame.dataUrl.length > 32,
  );
  if (!usable.length) return undefined;
  const target =
    typeof line.startTime === "number"
      ? line.startTime
      : (sceneWindow.start + sceneWindow.end) / 2;
  return [...usable].sort((a, b) => Math.abs(a.t - target) - Math.abs(b.t - target))[0];
}

const MAX_SPEAKER_IMAGES = 6;

function lineChunks<T>(items: T[], size = MAX_SPEAKER_IMAGES): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < items.length; i += size) chunks.push(items.slice(i, i + size));
  return chunks;
}

function speakerUserContent(
  roster: Array<Record<string, unknown>>,
  lines: DialogueLine[],
  frames: FrameCapture[],
  sceneWindow: { start: number; end: number },
): string | ChatContent[] {
  const parts: ChatContent[] = [
    {
      type: "text",
      text: `PERSONNAGES : ${JSON.stringify(roster)}

Pour chaque réplique ci-dessous, l'image qui suit immédiatement montre le moment approximatif où elle est dite. Regarde qui est visible/au premier plan/tourné vers la caméra à CE moment précis — c'est souvent le locuteur, surtout en format court où le plan change avec celui qui parle.`,
    },
  ];
  let imageCount = 0;
  for (const line of lines) {
    parts.push({
      type: "text",
      text: `RÉPLIQUE ${line.id} (ordre ${line.order}) : "${line.sourceText || line.displayText}"`,
    });
    const frame = pickFrameForLine(frames, line, sceneWindow);
    if (frame?.dataUrl) {
      parts.push({ type: "image_url", image_url: { url: frame.dataUrl, detail: "low" } });
      imageCount += 1;
    }
  }
  if (!imageCount) {
    return `PERSONNAGES : ${JSON.stringify(roster)}
RÉPLIQUES DE CETTE SCÈNE : ${JSON.stringify(lines.map((line) => ({ id: line.id, order: line.order, text: line.sourceText || line.displayText, time: line.timeHint || line.startTime })))}`;
  }
  return parts;
}

function updateSpeakerDebug(analysis: VideoAnalysis, debug?: DialoguePassDebug, extra?: Partial<DialoguePassDebug>) {
  if (!debug) return;
  const lines = analysis.dialogues?.lines ?? [];
  const matched = lines.filter((line) => Boolean(line.speakerId)).length;
  debug.speakersMatched = `${matched}/${lines.length}`;
  if (extra?.speakersAttempted !== undefined) debug.speakersAttempted = extra.speakersAttempted;
  if (extra?.speakersOk !== undefined) debug.speakersOk = extra.speakersOk;
  if (extra?.speakersError !== undefined) debug.speakersError = extra.speakersError;
  if (extra?.speakerSceneProgress !== undefined) debug.speakerSceneProgress = extra.speakerSceneProgress;
}

export async function assignSpeakersForScene(
  analysis: VideoAnalysis,
  sceneNumber: number,
  frames: FrameCapture[],
  debug?: DialoguePassDebug,
): Promise<VideoAnalysis> {
  const allLines = analysis.dialogues?.lines ?? [];
  const lines = allLines.filter((line) => line.sceneNumber === sceneNumber);
  if (!lines.length) {
    updateSpeakerDebug(analysis, debug, { speakersAttempted: debug?.speakersAttempted ?? false });
    return analysis;
  }
  const scene = analysis.scenes.find((item) => item.number === sceneNumber);
  const candidateIds = candidateIdsForScene(scene, analysis.characters ?? [], lines);
  const characters = (analysis.characters ?? []).filter((c) => candidateIds.includes(c.id));
  updateSpeakerDebug(analysis, debug, { speakersAttempted: true });
  const roster = characters.map((c) => ({
    id: c.id,
    name: c.name,
    sourceName: c.sourceName,
    designation: c.designation,
    sex: c.sex,
    role: c.role,
  }));
  const window = parseSceneTimeWindow(scene, lines);
  const sceneCharsMap = new Map([[sceneNumber, candidateIds]]);
  let current = analysis;
  for (const chunk of lineChunks(lines)) {
    const result = await chat({
      messages: [
        {
          role: "system",
          content: `Tu attribues chaque réplique de CETTE SCÈNE au bon locuteur.
Règles :
- Pour chaque réplique, une image montre le moment approximatif où elle est dite. Le personnage le plus visible, au premier plan, ou tourné vers la caméra à ce moment est généralement le locuteur — surtout pour ce type de contenu où le plan cadre souvent celui qui parle.
- Si l'image ne permet pas de trancher clairement, utilise les règles de texte (nom tagué dans le transcript, alternance si 2 candidats seulement) en repli.
- speakerId DOIT être l'un des personnages listés dans PERSONNAGES (ou "NARRATOR").
- N'assigne JAMAIS un personnage absent de PERSONNAGES.
JSON uniquement : { "assignments": [{ "id": "D001", "speakerId": "CHARACTER_01" }] }`,
        },
        {
          role: "user",
          content: speakerUserContent(roster, chunk, frames, window),
        },
      ],
      maxTokens: 800,
    });
    if (!result.ok) {
      console.info("[SPEAKERS] scene skip", sceneNumber, result.error);
      updateSpeakerDebug(current, debug, { speakersOk: false, speakersError: result.error });
      continue;
    }
    const parsed = tryExtractJson(result.text);
    const allLinesNow = current.dialogues?.lines ?? [];
    const sceneAssigned = applySpeakerAssignments(
      chunk,
      parseAssignments(parsed),
      current.characters ?? [],
      sceneCharsMap,
    );
    const byId = new Map(sceneAssigned.map((item) => [item.id, item]));
    const merged = allLinesNow.map((item) => byId.get(item.id) ?? item);
    current = {
      ...current,
      dialogues: {
        ...(current.dialogues ?? { language: null, source: "unavailable" as const, rawTranscript: null, lines: [] }),
        lines: merged,
      },
      scenes: applyLinesToScenes(current.scenes, merged),
    };
    updateSpeakerDebug(current, debug, { speakersOk: true, speakersError: undefined });
    console.info(
      "[SPEAKERS] scene",
      sceneNumber,
      sceneAssigned.map((item) => `${item.id}:${item.speakerLabel}`).join(", "),
    );
  }
  return current;
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
