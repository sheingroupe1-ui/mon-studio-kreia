import { angelCharacterId, characterId, fruitCharacterId } from "./ids.ts";
import { emptyDialogueBible, parseDialogueLine, parseSilentReaction } from "./engines/dialogues.ts";
import type {
  AudioAnalysis,
  CharacterProminence,
  CharacterSheet,
  CharacterType,
  CinematicLanguage,
  Confidence,
  HookAnalysis,
  LockedDialogueBible,
  NarrativeAnalysis,
  ProductionPlan,
  ProjectKind,
  SceneAnalysis,
  SceneDuration,
  SceneProduction,
  VideoAnalysis,
  VisualStyleAnalysis,
} from "./types";

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}

function str(v: unknown, fallback = ""): string {
  return typeof v === "string" ? v.trim() : fallback;
}

function strOrNull(v: unknown): string | null {
  if (v === null || v === undefined) return null;
  const s = str(v);
  return s.length ? s : null;
}

function num(v: unknown, fallback = 0): number {
  return typeof v === "number" && Number.isFinite(v) ? v : fallback;
}

function bool(v: unknown, fallback = false): boolean {
  return typeof v === "boolean" ? v : fallback;
}

function strArr(v: unknown): string[] {
  if (!Array.isArray(v)) return [];
  return v.map((x) => str(x)).filter(Boolean);
}

function confidence(v: unknown, fallback: Confidence = "inferred"): Confidence {
  return v === "observed" || v === "inferred" || v === "proposed"
    ? v
    : fallback;
}

function prominence(v: unknown): CharacterProminence {
  return v === "principal" || v === "secondary" || v === "punctual"
    ? v
    : "secondary";
}

function duration(v: unknown, fallback: SceneDuration = 8): SceneDuration {
  if (v === 6 || v === 8 || v === 10) return v;
  const n = Math.round(num(v, fallback));
  if (n <= 6) return 6;
  if (n >= 10) return 10;
  return 8;
}

export function extractJson(text: string): unknown {
  return JSON.parse(coerceJsonText(text)) as unknown;
}

export function tryExtractJson(text: string): unknown | null {
  try {
    return extractJson(text);
  } catch (err) {
    console.error("[kreia:parse] extractJson failed", err instanceof Error ? err.message : err);
    return null;
  }
}

function coerceJsonText(text: string): string {
  const trimmed = (text ?? "").trim();
  if (!trimmed) throw new Error("La réponse du modèle est vide.");
  const fence = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/);
  const raw = fence ? fence[1].trim() : trimmed;
  const obj = raw.indexOf("{");
  const arr = raw.indexOf("[");
  if (arr !== -1 && (obj === -1 || arr < obj)) {
    return closeTruncatedJson(raw.slice(arr));
  }
  if (obj === -1) throw new Error("La réponse du modèle n'est pas un JSON exploitable.");
  const slice = raw.slice(obj);
  const end = slice.lastIndexOf("}");
  if (end > 0) {
    const candidate = slice.slice(0, end + 1);
    try {
      JSON.parse(candidate);
      return candidate;
    } catch {
      /* truncated — repair below */
    }
  }
  return closeTruncatedJson(slice);
}

function closeTruncatedJson(source: string): string {
  let inString = false;
  let escape = false;
  const stack: string[] = [];
  let out = "";
  for (const ch of source) {
    out += ch;
    if (inString) {
      if (escape) {
        escape = false;
        continue;
      }
      if (ch === "\\") {
        escape = true;
        continue;
      }
      if (ch === '"') inString = false;
      continue;
    }
    if (ch === '"') {
      inString = true;
      continue;
    }
    if (ch === "{") stack.push("}");
    else if (ch === "[") stack.push("]");
    else if (ch === "}" || ch === "]") stack.pop();
  }
  if (inString) out += '"';
  out = out.replace(/,\s*$/, "");
  while (stack.length) out += stack.pop();
  JSON.parse(out);
  return out;
}

function characterTypeOf(v: unknown, fallback: CharacterType = "unknown_character"): CharacterType {
  if (v === "animal_character") return "animal_humanoid";
  if (v === "unknown") return "unknown_character";
  if (
    v === "human" ||
    v === "fruit_humanoid" ||
    v === "angel" ||
    v === "animated_character" ||
    v === "animal_humanoid" ||
    v === "fantasy_character" ||
    v === "unknown_character"
  ) {
    return v;
  }
  return fallback;
}

