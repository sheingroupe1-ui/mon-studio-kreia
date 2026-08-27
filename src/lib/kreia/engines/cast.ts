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

const CAST_TOKENS = 3200;

export type CastResult = {
  characters: CharacterSheet[];
  visualStyle?: VisualStyleAnalysis;
  cinematic?: CinematicLanguage;
  observedSummary: string;
  limitations: string[];
  language: string | null;
  fatal?: { error: string; message: string };
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

function pickOverview(frames: FrameCapture[]): FrameCapture[] {
  const valid = frames.filter(
    (f) => typeof f.dataUrl === "string" && f.dataUrl.startsWith("data:image/") && f.dataUrl.length > 32,
  );
  if (valid.length <= 2) return valid;
  const times = [
    valid[0]!.t,
    valid[Math.floor(valid.length / 3)]!.t,
    valid[Math.floor((valid.length * 2) / 3)]!.t,
    valid.at(-1)!.t,
  ];
  const picked: FrameCapture[] = [];
  for (const t of times) {
    const nearest = valid.reduce((a, b) => (Math.abs(b.t - t) < Math.abs(a.t - t) ? b : a));
    if (!picked.some((p) => p.t === nearest.t)) picked.push(nearest);
  }
  return picked;
}

export async function identifyCharacters(args: {
  frames: FrameCapture[];
  kind: ProjectKind;
  durationSeconds: number;
  width: number;
  height: number;
  userNotes?: string;
}): Promise<CastResult> {
  const empty: CastResult = {
    characters: [],
    observedSummary: "",
    limitations: [],
    language: null,
  };

  try {
    logPipe(1, "Starting identification");
    const sourceOk = Array.isArray(args.frames);
    logPipe(2, `Video source available: ${sourceOk}`);
    const rawCount = sourceOk ? args.frames.length : 0;
    logPipe(3, `Frames count: ${rawCount}`);
    const overview = pickOverview(args.frames ?? []);
    const framesValid = overview.length > 0;
    logPipe(4, `Frames valid: ${framesValid}`, { overview: overview.length, times: overview.map((f) => f.t) });

    if (!framesValid) {
      logPipeError("4", "No usable frames");
      return {
        ...empty,
        characters: [placeholderCharacter(args.kind, 0)],
        limitations: ["Aucune image exploitable — personnage temporaire créé, l'analyse continue."],
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

    // One request with at most two frames — sequential 4× vision calls were killing the job session.
    const batches: FrameCapture[][] = [overview.slice(0, 2)];
    if (overview.length > 2) {
      batches.push([overview[overview.length - 1]!]);
    }
    let merged: CharacterSheet[] = [];
    let visualStyle: VisualStyleAnalysis | undefined;
    let cinematic: CinematicLanguage | undefined;
    let observedSummary = "";
    const limitations: string[] = [];
    let language: string | null = null;
    let anyOk = false;
    let lastError = "";

    for (const [batchIndex, batch] of batches.entries()) {
      const img = imagesOf(batch);
      if (!img.length) {
        logPipeError("4b", "batch has no valid image payload", { batch: batchIndex + 1 });
        continue;
      }
      logPipe(5, "Preparing analysis request", { batch: batchIndex + 1, images: img.length });
      let cast: Awaited<ReturnType<typeof chat>> | undefined;
      try {
        logPipe(6, "Request sent", { batch: batchIndex + 1 });
        cast = await chat({
          messages: [
            {
              role: "system",
              content: `Tu identifies les PERSONNAGES visibles — humains OU non humains — et le style visuel. Pas de découpage de scènes. ${fruit}${angel}
characterType ∈ human | fruit_humanoid | angel | animated_character | animal_humanoid | fantasy_character | unknown_character
Un fruit, un ange, un animal humanoïde = un PERSONNAGE. 0 personnage = "characters": []. unknown_character est VALIDE.
IDs : ${idScheme}. name = null si inconnu.
JSON objet : { "observedSummary":"", "limitations":[], "language": null, "characters": [], "visualStyle": { "renderType":"", "artisticStyle":"", "lockedStylePhrase":"", "confidence":"observed" }, "cinematic": { "dominantShots":[], "cameraAngles":[], "movements":[], "lightingStyle":"", "rhythm":"" } }`,
            },
            {
              role: "user",
              content: [
                {
                  type: "text",
                  text: `Durée ${Number(args.durationSeconds || 0).toFixed(1)} s, ${args.width || 0}×${args.height || 0}, type ${args.kind}.
Photogramme ${batch.map((f) => Number(f.t || 0).toFixed(1) + "s").join(", ")}.
Déjà vus : ${merged.length ? merged.map((c) => `${c.id} ${c.designation}`).join(" · ") : "aucun"}.
${args.userNotes ?? ""}`,
                },
                ...img,
              ],
            },
          ],
          maxTokens: CAST_TOKENS,
        });
      } catch (err) {
        logPipeError("6-7", err, { batch: batchIndex + 1 });
        lastError = err instanceof Error ? err.message : "appel IA interrompu";
        limitations.push(`Image ${batchIndex + 1} ignorée : ${lastError}`);
        continue;
      }

      logPipe(7, "Response received", { batch: batchIndex + 1, hasValue: Boolean(cast) });
      const keys = cast && typeof cast === "object" ? Object.keys(cast) : [];
      logPipe(8, "Response status", { ok: Boolean(cast && "ok" in cast && cast.ok), keys });
      const contentExists = Boolean(cast && "ok" in cast && cast.ok && typeof cast.text === "string" && cast.text.trim());
      logPipe(9, `Response content exists: ${contentExists}`, {
        chars: cast && "ok" in cast && cast.ok ? cast.text.length : 0,
      });

      if (!cast || !("ok" in cast) || !cast.ok) {
        lastError = (cast && "error" in cast && typeof cast.error === "string" && cast.error) || "réponse IA absente";
        logPipeError("8", lastError, { batch: batchIndex + 1 });
        limitations.push(`Image ${batchIndex + 1} ignorée : ${lastError}`);
        continue;
      }

      logPipe(10, "Parsing response");
      let parsed;
      try {
        parsed = parseCastResult(cast.text, args.kind);
      } catch (err) {
        logPipeError("10", err, { receivedResponse: cast.text.slice(0, 240) });
        limitations.push(`Image ${batchIndex + 1} : parse impossible, image ignorée.`);
        continue;
      }
      logPipe(11, "Parsed successfully", { count: parsed.characters.length });
      anyOk = true;
      logPipe(12, "Characters result created", {
        ids: parsed.characters.map((c) => c.id),
      });
      merged = mergeCharacters(merged, parsed.characters, args.kind);
      if (parsed.visualStyle?.lockedStylePhrase && !visualStyle) visualStyle = parsed.visualStyle;
      if (parsed.cinematic?.dominantShots?.length && !cinematic) cinematic = parsed.cinematic;
      if (parsed.observedSummary && !observedSummary) observedSummary = parsed.observedSummary;
      if (parsed.language && !language) language = parsed.language;
      limitations.push(...(parsed.limitations ?? []));
    }

    if (!merged.length) {
      limitations.push(
        anyOk
          ? "Aucun personnage clairement identifié. L'analyse continue avec un personnage temporaire."
          : `Identification partielle : ${lastError || "aucune réponse exploitable"}. L'analyse continue.`,
      );
      merged = [placeholderCharacter(args.kind, 0)];
      logPipe(12, "Fallback placeholder character", { id: merged[0]?.id });
    }

    const characters = normalizeCharacterIds(merged, args.kind);
    logPipe(13, "Updating application state", { count: characters.length });
    logPipe(14, "Moving to next step");
    return {
      characters,
      visualStyle,
      cinematic,
      observedSummary,
      limitations: [...new Set(limitations.filter(Boolean))],
      language,
    };
  } catch (err) {
    logPipeError("identifyCharacters", err);
    return {
      ...empty,
      characters: [placeholderCharacter(args.kind, 0)],
      limitations: [
        `Identification partielle (${err instanceof Error ? err.message : "erreur technique"}). L'analyse continue.`,
      ],
    };
  }
}
