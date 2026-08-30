import { anatomyPromptBlock, anatomyNegativeClause } from "./anatomy";
import { angelPromptBlock } from "./angel";
import { buildContinuityBible, expandCharacterIds } from "./continuity";
import { fruitHumanoidPromptBlock } from "./fruit-humanoid";
import { identityParagraph } from "./identity";
import { formatLockedDialogue, linesForScene } from "./dialogues";
import { formatClock } from "./duration";
import type { GenerateInput, ReconstructionMode, VideoAnalysis } from "../types";

function modeInstructions(mode: ReconstructionMode): string {
  if (mode === "reconstruction") {
    return `
MODE : RECONSTRUCTION
Reproduis FIDÈLEMENT l'histoire, le thème, les événements, l'ordre narratif et les DIALOGUES SOURCE.
Les dialogues verrouillés sont la référence du SENS et de l'ordre.
Les répliques PRONONCÉES dans scene.dialogue et videoPrompt doivent être en FRANÇAIS UNIQUEMENT.
Si la source est dans une autre langue, traduis fidèlement le sens — aucune phrase parlée en anglais, espagnol, portugais, etc.
Interdit : inventer, adoucir, embellir, changer l'ordre des locuteurs.
Seul un prénom modifié par l'utilisateur peut être substitué (Marie → Sarah).
Si aucun dialogue n'a été observé, dialogue = null partout. Ne pas en inventer.
`.trim();
  }
  if (mode === "adaptation") {
    return `
MODE : ADAPTATION
Conserve la mécanique narrative (hook, conflit, rythme, structure) et le style visuel verrouillé.
Tu peux adapter le lieu ou la situation. PAS les paroles.
Les DIALOGUES SOURCE gardent leur sens et leur ordre. Les paroles prononcées dans les prompts sont en FRANÇAIS UNIQUEMENT (traduction fidèle si la source est étrangère).
Seul le prénom peut changer.
Si l'analyse n'a pas de dialogue, dialogue = null partout — n'en invente pas.
`.trim();
  }
  return `
MODE : INSPIRATION ORIGINALE
Conserve : type de hook, rythme, structure, style audiovisuel.
Crée une histoire NOUVELLE, clairement distincte.
Les dialogues inventés pour cette histoire sont en FRANÇAIS UNIQUEMENT.
N'utilise PAS les dialogues source comme répliques du nouveau récit, et ne les présente pas comme paroles de la source.
`.trim();
}

export function buildGenerationSystemPrompt(kind: GenerateInput["kind"]): string {
  return `
Tu es le directeur de production de KREIA Studio.
À partir d'une ANALYSE validée, tu génères un PLAN DE PRODUCTION exploitable (hooks, bible personnages, prompts image, découpage, prompts vidéo).

Tu n'écris pas un résumé. Tu prends des décisions créatives cohérentes à partir de ce qui a été établi, sans trahir le style visuel.

RÈGLES
- lockedStylePhrase et le rendu (textures, matériaux, réalisme) sont TISSÉS dans chaque imagePrompt et videoPrompt — jamais un bloc « STYLE VISUEL » séparé à copier.
- Character ID stables. Chaque prompt décrit le personnage COMPLET (type, visage, corps, vêtements, ailes/espèce si observés) + le style, pas seulement l'ID.
- Les fiches personnages validées par l'utilisateur sont VERROUILLÉES : ne jamais changer visage, coiffure, teint, morphologie, âge apparent, yeux, proportions.
- LANGUE PARLÉE : toutes les répliques entre guillemets dans videoPrompt et scene.dialogue sont en français, même si la source est étrangère. Le sens reste fidèle.
- Ne jamais transformer un fruit en autre fruit, un ange en humain, ni ajouter/retirer des ailes absentes de la fiche.
- Durée de chaque prompt vidéo : 6, 8 ou 10 secondes — JAMAIS plus de 10 s.
- Nombre de scènes = arrondi supérieur de la durée source / 10. Une vidéo de 60 s → 6 prompts. Interdit : un seul prompt si la source > 10 s.
- La SOMME des durées de scènes doit rester proche de la durée source. Interdit de transformer 10 s de source en 24 s de prompts.
- Le hook n'ajoute PAS de durée : c'est le début de la scène 1, pas une scène supplémentaire.
- Continuité : vêtements, lumière, décor, époque, météo. Une scène est la suite de la précédente.
- Ne pas changer de style (pas de photoréaliste si la source est 3D cartoon, etc.).
- Prompts professionnels en français, structurés, prêts à copier-coller (Flow / Grok / Veo 3).
- formattedPrompt (scène) : dossier FR structuré avec les titres du gabarit (scène, durée, style, personnages présents uniquement, lieu, vêtements, description, jeu, répliques exactes de CETTE scène ou « Aucun dialogue. », total caractères, caméra dans la durée, synchro, bloc Flow/Veo).
- formattedSheet (personnage, 1re scène) : fiche complète selon le type (humain / fruit humanoïde / ange), style visuel intégré.
- videoPrompt / imagePrompt / bible restent des champs internes plus courts.
- Si un dialogue est verrouillé pour la scène, le videoPrompt DOIT contenir la réplique en FRANÇAIS (sens fidèle) ET son interprétation observée (émotion, expression, geste, regard, ton, larmes). Interdit d'inventer ou d'adoucir. Aucune réplique parlée dans une autre langue.
- Si des larmes / un cri / un tremblement / un geste important sont dans l'analyse, les reproduire. Ne pas inventer de gestes absents.
- imagePrompt : portrait de référence, cadrage plan américain ou portrait, fond simple cohérent avec l'univers, éclairage adapté.
${fruitHumanoidPromptBlock(kind === "fruit-humanoid")}
${angelPromptBlock(kind === "angel")}
${anatomyPromptBlock(kind === "human")}

SORTIE : JSON unique, pas de markdown.
`.trim();
}