function fallbackIdFor(type: CharacterType, index: number): string {
  if (type === "fruit_humanoid") return fruitCharacterId(index + 1);
  if (type === "angel") return angelCharacterId(index + 1);
  return characterId(index + 1);
}

export function parseCharacter(raw: unknown, index: number, kind?: ProjectKind): CharacterSheet {
  const o = isRecord(raw) ? raw : {};
  const inferredType: CharacterType =
    kind === "fruit-humanoid" && !o.characterType
      ? "fruit_humanoid"
      : characterTypeOf(o.characterType);
  const fallbackId = fallbackIdFor(inferredType, index);
  const rawId = str(o.id, fallbackId);
  const id = rawId
    .toUpperCase()
    .replace(/\s+/g, "_")
    .replace(/[^A-Z0-9_]/g, "")
    .slice(0, 48) || fallbackId;
  return {
    id,
    designation: str(o.designation, `Personnage ${index + 1}`),
    name: strOrNull(o.name),
    sourceName: strOrNull(o.sourceName) ?? strOrNull(o.name),
    nameConfidence: confidence(o.nameConfidence, "inferred"),
    characterType: inferredType,
    species: str(o.species ?? o.fruitType ?? o.angelType),
    bodyStructure: str(o.bodyStructure ?? o.body),
    distinctiveFeatures: str(o.distinctiveFeatures ?? o.features),
    wings: str(o.wings),
    halo: str(o.halo),
    identityFingerprint: str(o.identityFingerprint),
    firstSeen: str(o.firstSeen),
    lastSeen: str(o.lastSeen),
    ageApparent: str(o.ageApparent ?? o.age),
    sex: str(o.sex ?? o.gender),
    appearance: str(o.appearance),
    complexion: str(o.complexion ?? o.skinTone),
    morphology: str(o.morphology),
    hair: str(o.hair),
    eyes: str(o.eyes),
    clothing: str(o.clothing),
    accessories: str(o.accessories),
    role: str(o.role),
    personality: str(o.personality),
    relationships: str(o.relationships),
    prominence: prominence(o.prominence),
    lockedTraits: strArr(o.lockedTraits ?? o.physicalFeatures),
    notes: str(o.notes),
    dialogueColor: strOrNull(o.dialogueColor) ?? undefined,
  };
}

function characterListFrom(parsed: unknown): unknown[] {
  if (Array.isArray(parsed)) return parsed;
  if (!isRecord(parsed)) return [];
  const nested = [parsed.characters, parsed.cast, parsed.personnages, parsed.people];
  for (const item of nested) {
    if (Array.isArray(item)) return item;
  }
  if (isRecord(parsed.data)) return characterListFrom(parsed.data);
  if (isRecord(parsed.result)) return characterListFrom(parsed.result);
  if (isRecord(parsed.analysis)) return characterListFrom(parsed.analysis);
  if (parsed.designation || parsed.characterType || parsed.id) return [parsed];
  return [];
}

export function parseCastResult(
  text: string,
  kind?: ProjectKind,
): {
  characters: CharacterSheet[];
  visualStyle: VisualStyleAnalysis;
  cinematic: CinematicLanguage;
  observedSummary: string;
  limitations: string[];
  language: string | null;
} {
  const parsed = tryExtractJson(text);
  if (parsed == null) {
    console.error("[CHARACTER PIPELINE ERROR] parse: no json", {
      type: typeof text,
      preview: String(text ?? "").slice(0, 240),
    });
    return {
      characters: [],
      visualStyle: parseStyle({}),
      cinematic: parseCinematic({}),
      observedSummary: "",
      limitations: ["Réponse d'identification illisible — poursuite avec un résultat partiel."],
      language: null,
    };
  }
  const record = isRecord(parsed) ? parsed : {};
  const list = characterListFrom(parsed);
  const characters: CharacterSheet[] = [];
  for (const [i, item] of list.entries()) {
    try {
      characters.push(parseCharacter(item, i, kind));
    } catch (err) {
      console.error("[CHARACTER PIPELINE ERROR] skip character", i, err);
    }
  }
  return {
    characters,
    visualStyle: parseStyle(record.visualStyle ?? record.style),
    cinematic: parseCinematic(record.cinematic),
    observedSummary: str(record.observedSummary ?? record.summary),
    limitations: strArr(record.limitations),
    language: strOrNull(record.language),
  };
}

