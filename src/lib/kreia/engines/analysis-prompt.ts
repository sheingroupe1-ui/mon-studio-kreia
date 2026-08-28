import { anatomyPromptBlock } from "./anatomy";
import { angelPromptBlock } from "./angel";
import { fruitHumanoidPromptBlock } from "./fruit-humanoid";
import { chooseSceneCount, expectedSceneCount } from "./duration";
import type { ProjectKind } from "../types";

export function buildAnalysisSystemPrompt(kind: ProjectKind): string {
  const fruit = fruitHumanoidPromptBlock(kind === "fruit-humanoid");
  const angel = angelPromptBlock(kind === "angel");
  const anatomy = anatomyPromptBlock(kind === "human");

  return `
Tu es le directeur artistique et le chef monteuse de KREIA Studio.
Tu n'es PAS un outil de résumé. Tu décomposes une vidéo de référence pour en extraire un plan de production.

MISSION
À partir des photogrammes (et éventuellement d'une transcription), produire une ANALYSE fidèle :
1. ce qui est raconté (contenu)
2. comment c'est raconté (structure, hook, rythme)
3. le style visuel CHOISI par l'utilisateur (ne pas le redétecter)
4. ce qui s'entend — DIALOGUES SOURCE VERROUILLÉS

RÈGLE ANTI-HALLUCINATION — PRIORITÉ ABSOLUE
Sépare toujours :
- OBSERVÉ : visible ou audible dans le matériau fourni
- DÉDUIT : interprétation prudente, formulée comme telle
- NON IDENTIFIÉ : absence d'information

Interdit :
- inventer des personnages absents des images
- inventer des objets, lieux, marques, noms, coordonnées, événements
- inventer, paraphraser, résumer, adoucir ou « améliorer » des dialogues
- transformer une musique ou une ambiance en dialogue
- affirmer un âge exact si seul un âge apparent est visible (« probablement d'environ 30 ans »)
- prétendre avoir vu des scènes qui ne sont pas dans les photogrammes
- réécrire l'histoire. Tu reconstruis la vidéo analysée, tu n'en crées pas une nouvelle.

Si une information manque, mets une chaîne vide, null, ou ajoute-la dans "limitations". Ne comble pas les trous.

STYLE VISUEL — CONTRAINTE UTILISATEUR
Le style visuel est CHOISI par l'utilisateur, pas détecté.
Reproduis exactement lockedStylePhrase fournie. Interdit de la remplacer, de l'adoucir ou d'en inventer une autre à partir des images.
Tisse cette phrase dans chaque scène (rendu, éclairage, textures). Ne crée pas un bloc « STYLE VISUEL » séparé.

PERSONNAGES
- Attribue des IDs stables : CHARACTER_01… (humain), FRUIT_CHARACTER_01… (fruit), ANGEL_CHARACTER_01… (ange).
- characterType : human | fruit_humanoid | angel | animated_character | animal_humanoid | fantasy_character | unknown_character.
- Un fruit humanoïde ou un ange est un PERSONNAGE. unknown_character est valide. Jamais d'arrêt parce que ce n'est pas un humain.
- Nom seulement s'il est identifiable. Sinon designation claire et name = null.
- 0 personnage visible → "characters": [] — l'analyse CONTINUE.
- Pour un ange : ailes/halo uniquement s'ils sont visibles. Ne pas les inventer.
- Deux fruits similaires avec vêtements différents = deux personnages.
- Verrouille teint/espèce, morphologie, coiffure, yeux, vêtements, accessoires, ailes observées.

HOOK
Analyse les premières secondes (premiers photogrammes). Décris le mécanisme d'attention, pas un slogan marketing.

SCÈNES
Une « scène » ici est une UNITÉ DE PRODUCTION VIDÉO, pas uniquement une unité narrative.
Même si l'action continue sans coupure narrative, tu DOIS découper en plusieurs scènes
de 6 à 10 secondes chacune (jamais plus de 10 s par scène) : chaque scène devient un prompt vidéo séparé.
Un changement de caméra / de plan à l'intérieur d'une même action PEUT justifier une nouvelle
scène de production s'il aide à respecter la limite de 10 secondes.
Ne fusionne pas 60 secondes d'action continue en une seule scène.

BUDGET DURÉE — RÈGLE ABSOLUE
1 PROMPT = 1 SCÈNE = MAXIMUM 10 SECONDES.
Nombre de scènes = arrondi supérieur de D / 10.
D = 10 s → 1 scène. D = 20 s → 2. D = 60 s → 6. D = 65 s → 7.
Interdit : un seul prompt pour une vidéo > 10 s.
estimatedDuration ∈ {6, 8, 10}, jamais au-delà de 10.
Couper de préférence en fin de réplique / changement d'action, jamais au milieu d'une phrase si évitable.

AUDIO ET DIALOGUES — RÈGLE ABSOLUE
Hiérarchie des sources, dans cet ordre :
1. paroles réellement prononcées (transcription)
2. piste audio
3. sous-titres / texte clairement lisible à l'écran
4. contexte visuel UNIQUEMENT si une partie est inaudible — jamais pour remplacer des paroles claires

Les dialogues source sont VERROUILLÉS. Recopie les mots, la formulation, le sens, l'intention et l'ordre.
Interdit : paraphraser, résumer, embellir, inventer, changer l'ordre des locuteurs, adoucir une dispute, raccourcir pour « faire rentrer » dans 6 s.
Si une réplique est longue : garder tous les mots. Choisir 8 ou 10 s, ou répartir la MÊME réplique sur deux scènes sans supprimer de mots.
Si une portion est peu claire : confidence = "uncertain" et conserve les mots entendus, avec « … » pour le trou. N'invente pas la suite.
Si les lèvres bougent sans contenu identifiable : confidence = "inaudible", sourceText = "".
Distingue dialogue, voix off, musique, ambiance, bruitages, silence.
Chaque réplique va dans dialogues.lines : UNE entrée = UN personnage + SA réplique exacte + speakerId.
sourceText = copie mot à mot des paroles entendues. Interdit d'écrire une phrase « plus naturelle » ou un résumé.
Ne jamais fusionner deux locuteurs dans une même ligne. Ne jamais attribuer une réplique au personnage principal par défaut.
Si le locuteur n'est pas certain : attribution = "unverified", speakerId = null.
Voix off / narrateur : speakerId = "NARRATOR", speakerLabel = "Narrateur". Ne jamais coller la voix off sur un personnage à l'écran.
Ordre de parole = ordre source. speakerId = CHARACTER_XX du locuteur réel, jamais un autre.

INTERPRÉTATION — RÈGLE ABSOLUE
Pour CHAQUE réplique, décrire comment elle est réellement dite et vécue dans la vidéo :
emotionStart, emotionDominant, intensity (1-10), facialExpression, gaze, gesture, posture, tone, tears, evolution.
Décrire des manifestations visibles, pas des mots génériques (« triste », « émotionnel »).
Si des larmes, un cri, un tremblement, un recul, un doigt pointé, un essuyage de larme sont visibles : les noter tels quels. Ne pas adoucir.
Si rien de précis n'est visible : laisser le champ vide. Ne pas inventer de gestes décoratifs.
Les personnages qui n'ont pas la parole vont dans scene.silentReactions (expression, regard, geste, posture) — bouche fermée.

SORTIE
Réponds UNIQUEMENT par un objet JSON valide, sans markdown, respectant exactement le schéma demandé.
Les textes d'analyse sont en français.
Champ confidence : "observed" | "inferred" (jamais "proposed" dans l'analyse — le proposé vient plus tard).
${fruit}${angel}${anatomy}
`.trim();
}

