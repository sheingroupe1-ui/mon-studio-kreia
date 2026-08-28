import { angelPromptBlock } from "./angel.ts";
import { fruitHumanoidPromptBlock } from "./fruit-humanoid.ts";
import { identityFingerprint, remapIdForType, stableIdFor } from "./identity.ts";
import { chat } from "../llm.ts";
import { parseCastResult } from "../parse.ts";
import type {
  CharacterSheet,
  CinematicLanguage,
  FrameCapture,
  ProjectKind,
  VisualStyleAnalysis,
} from "../types";

const CAST_TOKENS = 4200;
export const CAST_BATCH_SIZE = 3;
const CAST_MAX_FRAMES = 12;

export type CastResult = {
  characters: CharacterSheet[];
  visualStyle?: VisualStyleAnalysis;
  cinematic?: CinematicLanguage;
  observedSummary: string;
  limitations: string[];
  language: string | null;
  fatal?: { error: string; message: string };
  done: boolean;
  batchIndex: number;
  batchCount: number;
};

function logPipe(step: number | string, msg: string, extra?: unknown) {
  const prefix = `[CHARACTER PIPELINE] ${step}. ${msg}`;
  if (extra === undefined) console.info(prefix);
  else console.info(prefix, extra);
}

function logPipeError(step: string, err: unknown, extra?: Record<string, unknown>) {
  const error = err instanceof Error ? err : new Error(String(err ?? "unknown"));
  console.error("[CHARACTER PIPELINE ERROR]", {
    exactStep: step,
    errorName: error.name,
    errorMessage: error.message,
    stack: error.stack,
    ...extra,
  });
}

function placeholderCharacter(kind: ProjectKind, index: number): CharacterSheet {
  const type =
    kind === "fruit-humanoid" ? "fruit_humanoid" : kind === "angel" ? "angel" : "unknown_character";
  return {
    id: stableIdFor(index, kind, type),
    designation: `Personnage ${index + 1}`,
    name: null,
    sourceName: null,
    nameConfidence: "inferred",
    characterType: type,
    species: "",
    bodyStructure: "",
    distinctiveFeatures: "",
    wings: "",
    halo: "",
    identityFingerprint: "",
    ageApparent: "",
    sex: "",
    appearance: "Identité temporaire — à préciser après l'analyse.",
    complexion: "",
    morphology: "",
    hair: "",
    eyes: "",
    clothing: "",
    accessories: "",
    role: "",
    personality: "",
    relationships: "",
    prominence: index === 0 ? "principal" : "secondary",
    lockedTraits: [],
    notes: "Personnage temporaire : l'identification automatique n'a pas pu aboutir complètement.",
  };
}

function imagesOf(batch: FrameCapture[]) {
  return batch
    .filter((f) => typeof f.dataUrl === "string" && f.dataUrl.startsWith("data:image/") && f.dataUrl.length > 32)
    .map((frame) => ({
      type: "image_url" as const,
      image_url: { url: frame.dataUrl, detail: "low" as const },
    }));
}