function parseNarrative(raw: unknown): NarrativeAnalysis {
  const o = isRecord(raw) ? raw : {};
  return {
    subject: str(o.subject),
    story: str(o.story),
    context: str(o.context),
    initialSituation: str(o.initialSituation),
    incitingIncident: str(o.incitingIncident),
    conflict: str(o.conflict),
    stakes: str(o.stakes),
    evolution: str(o.evolution),
    climax: str(o.climax),
    resolution: str(o.resolution),
    conclusion: str(o.conclusion),
    cta: strOrNull(o.cta),
    genre: str(o.genre),
    tone: str(o.tone),
    confidence: confidence(o.confidence),
  };
}

function parseHook(raw: unknown): HookAnalysis {
  const o = isRecord(raw) ? raw : {};
  return {
    firstSecondsDescription: str(o.firstSecondsDescription),
    attentionMechanism: str(o.attentionMechanism),
    revealedInfo: str(o.revealedInfo),
    introducedConflict: str(o.introducedConflict),
    curiosityCreated: str(o.curiosityCreated),
    whyContinue: str(o.whyContinue),
    confidence: confidence(o.confidence),
  };
}

function parseStyle(raw: unknown): VisualStyleAnalysis {
  const o = isRecord(raw) ? raw : {};
  const locked = str(o.lockedStylePhrase);
  const renderType = str(o.renderType);
  const artisticStyle = str(o.artisticStyle);
  return {
    renderType,
    artisticStyle,
    characterAppearance: str(o.characterAppearance),
    colorPalette: strArr(o.colorPalette),
    saturation: str(o.saturation),
    contrast: str(o.contrast),
    colorTemperature: str(o.colorTemperature),
    lighting: str(o.lighting),
    shadows: str(o.shadows),
    textures: str(o.textures),
    materials: str(o.materials),
    sets: str(o.sets),
    depthOfField: str(o.depthOfField),
    composition: str(o.composition),
    framing: str(o.framing),
    perspective: str(o.perspective),
    cameraMovement: str(o.cameraMovement),
    pace: str(o.pace),
    transitions: str(o.transitions),
    atmosphere: str(o.atmosphere),
    detailLevel: str(o.detailLevel),
    lockedStylePhrase:
      locked || [renderType, artisticStyle].filter(Boolean).join(", "),
    confidence: confidence(o.confidence),
  };
}

function parseCinematic(raw: unknown): CinematicLanguage {
  const o = isRecord(raw) ? raw : {};
  return {
    dominantShots: strArr(o.dominantShots),
    cameraAngles: strArr(o.cameraAngles),
    movements: strArr(o.movements),
    lightingStyle: str(o.lightingStyle),
    rhythm: str(o.rhythm),
  };
}

function parseScene(raw: unknown, index: number): SceneAnalysis {
  const o = isRecord(raw) ? raw : {};
  return {
    number: Math.max(1, Math.round(num(o.number, index + 1))),
    estimatedDuration: duration(o.estimatedDuration, 8),
    startHint: str(o.startHint),
    characters: strArr(o.characters),
    setting: str(o.setting),
    action: str(o.action),
    emotion: str(o.emotion),
    camera: str(o.camera),
    lighting: str(o.lighting),
    audio: str(o.audio),
    dialogue: strOrNull(o.dialogue),
    dialogueSpeaker: strOrNull(o.dialogueSpeaker),
    styleNotes: str(o.styleNotes),
    confidence: confidence(o.confidence),
    silentReactions: Array.isArray(o.silentReactions)
      ? o.silentReactions.map(parseSilentReaction).filter((x): x is NonNullable<typeof x> => Boolean(x))
      : [],
  };
}