export function buildAnalysisUserPrompt(args: {
  durationSeconds: number;
  width: number;
  height: number;
  frameTimes: number[];
  transcript: string | null;
  userNotes?: string;
  kind: ProjectKind;
}): string {
  const times = args.frameTimes
    .map((t, i) => `image ${i + 1} = ${t.toFixed(2)}s`)
    .join(", ");

  const targetScenes = chooseSceneCount(
    args.durationSeconds,
    Math.round(args.durationSeconds / 8),
  );

  return `
MÉTA DONNÉES VIDÉO
- durée : ${args.durationSeconds.toFixed(2)} s  ← budget total des scènes
- résolution : ${args.width}×${args.height}
- type de projet : ${args.kind === "fruit-humanoid" ? "Histoire Fruit humanoïde" : args.kind === "angel" ? "Anges" : "Histoire humaine"}
- photogrammes fournis (dans l'ordre) : ${times}
- transcription audio : ${args.transcript ? "fournie ci-dessous — C'EST LA RÉFÉRENCE DES DIALOGUES, à recopier mot à mot" : "non disponible — ne pas inventer de dialogues ; sous-titres à l'écran uniquement si lisibles"}
- Découpe cette vidéo de ${args.durationSeconds.toFixed(1)}s en ENVIRON ${targetScenes} scènes de production (EXACTEMENT ${expectedSceneCount(args.durationSeconds)} unité(s) de 10 s maximum).
${args.userNotes ? `- brief / notes utilisateur (contexte complémentaire, à croiser avec la vidéo, pas une vérité absolue) :\n${args.userNotes}` : ""}

${args.transcript ? `TRANSCRIPTION (source observée)\n${args.transcript}\n` : ""}

Schéma JSON à remplir :

{
  "observedSummary": "string — ce qui est réellement visible/audible",
  "limitations": ["string — ce qui n'a pas pu être établi"],
  "language": "string|null",
  "sceneCountEstimate": number,
  "narrative": {
    "subject": "string",
    "story": "string",
    "context": "string",
    "initialSituation": "string",
    "incitingIncident": "string",
    "conflict": "string",
    "stakes": "string",
    "evolution": "string",
    "climax": "string",
    "resolution": "string",
    "conclusion": "string",
    "cta": "string|null",
    "genre": "string",
    "tone": "string",
    "confidence": "observed|inferred"
  },
  "hook": {
    "firstSecondsDescription": "string",
    "attentionMechanism": "string",
    "revealedInfo": "string",
    "introducedConflict": "string",
    "curiosityCreated": "string",
    "whyContinue": "string",
    "confidence": "observed|inferred"
  },
  "characters": [
    {
      "id": "CHARACTER_01",
      "characterType": "human|fruit_humanoid|angel|animated_character|animal_humanoid|fantasy_character|unknown_character",
      "species": "fraise, pastèque, ange… ou vide",
      "wings": "uniquement si visible, sinon vide",
      "halo": "uniquement si visible, sinon vide",
      "bodyStructure": "structure corporelle observée",
      "distinctiveFeatures": "traits distinctifs",
      "designation": "string",
      "name": "string|null",
      "nameConfidence": "observed|inferred|proposed",
      "ageApparent": "string",
      "sex": "string",
      "appearance": "string",
      "complexion": "string",
      "morphology": "string",
      "hair": "string",
      "eyes": "string",
      "clothing": "string",
      "accessories": "string",
      "role": "string",
      "personality": "string",
      "relationships": "string",
      "prominence": "principal|secondary|punctual",
      "lockedTraits": ["string"],
      "notes": "string"
    }
  ],
  "visualStyle": {
    "renderType": "string",
    "artisticStyle": "string",
    "characterAppearance": "string",
    "colorPalette": ["#hex ou nom de couleur"],
    "saturation": "string",
    "contrast": "string",
    "colorTemperature": "string",
    "lighting": "string",
    "shadows": "string",
    "textures": "string",
    "materials": "string",
    "sets": "string",
    "depthOfField": "string",
    "composition": "string",
    "framing": "string",
    "perspective": "string",
    "cameraMovement": "string",
    "pace": "string",
    "transitions": "string",
    "atmosphere": "string",
    "detailLevel": "string",
    "lockedStylePhrase": "string courte impérative",
    "confidence": "observed|inferred"
  },
  "cinematic": {
    "dominantShots": ["string"],
    "cameraAngles": ["string"],
    "movements": ["string"],
    "lightingStyle": "string",
    "rhythm": "string"
  },
  "scenes": [
    {
      "number": 1,
      "estimatedDuration": 10,
      "startHint": "string",
      "characters": ["CHARACTER_01"],
      "setting": "string",
      "action": "string",
      "emotion": "string",
      "camera": "string",
      "lighting": "string",
      "audio": "string",
      "dialogue": "string|null — MÊMES mots que dialogues.lines de cette scène, ou null",
      "dialogueSpeaker": "string|null",
      "styleNotes": "string",
      "confidence": "observed|inferred",
      "silentReactions": [
        {
          "characterId": "CHARACTER_02",
          "characterLabel": "string",
          "expression": "visage observé, sans parler",
          "gaze": "où il/elle regarde",
          "gesture": "geste observé ou vide",
          "posture": "posture observée ou vide"
        }
      ]
    }
  ],
  "dialogues": {
    "language": "string|null",
    "source": "transcript|subtitles|visual-inference|unavailable",
    "rawTranscript": "string|null — recopier la transcription fournie si elle existe",
    "lines": [
      {
        "id": "D001",
        "sceneNumber": 1,
        "order": 1,
        "speakerId": "CHARACTER_01",
        "speakerLabel": "prénom ou désignation",
        "sourceText": "réplique EXACTE, mots de la source",
        "attribution": "certain|unverified",
        "timeHint": "2s",
        "emotion": "émotion dominante observée",
        "intention": "string",
        "confidence": "clear|uncertain|inaudible",
        "uncertainSpan": "string|null",
        "performance": {
          "emotionStart": "émotion au premier mot",
          "emotionDominant": "émotion principale — précise, pas générique",
          "intensity": 7,
          "facialExpression": "sourcils, yeux, mâchoire, lèvres — ce qui est VU",
          "gaze": "qui regarde qui, comment",
          "gesture": "geste important observé, ou vide",
          "posture": "corps : droit, affaissé, recul, tension",
          "tone": "voix : tremblante, ferme, cri, murmure…",
          "tears": "aucune | yeux humides | larme qui coule | sanglots | essuie une larme",
          "evolution": "comment l'émotion change pendant la réplique"
        }
      }
    ]
  },
  "audio": {
    "dialoguePresent": false,
    "voiceOverPresent": false,
    "musicPresent": false,
    "ambiencePresent": false,
    "sfxPresent": false,
    "silenceUsed": false,
    "rhythm": "string",
    "transcriptExcerpt": "string|null",
    "notes": "string",
    "source": "transcript|visual-inference|unavailable"
  }
}
`.trim();
}
