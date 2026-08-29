import { chat } from "../llm.ts";
import { tryExtractJson } from "../parse.ts";
import type { CharacterSheet, VideoAnalysis } from "../types.ts";
import type { DialoguePassDebug } from "./pass-debug.ts";

export function applyRelationshipUpdates(
  characters: CharacterSheet[],
  updates: Array<{ id?: string; relationships?: string }>,
): CharacterSheet[] {
  const byId = new Map(
    updates
      .filter((item) => typeof item.id === "string" && item.id.trim())
      .map((item) => [item.id!.trim(), String(item.relationships ?? "").trim()]),
  );
  if (!byId.size) return characters;
  return characters.map((character) => {
    const next = byId.get(character.id);
    return next ? { ...character, relationships: next } : character;
  });
}

export function sceneRelationshipNotes(
  characters: CharacterSheet[],
  presentIds: string[],
): string {
  const present = new Set(presentIds.filter(Boolean));
  return characters
    .filter((character) => present.has(character.id) && character.relationships?.trim())
    .map((character) => `${character.name || character.designation || character.id} — ${character.relationships.trim()}`)
    .join("\n");
}

function parseRelationshipPayload(raw: unknown): Array<{ id?: string; relationships?: string }> {
  const rec = raw && typeof raw === "object" ? (raw as Record<string, unknown>) : {};
  const list = Array.isArray(raw)
    ? raw
    : Array.isArray(rec.characters)
      ? rec.characters
      : [];
  return list
    .filter((item): item is Record<string, unknown> => Boolean(item && typeof item === "object"))
    .map((item) => ({
      id: typeof item.id === "string" ? item.id : undefined,
      relationships:
        typeof item.relationships === "string"
          ? item.relationships
          : typeof item.relation === "string"
            ? item.relation
            : undefined,
    }));
}

export async function inferCharacterRelationships(
  analysis: VideoAnalysis,
  debug?: DialoguePassDebug,
): Promise<VideoAnalysis> {
  const characters = analysis.characters ?? [];
  const filled = characters.filter((c) => Boolean(c.relationships?.trim())).length;
  if (debug) {
    debug.relationshipsAttempted = false;
    debug.relationshipsOk = false;
    debug.relationshipsFilled = `${filled}/${characters.length}`;
    debug.relationshipsError = undefined;
  }
  if (characters.length < 2) {
    if (debug) debug.relationshipsError = "lt-2-characters";
    return analysis;
  }
  if (debug) debug.relationshipsAttempted = true;
  const roster = characters.map((c) => ({
    id: c.id,
    name: c.name,
    designation: c.designation,
    role: c.role,
  }));
  const sceneSummaries = (analysis.scenes ?? []).map((s) => ({
    number: s.number,
    characters: s.characters,
    action: s.action,
    dialogue: s.dialogue,
  }));
  const result = await chat({
    messages: [
      {
        role: "system",
        content: `Tu analyses les relations entre personnages d'une vidéo à partir de ce qui est OBSERVÉ
(actions, dialogues, façon dont ils s'adressent les uns aux autres). N'invente rien qui ne soit pas
déductible du contenu fourni.
Pour chaque paire de personnages qui interagissent, détermine leur relation si elle est déductible :
famille (père/fils, mère/fille, frère/sœur...), couple (mari/femme, petit ami/petite amie...),
amis, collègues, inconnus, rivaux/ennemis, autre — ou "non déterminable" si le contenu ne permet pas
de conclure. Base-toi sur les formes d'adresse ("papa", "chéri", noms de famille partagés...), le ton,
le contexte des actions.
JSON uniquement : { "characters": [{ "id": "CHARACTER_01", "relationships": "texte court décrivant sa relation à chaque autre personnage pertinent, ex: Père de CHARACTER_02, inconnu de CHARACTER_03." }] }`,
      },
      {
        role: "user",
        content: `PERSONNAGES : ${JSON.stringify(roster)}
SCÈNES (action + dialogue) : ${JSON.stringify(sceneSummaries)}`,
      },
    ],
    maxTokens: 1200,
  });
  if (!result.ok) {
    console.info("[RELATIONSHIPS] skip", result.error);
    if (debug) {
      debug.relationshipsOk = false;
      debug.relationshipsError = result.error;
    }
    return analysis;
  }
  const parsed = tryExtractJson(result.text);
  const next = applyRelationshipUpdates(characters, parseRelationshipPayload(parsed));
  const after = next.filter((c) => Boolean(c.relationships?.trim())).length;
  if (debug) {
    debug.relationshipsOk = true;
    debug.relationshipsFilled = `${after}/${next.length}`;
  }
  return { ...analysis, characters: next };
}