function parseAudio(raw: unknown): AudioAnalysis {
  const o = isRecord(raw) ? raw : {};
  const source =
    o.source === "transcript" ||
    o.source === "subtitles" ||
    o.source === "visual-inference" ||
    o.source === "unavailable"
      ? o.source
      : "unavailable";
  return {
    dialoguePresent: bool(o.dialoguePresent),
    voiceOverPresent: bool(o.voiceOverPresent),
    musicPresent: bool(o.musicPresent),
    ambiencePresent: bool(o.ambiencePresent),
    sfxPresent: bool(o.sfxPresent),
    silenceUsed: bool(o.silenceUsed),
    rhythm: str(o.rhythm),
    transcriptExcerpt: strOrNull(o.transcriptExcerpt),
    notes: str(o.notes),
    source,
  };
}

function parseDialogues(raw: unknown): LockedDialogueBible {
  const o = isRecord(raw) ? raw : {};
  const source =
    o.source === "transcript" ||
    o.source === "subtitles" ||
    o.source === "visual-inference" ||
    o.source === "unavailable"
      ? o.source
      : "unavailable";
  const lines = Array.isArray(o.lines) ? o.lines.map((line, i) => parseDialogueLine(line, i)) : [];
  return {
    language: strOrNull(o.language),
    source,
    rawTranscript: strOrNull(o.rawTranscript),
    lines,
  };
}

export function parseAnalysis(raw: unknown): VideoAnalysis {
  const o = isRecord(raw) ? raw : {};
  const characters = Array.isArray(o.characters)
    ? o.characters.flatMap((c, i) => {
        try {
          return [parseCharacter(c, i)];
        } catch {
          return [];
        }
      })
    : [];
  const scenes = Array.isArray(o.scenes)
    ? o.scenes.map((s, i) => parseScene(s, i))
    : [];
  return {
    observedSummary: str(o.observedSummary),
    limitations: strArr(o.limitations),
    language: strOrNull(o.language),
    sceneCountEstimate: Math.max(
      scenes.length,
      Math.round(num(o.sceneCountEstimate, scenes.length)),
    ),
    narrative: parseNarrative(o.narrative),
    hook: parseHook(o.hook),
    characters,
    visualStyle: parseStyle(o.visualStyle),
    cinematic: parseCinematic(o.cinematic),
    scenes,
    audio: parseAudio(o.audio),
    dialogues: o.dialogues ? parseDialogues(o.dialogues) : emptyDialogueBible(),
  };
}

function parseSceneProduction(raw: unknown, index: number): SceneProduction {
  const o = isRecord(raw) ? raw : {};
  return {
    number: Math.max(1, Math.round(num(o.number, index + 1))),
    duration: duration(o.duration),
    characters: strArr(o.characters),
    location: str(o.location),
    action: str(o.action),
    emotion: str(o.emotion),
    camera: str(o.camera),
    lighting: str(o.lighting),
    visualStyle: str(o.visualStyle),
    audio: str(o.audio),
    dialogue: strOrNull(o.dialogue),
    videoPrompt: str(o.videoPrompt),
    continuityNotes: str(o.continuityNotes),
  };
}

export function parseProduction(raw: unknown): ProductionPlan {
  const o = isRecord(raw) ? raw : {};
  const hook = isRecord(o.hook) ? o.hook : {};
  const scenario = isRecord(o.scenario) ? o.scenario : {};
  const visual = isRecord(o.visualStyle) ? o.visualStyle : {};
  const characters = Array.isArray(o.characters)
    ? o.characters.map((c, i) => {
        const r = isRecord(c) ? c : {};
        return {
          id: str(r.id, characterId(i + 1)),
          bible: str(r.bible),
          imagePrompt: str(r.imagePrompt),
        };
      })
    : [];
  const scenes = Array.isArray(o.scenes)
    ? o.scenes.map((s, i) => parseSceneProduction(s, i))
    : [];
  return {
    hook: {
      reconstructed: str(hook.reconstructed),
      visualPrompt: str(hook.visualPrompt),
      duration: duration(hook.duration, 6),
      mechanism: str(hook.mechanism),
    },
    scenario: {
      logline: str(scenario.logline),
      synopsis: str(scenario.synopsis),
      structure: str(scenario.structure),
      dialoguesNote: str(scenario.dialoguesNote),
    },
    characters,
    visualStyle: {
      lockedPhrase: str(visual.lockedPhrase),
      productionNotes: str(visual.productionNotes),
      doNot: strArr(visual.doNot),
    },
    scenes,
  };
}