function normalizeSpoken(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function assignStableId(index: number, kind: ProjectKind, type?: CharacterSheet["characterType"]): string {
  return stableIdFor(index, kind, type);
}

export function normalizeCharacterIds(
  characters: CharacterSheet[],
  kind: ProjectKind,
): CharacterSheet[] {
  return characters.map((c, i) => {
    let type = c.characterType || "unknown_character";
    if (kind === "fruit-humanoid" && (type === "unknown" || type === "unknown_character" || !c.characterType)) {
      type = "fruit_humanoid";
    }
    if (type === "unknown") type = "unknown_character";
    let id = (c.id || "").trim();
    if (!id || id === "UNKNOWN") id = stableIdFor(i, kind, type);
    id = remapIdForType(id, type, kind);
    return {
      ...c,
      id,
      characterType: type,
      identityFingerprint: identityFingerprint({ ...c, id, characterType: type }),
    };
  });
}

export function mergeCharacters(
  current: CharacterSheet[],
  incoming: CharacterSheet[],
  kind: ProjectKind,
): CharacterSheet[] {
  const next = [...current];
  for (const add of incoming) {
    const addKey = normalizeSpoken(add.id);
    const addPrint = identityFingerprint(add);
    const match = next.find((c) => {
      if (normalizeSpoken(c.id) === addKey) return true;
      const name = normalizeSpoken(c.name || "");
      const addN = normalizeSpoken(add.name || "");
      if (name && addN && name === addN) return true;
      const print = identityFingerprint(c);
      if (print && addPrint && print === addPrint) return true;
      const sameSpecies =
        normalizeSpoken(c.species || "") &&
        normalizeSpoken(c.species || "") === normalizeSpoken(add.species || "");
      const sameClothes =
        normalizeSpoken(c.clothing || "") &&
        normalizeSpoken(c.clothing || "") === normalizeSpoken(add.clothing || "");
      const sameEyes =
        normalizeSpoken(c.eyes || "") &&
        normalizeSpoken(c.eyes || "") === normalizeSpoken(add.eyes || "");
      if (sameSpecies && sameClothes && sameEyes) return true;
      return false;
    });
    if (!match) {
      next.push(add);
      continue;
    }
    Object.assign(match, {
      designation: match.designation || add.designation,
      name: match.name || add.name,
      appearance: match.appearance || add.appearance,
      clothing: match.clothing || add.clothing,
      hair: match.hair || add.hair,
      eyes: match.eyes || add.eyes,
      complexion: match.complexion || add.complexion,
      morphology: match.morphology || add.morphology,
      accessories: match.accessories || add.accessories,
      lockedTraits: [...new Set([...(match.lockedTraits ?? []), ...(add.lockedTraits ?? [])])],
      notes: match.notes || add.notes,
      species: match.species || add.species,
      bodyStructure: match.bodyStructure || add.bodyStructure,
      distinctiveFeatures: match.distinctiveFeatures || add.distinctiveFeatures,
      wings: match.wings || add.wings,
      halo: match.halo || add.halo,
      characterType:
        match.characterType && match.characterType !== "unknown" && match.characterType !== "unknown_character"
          ? match.characterType
          : add.characterType,
    });
  }
  return normalizeCharacterIds(next, kind);
}

export function pickOverview(frames: FrameCapture[]): FrameCapture[] {
  const valid = frames.filter(
    (f) => typeof f.dataUrl === "string" && f.dataUrl.startsWith("data:image/") && f.dataUrl.length > 32,
  );
  return [...valid].sort((a, b) => a.t - b.t).slice(0, CAST_MAX_FRAMES);
}

export function listCastBatches(frames: FrameCapture[]): FrameCapture[][] {
  const overview = pickOverview(frames);
  if (!overview.length) return [[]];
  const batches: FrameCapture[][] = [];
  for (let i = 0; i < overview.length; i += CAST_BATCH_SIZE) {
    batches.push(overview.slice(i, i + CAST_BATCH_SIZE));
  }
  return batches;
}

export async function identifyCharacters(args: {
  frames: FrameCapture[];
  kind: ProjectKind;
  durationSeconds: number;
  width: number;
  height: number;
  userNotes?: string;
  batchIndex?: number;
  knownCharacters?: CharacterSheet[];
}): Promise<CastResult> {
  const empty: CastResult = {
    characters: args.knownCharacters ?? [],
    observedSummary: "",
    limitations: [],
    language: null,
    done: true,
    batchIndex: 0,
    batchCount: 1,
  };

  try {
    logPipe(1, "Starting identification");
    const sourceOk = Array.isArray(args.frames);
    logPipe(2, `Video source available: ${sourceOk}`);
    const rawCount = sourceOk ? args.frames.length : 0;
    logPipe(3, `Frames count: ${rawCount}`);
    const batches = listCastBatches(args.frames ?? []);
    const batchCount = Math.max(1, batches.length);
    const batchIndex = Math.max(0, Math.min(args.batchIndex ?? 0, batchCount - 1));
    const batch = batches[batchIndex] ?? [];
    const framesValid = batch.some(
      (f) => typeof f.dataUrl === "string" && f.dataUrl.startsWith("data:image/") && f.dataUrl.length > 32,
    );
    logPipe(4, `Frames valid: ${framesValid}`, {
      overview: pickOverview(args.frames ?? []).length,
      batch: batchIndex + 1,
      batchCount,
      times: batch.map((f) => f.t),
    });

    const known = args.knownCharacters ?? [];
    if (!framesValid) {
      logPipeError("4", "No usable frames in batch", { batch: batchIndex + 1 });
      const characters = known.length ? known : [placeholderCharacter(args.kind, 0)];
      return {
        ...empty,
        characters,
        limitations: known.length
          ? [`Lot ${batchIndex + 1}/${batchCount} sans image exploitable — poursuite.`]
          : ["Aucune image exploitable — personnage temporaire créé, l'analyse continue."],
        done: batchIndex + 1 >= batchCount,
        batchIndex,
        batchCount,
      };
    }

    const fruit = fruitHumanoidPromptBlock(args.kind === "fruit-humanoid");
    const angel = angelPromptBlock(args.kind === "angel");
    const idScheme =
      args.kind === "fruit-humanoid"
        ? "FRUIT_CHARACTER_01…"
        : args.kind === "angel"
          ? "ANGEL_CHARACTER_01… pour les anges, CHARACTER_01… pour les humains"
          : "CHARACTER_01…";

    const img = imagesOf(batch);
    logPipe(5, "Preparing analysis request", { batch: batchIndex + 1, images: img.length });
    console.info("[CHARACTERS] Preparing AI request", { batch: batchIndex + 1, images: img.length });
    console.info("[CHARACTERS] AI request START");
    let merged: CharacterSheet[] = known;
    let visualStyle: VisualStyleAnalysis | undefined;
    let cinematic: CinematicLanguage | undefined;
    let observedSummary = "";
    const limitations: string[] = [];
    let language: string | null = null;

    let cast: Awaited<ReturnType<typeof chat>> | undefined;
    try {
      logPipe(6, "Request sent", { batch: batchIndex + 1 });
      cast = await chat({
        messages: [
          {
            role: "system",
            content: `Tu identifies TOUS les PERSONNAGES visibles — humains OU non humains. N'analyse PAS le style visuel. Pas de découpage de scènes. ${fruit}${angel}
characterType ∈ human | fruit_humanoid | angel | animated_character | animal_humanoid | fantasy_character | unknown_character
RÈGLES D'IDENTIFICATION
- Liste CHAQUE personnage distinct : premier plan, arrière-plan, plans larges, plans serrés, silencieux, apparition brève (même 2–3 s), non-humain.
- Le même individu sur plusieurs images = UN seul personnage. Ne pas dupliquer.
- Ne t'arrête pas au protagoniste ni à celui qui parle.
- Si tu n'es pas sûr : inclus-le quand même, nameConfidence = "inferred", notes = "incertain".
- 0 personnage vraiment visible = "characters": []. unknown_character est VALIDE. Jamais d'échec.
IDs : ${idScheme}. name = null si inconnu.
JSON objet : { "observedSummary":"", "limitations":[], "language": null, "characters": [{ "id":"", "designation":"", "name":null, "nameConfidence":"inferred", "characterType":"", "ageApparent":"", "appearance":"", "hair":"", "eyes":"", "complexion":"", "morphology":"", "clothing":"", "accessories":"", "distinctiveFeatures":"", "species":"", "bodyStructure":"", "wings":"", "halo":"", "role":"", "prominence":"principal|secondary|punctual", "firstSeen":"", "lastSeen":"", "notes":"" }] }`,
          },
          {
            role: "user",
            content: [
              {
                type: "text",
                text: `Durée ${Number(args.durationSeconds || 0).toFixed(1)} s, ${args.width || 0}×${args.height || 0}, type ${args.kind}.
Photogrammes ${batch.map((f) => Number(f.t || 0).toFixed(1) + "s").join(", ")} — parcours toute l'image, pas seulement le centre.
Déjà identifiés : ${merged.length ? merged.map((c) => `${c.id} ${c.designation} (${c.appearance || c.clothing || "—"})`).join(" · ") : "aucun — cherche-les tous"}.
${args.userNotes ?? ""}
Si un visage déjà listé réapparaît, réutilise le même ID. Sinon crée un nouveau personnage.`,
              },
              ...img,
            ],
          },
        ],
        maxTokens: CAST_TOKENS,
      });
    } catch (err) {
      logPipeError("6-7", err, { batch: batchIndex + 1 });
      const lastError = err instanceof Error ? err.message : "appel IA interrompu";
      limitations.push(`Image ${batchIndex + 1} ignorée : ${lastError}`);
      const done = batchIndex + 1 >= batchCount;
      return {
        characters: done && !merged.length ? [placeholderCharacter(args.kind, 0)] : merged,
        limitations,
        observedSummary: "",
        language: null,
        done,
        batchIndex,
        batchCount,
      };
    }

    logPipe(7, "Response received", { batch: batchIndex + 1, hasValue: Boolean(cast) });
    console.info("[CHARACTERS] AI response RECEIVED", {
      batch: batchIndex + 1,
      ok: Boolean(cast && "ok" in cast && cast.ok),
      length: cast && "ok" in cast && cast.ok ? cast.text.length : 0,
      error: cast && "error" in cast ? cast.error : undefined,
    });
    const keys = cast && typeof cast === "object" ? Object.keys(cast) : [];
    logPipe(8, "Response status", { ok: Boolean(cast && "ok" in cast && cast.ok), keys });
    const contentExists = Boolean(cast && "ok" in cast && cast.ok && typeof cast.text === "string" && cast.text.trim());
    logPipe(9, `Response content exists: ${contentExists}`, {
      chars: cast && "ok" in cast && cast.ok ? cast.text.length : 0,
    });

    if (!cast || !("ok" in cast) || !cast.ok) {
      const lastError = (cast && "error" in cast && typeof cast.error === "string" && cast.error) || "réponse IA absente";
      logPipeError("8", lastError, { batch: batchIndex + 1 });
      limitations.push(`Image ${batchIndex + 1} ignorée : ${lastError}`);
    } else {
      logPipe(10, "Parsing response");
      try {
        const parsed = parseCastResult(cast.text, args.kind);
        logPipe(11, "Parsed successfully", { count: parsed.characters.length });
        logPipe(12, "Characters result created", {
          ids: parsed.characters.map((c) => c.id),
        });
        merged = mergeCharacters(merged, parsed.characters, args.kind);
        visualStyle = parsed.visualStyle;
        cinematic = parsed.cinematic;
        observedSummary = parsed.observedSummary;
        language = parsed.language;
        limitations.push(...(parsed.limitations ?? []));
      } catch (err) {
        logPipeError("10", err, { receivedResponse: cast.text.slice(0, 240) });
        limitations.push(`Image ${batchIndex + 1} : parse impossible, image ignorée.`);
      }
    }

    const done = batchIndex + 1 >= batchCount;
    if (done && !merged.length) {
      limitations.push("Aucun personnage clairement identifié. L'analyse continue avec un personnage temporaire.");
      merged = [placeholderCharacter(args.kind, 0)];
      logPipe(12, "Fallback placeholder character", { id: merged[0]?.id });
    }

    const characters = normalizeCharacterIds(merged, args.kind);
    logPipe(13, "Updating application state", { count: characters.length, done, batch: batchIndex + 1 });
    logPipe(14, done ? "Moving to next step" : "Cast batch complete — more batches remain");
    return {
      characters,
      visualStyle,
      cinematic,
      observedSummary,
      limitations: [...new Set(limitations.filter(Boolean))],
      language,
      done,
      batchIndex,
      batchCount,
    };
  } catch (err) {
    logPipeError("identifyCharacters", err);
    const known = args.knownCharacters ?? [];
    return {
      ...empty,
      characters: known.length ? known : [placeholderCharacter(args.kind, 0)],
      limitations: [
        `Identification partielle (${err instanceof Error ? err.message : "erreur technique"}). L'analyse continue.`,
      ],
      done: true,
    };
  }
}