export function buildGenerationUserPrompt(input: GenerateInput): string {
  const { analysis, mode, durationSeconds, userNotes } = input;
  const bible = buildContinuityBible(analysis);
  const anatomy = anatomyNegativeClause(input.kind === "human");

  const characterIndex = analysis.characters
    .map((c) => `${identityParagraph(c)} | empreinte : ${c.identityFingerprint || "—"}`)
    .join("\n");

  const sceneIndex = analysis.scenes
    .map((s) => {
      const who = expandCharacterIds(s.characters, analysis.characters);
      const locked = formatLockedDialogue(linesForScene(analysis.dialogues?.lines ?? [], s.number));
      return `Scène ${String(s.number).padStart(2, "0")} (~${s.estimatedDuration}s) | ${s.setting} | ${s.action} | caméra: ${s.camera} | persos:\n${who}\nDIALOGUE VERROUILLÉ : ${locked ?? "aucun — ne pas inventer"}`;
    })
    .join("\n\n");

  const lockedBlock = analysis.scenes
    .map((s) => {
      const owned = linesForScene(analysis.dialogues?.lines ?? [], s.number);
      if (!owned.length) return `Scène ${String(s.number).padStart(2, "0")} (${s.startHint}) : aucun dialogue`;
      return `Scène ${String(s.number).padStart(2, "0")} (${s.startHint}) :\n${owned
        .map((l) => `${l.id} ${l.timeHint || formatClock(l.startTime ?? 0)} ${l.speakerLabel || l.speakerId} « ${l.displayText || l.sourceText} »`)
        .join("\n")}`;
    })
    .join("\n\n");

  return `
${modeInstructions(mode)}

DURÉE SOURCE : ${durationSeconds.toFixed(1)} s
BUDGET : ${Math.ceil(Math.max(durationSeconds, 0.1) / 10)} scène(s) de 10 s maximum, somme des duration ≈ ${durationSeconds.toFixed(1)} s.
Si la source ≤ 10 s : UNE seule scène (duration 6, 8 ou 10, la plus proche).
Si la source > 10 s : INTERDIT de renvoyer un seul prompt. Découper chronologiquement.
Le hook.duration = duration de la scène 1. Ce n'est pas du temps en plus.
${userNotes ? `NOTES UTILISATEUR : ${userNotes}` : ""}

${bible}

INDEX PERSONNAGES
${characterIndex || "(aucun)"}

HOOK ANALYSÉ
${JSON.stringify(analysis.hook, null, 2)}

NARRATION ANALYSÉE
${JSON.stringify(analysis.narrative, null, 2)}

STYLE
${JSON.stringify(analysis.visualStyle, null, 2)}

LANGAGE CINÉMATOGRAPHIQUE
${JSON.stringify(analysis.cinematic, null, 2)}

AUDIO
${JSON.stringify(analysis.audio, null, 2)}

DIALOGUES PAR SCÈNE — ne jamais copier la liste d'une autre scène dans un prompt
${lockedBlock || "(aucun dialogue identifiable)"}
Source : ${analysis.dialogues?.source ?? analysis.audio.source}
Transcription brute : ${analysis.dialogues?.rawTranscript || analysis.audio.transcriptExcerpt || "non disponible"}

SCÈNES ANALYSÉES
${sceneIndex}

LIMITATIONS DE L'ANALYSE
${analysis.limitations.join(" · ") || "aucune"}

Contrainte anatomique à injecter si humains : ${anatomy || "n/a"}

Génère le JSON :

{
  "hook": {
    "reconstructed": "string — hook reformulé, même mécanique",
    "visualPrompt": "string EN — prompt visuel du hook",
    "duration": 6,
    "mechanism": "string"
  },
  "scenario": {
    "logline": "string",
    "synopsis": "string",
    "structure": "string — hook → développement → climax → résolution",
    "dialoguesNote": "string — pour reconstruction/adaptation : indiquer que les dialogues source sont repris mot à mot"
  },
  "characters": [
    {
      "id": "CHARACTER_01",
      "bible": "string FR — résumé interne d'identité",
      "imagePrompt": "string FR — portrait de référence",
      "formattedSheet": "string FR — fiche complète gabarit humain / fruit humanoïde / ange, style visuel intégré, rien d'inventé"
    }
  ],
  "visualStyle": {
    "lockedPhrase": "string — IDENTIQUE à l'analyse",
    "productionNotes": "string",
    "doNot": ["interdits de style"]
  },
  "scenes": [
    {
      "number": 1,
      "duration": 6,
      "characters": ["CHARACTER_01"],
      "location": "string",
      "action": "string",
      "emotion": "string",
      "camera": "string",
      "lighting": "string",
      "visualStyle": "string — locked phrase + précisions de scène",
      "audio": "string",
      "dialogue": "string|null — EXACTEMENT le dialogue verrouillé de cette scène, ou null",
      "videoPrompt": "string — paragraphe interne court",
      "formattedPrompt": "string FR — bloc complet gabarit scène (titres conservés), uniquement cette scène",
      "continuityNotes": "string — lien avec la scène précédente"
    }
  ]
}

duration de hook et de chaque scène ∈ {6, 8, 10}.
Reprendre les scènes ANALYSÉES en fusionnant les micro-plans de la même action.
Ne pas créer plus de scènes que le budget de durée ne le permet.
Le nombre de prompts ne doit pas faire exploser la durée source.
Ne pas raccourcir un dialogue pour le faire rentrer : choisir 8 ou 10 s, ou répartir la même réplique sans perdre de mots.
`.trim();
}

