import { anatomyPromptBlock } from "./anatomy";
import { angelPromptBlock } from "./angel";
import { fruitHumanoidPromptBlock } from "./fruit-humanoid";
import type {
  CreativeDirection,
  IdeaCheckpoint,
  IdeateInput,
  IdeaPhase,
  ProjectKind,
} from "../types";
import { styleFromUserChoice } from "../visual-styles";

export function directionBlock(direction: CreativeDirection): string {
  if (direction === "strict") {
    return `DIRECTION : RESPECT STRICT. Ne complète que l'indispensable. Ne change jamais un détail fourni. N'ajoute un personnage que s'il a une fonction réelle.`;
  }
  if (direction === "develop") {
    return `DIRECTION : DÉVELOPPEMENT. Enrichis l'histoire sans trahir le genre, les personnages nommés ni les caractéristiques déjà décrites.`;
  }
  return `DIRECTION : ÉQUILIBRÉE. Respecte l'idée et tous les détails fournis. Complète seulement les zones manquantes.`;
}

export function ideaKindBlock(kind: ProjectKind): string {
  return `${fruitHumanoidPromptBlock(kind === "fruit-humanoid")}${angelPromptBlock(kind === "angel")}${anatomyPromptBlock(kind === "human")}`;
}

export function ideaIds(kind: ProjectKind): string {
  if (kind === "fruit-humanoid") return "FRUIT_CHARACTER_01…";
  if (kind === "angel") return "ANGEL_CHARACTER_01… pour les anges, CHARACTER_01… pour les humains";
  return "CHARACTER_01…";
}

function brief(input: IdeateInput): string {
  return `UNIVERS : ${input.kind === "fruit-humanoid" ? "Fruits humanoïdes" : input.kind === "angel" ? "Anges" : "Histoire humaine"}
${directionBlock(input.direction)}
IDÉE (prioritaire) :
${input.idea.trim()}
${input.extras?.trim() ? `PRÉCISIONS :\n${input.extras.trim()}` : "Pas de précisions."}
Durée cible : ${input.durationSeconds}s — ${input.sceneCount} scènes de 10s.`;
}

export function ideaPhaseSystem(kind: ProjectKind, phase: IdeaPhase): string {
  return `Tu es le scénariste de KREIA Studio. Mode CRÉATION À PARTIR D'UNE IDÉE — pas d'analyse vidéo.
${ideaKindBlock(kind)}
JSON uniquement. Les faits fournis par l'utilisateur sont verrouillés.
IDs personnages : ${ideaIds(kind)}.
Phase : ${phase}.`.trim();
}

export function ideaPhaseUser(input: IdeateInput, cp: IdeaCheckpoint, phase: IdeaPhase): string {
  const ctx = brief(input);
  if (phase === "understand") {
    return `${ctx}

Extrais la compréhension. JSON :
{"mainIdea":"","genre":"","conflict":"","events":[],"mentionedCharacters":[],"relations":[],"locations":[],"emotions":[],"givenFacts":[],"missing":[]}`;
  }
  if (phase === "story") {
    return `${ctx}

Compréhension : ${JSON.stringify(cp.understanding ?? {})}

Construis la structure narrative. JSON :
{"title":"","logline":"","subject":"","beginning":"","progression":"","conflict":"","twists":[],"climax":"","ending":"","tone":""}`;
  }
  if (phase === "characters") {
    return `${ctx}

Histoire : ${JSON.stringify(cp.story ?? {})}
Personnages mentionnés : ${(cp.understanding?.mentionedCharacters ?? []).join(", ") || "aucun nommé"}
Faits donnés : ${(cp.understanding?.givenFacts ?? []).join(" | ")}

Crée UNIQUEMENT les personnages nécessaires. Conserve les traits fournis. JSON :
{"characters":[{"id":"${input.kind === "fruit-humanoid" ? "FRUIT_CHARACTER_01" : "CHARACTER_01"}","name":"","designation":"","characterType":"human|fruit_humanoid|angel|unknown_character","species":"","appearance":"","complexion":"","hair":"","eyes":"","bodyStructure":"","morphology":"","clothing":"","accessories":"","wings":"","halo":"","distinctiveFeatures":"","role":"","personality":"","relationships":"","prominence":"principal","lockedTraits":[]}]}`;
  }
  if (phase === "visual") {
    const style = input.chosenStyleId
      ? `Style CHOISI, à respecter : ${styleFromUserChoice(input.chosenStyleId, input.chosenStyleText).lockedStylePhrase}`
      : "Aucun style choisi — propose un univers visuel cohérent.";
    return `${ctx}
${style}
Ton : ${cp.story?.tone ?? ""}
JSON visualStyle + cinematic (lockedStylePhrase obligatoire).`;
  }
  if (phase === "scenes") {
    return `${ctx}

Histoire : ${JSON.stringify(cp.story ?? {})}
Personnages : ${(cp.characters ?? []).map((c) => `${c.id}=${c.name || c.designation}`).join("; ")}
Style : ${cp.visualStyle?.lockedStylePhrase ?? ""}

Produis EXACTEMENT ${input.sceneCount} scènes, estimatedDuration=10 chacune, continuum narratif.
JSON : {"scenes":[{"number":1,"estimatedDuration":10,"startHint":"0s","characters":[],"setting":"","action":"","emotion":"","camera":"","lighting":"","audio":"","dialogue":null,"dialogueSpeaker":null,"styleNotes":""}]}`;
  }
  return `${ctx}

Scènes : ${JSON.stringify((cp.scenes ?? []).map((s) => ({ n: s.number, action: s.action, characters: s.characters })))}
Personnages : ${(cp.characters ?? []).map((c) => `${c.id}=${c.name || c.designation}`).join("; ")}

Dialogues EN FRANÇAIS uniquement. Un locuteur à la fois. Max 2 personnages parlants par scène. Début rapide. Si une scène n'a pas besoin de parole, lines vides pour elle.
JSON : {"language":"fr","lines":[{"id":"D001","sceneNumber":1,"order":1,"speakerId":"CHARACTER_01","speakerLabel":"","sourceText":"réplique française","displayText":"même texte","emotion":"","intention":""}]}`;
}