export function buildReviseAnalysisPrompt(
  analysis: VideoAnalysis,
  instruction: string,
): string {
  return `
Tu corriges une analyse KREIA selon l'instruction utilisateur.
Ne réécris que ce qui est affecté. Conserve le reste à l'identique, y compris les Character ID existants.
N'invente pas de nouveaux faits. Si l'utilisateur impose un changement créatif (ex. « c'est son frère »), applique-le et note-le.
lockedStylePhrase : ne la change que si l'utilisateur le demande.
DIALOGUES VERROUILLÉS : ne paraphrase pas, n'invente pas, ne résume pas. Si l'utilisateur change un prénom, substitue UNIQUEMENT ce prénom dans les répliques (Marie → Sarah) et conserve tous les autres mots. Conserve sourceText d'origine ; displayText reçoit le prénom nouveau.
sourceName des personnages : ne le change pas. name peut changer.

Instruction :
${instruction}

Analyse actuelle (JSON) :
${JSON.stringify(analysis)}

Renvoie l'analyse complète corrigée, même schéma JSON, sans markdown.
`.trim();
}

export function buildReviseProductionPrompt(args: {
  analysis: VideoAnalysis;
  production: unknown;
  instruction: string;
  focus?: {
    section: string;
    characterId?: string;
    sceneNumber?: number;
  };
}): string {
  const focus = args.focus
    ? `Cible : section=${args.focus.section}${args.focus.characterId ? ` character=${args.focus.characterId}` : ""}${typeof args.focus.sceneNumber === "number" ? ` scène=${args.focus.sceneNumber}` : ""}`
    : "Cible : ajustement local, pas de refonte globale.";

  return `
Tu modifies un plan de production KREIA.
${focus}
Conserve lockedStylePhrase, Character ID, et la continuité. Ne régénère pas tout le projet.
Les dialogues source restent verrouillés mot à mot. Si l'instruction change un prénom, substitue uniquement ce prénom.
Instruction : ${args.instruction}

Bible :
${buildContinuityBible(args.analysis)}

Plan actuel :
${JSON.stringify(args.production)}

Renvoie le plan COMPLET mis à jour, même schéma JSON que la génération, sans markdown.
`.trim();
}
