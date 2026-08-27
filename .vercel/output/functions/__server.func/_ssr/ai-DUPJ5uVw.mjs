import { n as createServerFn, t as TSS_SERVER_FUNCTION } from "./ssr.mjs";
import { t as characterId } from "./ids-Bermtrku.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/ai-DUPJ5uVw.js
var createServerRpc = (serverFnMeta, splitImportFn) => {
	const url = "/_serverFn/" + serverFnMeta.id;
	return Object.assign(splitImportFn, {
		url,
		serverFnMeta,
		[TSS_SERVER_FUNCTION]: true
	});
};
var HUMAN_ANATOMY_CONTROL = `
CONTRÔLE ANATOMIQUE (personnages humains)
Chaque prompt de personnage et de scène humaine doit inclure un verrou anatomique :
- un seul visage par personne, deux yeux, deux oreilles, un nez, une bouche
- deux bras, deux mains, cinq doigts par main
- deux jambes, deux pieds
- proportions humaines cohérentes, pas de membres fusionnés, déformés ou surnuméraires
- pas de visages fusionnés, pas de mains supplémentaires, pas d'yeux supplémentaires
Négatif à intégrer dans les prompts vidéo :
"no extra fingers, no extra limbs, no extra eyes, no fused faces, no deformed anatomy, no extra hands, no extra arms, no extra legs, anatomically correct human body"
`.trim();
function anatomyPromptBlock(humanMode) {
	if (!humanMode) return "";
	return `\n\n${HUMAN_ANATOMY_CONTROL}\n`;
}
function anatomyNegativeClause(humanMode) {
	if (!humanMode) return "";
	return "Anatomically correct adult/child human anatomy as applicable: two arms, two legs, two hands with five fingers each, two eyes, no extra limbs, no fused faces, no deformed anatomy.";
}
var FRUIT_HUMANOID_RULES = `
UNIVERS FRUIT HUMANOID — règles obligatoires
- Aucun humain, aucun visage humain, aucune silhouette humaine, même floue, même en arrière-plan.
- Tous les personnages sont des fruits humanoïdes (corps-fruit, membres, visage stylisé propre à l'espèce).
- L'espèce fruit de chaque Character ID est verrouillée (ex. CHARACTER_01 = pastèque, CHARACTER_02 = ananas). Ne pas changer d'espèce entre les scènes.
- Proportions, visage, vêtements et accessoires restent identiques d'une scène à l'autre, sauf changement narratif explicite.
- Continuité des environnements : même univers, même niveau de stylisation.
- Le style visuel détecté (3D, cartoon, cinématographique, etc.) est une contrainte, pas une suggestion.
- Interdire toute apparition accidentelle d'humain dans les prompts (ajouter une clause négative claire).
`.trim();
function fruitHumanoidPromptBlock(enabled) {
	if (!enabled) return "";
	return `\n\n${FRUIT_HUMANOID_RULES}\n`;
}
function buildAnalysisSystemPrompt(kind) {
	return `
Tu es le directeur artistique et le chef monteuse de KREIA Studio.
Tu n'es PAS un outil de résumé. Tu décomposes une vidéo de référence pour en extraire un plan de production.

MISSION
À partir des photogrammes (et éventuellement d'une transcription), produire une ANALYSE fidèle :
1. ce qui est raconté (contenu)
2. comment c'est raconté (structure, hook, rythme)
3. à quoi ça ressemble (style visuel, langage cinématographique)
4. ce qui s'entend (audio, sans inventer de dialogues)

RÈGLE ANTI-HALLUCINATION — PRIORITÉ ABSOLUE
Sépare toujours :
- OBSERVÉ : visible ou audible dans le matériau fourni
- DÉDUIT : interprétation prudente, formulée comme telle
- NON IDENTIFIÉ : absence d'information

Interdit :
- inventer des personnages absents des images
- inventer des objets, lieux, marques, noms, coordonnées, événements
- inventer des dialogues s'ils n'apparaissent pas dans la transcription ni de façon lisible (lèvres + contexte insuffisant)
- transformer une musique ou une ambiance en dialogue
- affirmer un âge exact si seul un âge apparent est visible (« probablement d'environ 30 ans »)
- prétendre avoir vu des scènes qui ne sont pas dans les photogrammes

Si une information manque, mets une chaîne vide, null, ou ajoute-la dans "limitations". Ne comble pas les trous.

STYLE VISUEL — PRIORITÉ
Identifie précisément le rendu (photoréaliste, semi-réaliste, 3D, 2D, animation, illustration, etc.) et le style artistique.
Produis une lockedStylePhrase courte et impérative, ex. « 3D cartoon cinématographique, éclairage studio chaud, textures satinées ».
Cette phrase deviendra une contrainte de production. Ne la dilue pas.

PERSONNAGES
- Attribue CHARACTER_01, CHARACTER_02, … dans l'ordre d'importance.
- Nom seulement s'il est identifiable (générique, texte à l'écran, transcription). Sinon designation claire (« Femme à la robe bleue ») et name = null, nameConfidence = "assigned" si tu crées le libellé, "observed" si le nom est vu/entendu.
- Verrouille teint, morphologie, coiffure, yeux, vêtements, accessoires.
- prominence : principal | secondary | punctual

HOOK
Analyse les premières secondes (premiers photogrammes). Décris le mécanisme d'attention, pas un slogan marketing.

SCÈNES
Découpe selon les changements de lieu, d'action ou de plan significatifs.
Durée estimée en secondes (nombre). Ne force pas 10 s si l'action tient en 6.
Camera : plan (large / moyen / gros plan / très gros plan / subjectif), angle, mouvement.
Ne crée pas de scène que les images ne justifient pas. Si le découpage est incertain, indique-le dans limitations et confidence = "inferred".

AUDIO
Si une transcription est fournie, c'est la source des dialogues.
Si aucune transcription : ne pas inventer de répliques. Tu peux noter "des lèvres bougent, contenu inaudible" (inferred).
Distingue dialogue, voix off, musique, ambiance, bruitages, silence.

SORTIE
Réponds UNIQUEMENT par un objet JSON valide, sans markdown, respectant exactement le schéma demandé.
Les textes d'analyse sont en français.
Champ confidence : "observed" | "inferred" (jamais "proposed" dans l'analyse — le proposé vient plus tard).
${fruitHumanoidPromptBlock(kind === "fruit-humanoid")}${anatomyPromptBlock(kind === "human")}
`.trim();
}
function buildAnalysisUserPrompt(args) {
	const times = args.frameTimes.map((t, i) => `image ${i + 1} = ${t.toFixed(2)}s`).join(", ");
	return `
MÉTA DONNÉES VIDÉO
- durée : ${args.durationSeconds.toFixed(2)} s
- résolution : ${args.width}×${args.height}
- type de projet : ${args.kind === "fruit-humanoid" ? "Histoire Fruit humanoïde" : "Histoire humaine"}
- photogrammes fournis (dans l'ordre) : ${times}
- transcription audio : ${args.transcript ? "fournie ci-dessous" : "non disponible — ne pas inventer de dialogues"}
${args.userNotes ? `- notes utilisateur : ${args.userNotes}` : ""}

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
      "estimatedDuration": 6,
      "startHint": "string",
      "characters": ["CHARACTER_01"],
      "setting": "string",
      "action": "string",
      "emotion": "string",
      "camera": "string",
      "lighting": "string",
      "audio": "string",
      "dialogue": "string|null",
      "dialogueSpeaker": "string|null",
      "styleNotes": "string",
      "confidence": "observed|inferred"
    }
  ],
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
function characterLockLine(c) {
	const name = c.name ? `${c.name} (${c.designation})` : c.designation;
	return [
		`${c.id} = ${name}`,
		c.ageApparent && `âge apparent : ${c.ageApparent}`,
		c.sex && `sexe : ${c.sex}`,
		c.complexion && `teint : ${c.complexion}`,
		c.morphology && `morphologie : ${c.morphology}`,
		c.hair && `coiffure : ${c.hair}`,
		c.eyes && `yeux : ${c.eyes}`,
		c.clothing && `vêtements : ${c.clothing}`,
		c.accessories && `accessoires : ${c.accessories}`,
		c.appearance && `apparence : ${c.appearance}`
	].filter(Boolean).join(" · ");
}
function buildContinuityBible(analysis) {
	const style = analysis.visualStyle.lockedStylePhrase || [analysis.visualStyle.renderType, analysis.visualStyle.artisticStyle].filter(Boolean).join(", ");
	const characters = analysis.characters.map((c) => `- ${characterLockLine(c)}`).join("\n");
	return `
BIBLE DE CONTINUITÉ — contraintes verrouillées
STYLE VISUEL OBLIGATOIRE (ne jamais changer) : ${style || "non déterminé — rester fidèle aux images"}

PERSONNAGES VERROUILLÉS
${characters || "- aucun personnage identifié"}

RÈGLES
- Réutiliser les Character ID dans chaque scène. Ne jamais renommer un ID.
- Ne pas modifier visage, sexe, âge apparent, morphologie, coiffure, couleur des yeux, vêtements sans raison narrative explicite.
- Une scène suivante n'est pas une autre histoire : même univers, même époque, même météo sauf changement montré.
- Le style visuel de la vidéo source est une contrainte de production, pas une inspiration libre.
- Distinguer clairement CE QUI EST OBSERVÉ, CE QUI EST DÉDUIT, CE QUI EST PROPOSÉ.
`.trim();
}
function expandCharacterIds(ids, characters) {
	if (!ids.length) return "aucun personnage identifié dans cette scène";
	return ids.map((id) => {
		const c = characters.find((x) => x.id === id);
		return c ? characterLockLine(c) : id;
	}).join("\n");
}
function modeInstructions(mode) {
	if (mode === "reconstruction") return `
MODE : RECONSTRUCTION
Reproduis la structure et le contenu général de la vidéo sous forme de projet de production.
Ne copie pas mot à mot des dialogues d'une œuvre existante : recrée des répliques originales de même fonction narrative, uniquement s'il y avait réellement du dialogue.
Si aucun dialogue n'a été observé, dialogue = null partout. Ne pas en inventer.
`.trim();
	if (mode === "adaptation") return `
MODE : ADAPTATION
Conserve la mécanique narrative (hook, conflit, rythme, structure) et le style visuel verrouillé.
Tu peux adapter personnages (en restant dans le type de projet), contexte, lieu ou situation.
Toute adaptation est du PROPOSÉ, distinct de l'analyse.
Si l'analyse n'a pas de dialogue, n'en invente pas sauf nécessité narrative minimale — alors marque-le clairement dans dialoguesNote.
`.trim();
	return `
MODE : INSPIRATION ORIGINALE
Conserve : type de hook, rythme, structure, style audiovisuel.
Crée une histoire NOUVELLE, clairement distincte. Ne reproduis pas l'intrigue source.
Les personnages peuvent être réinventés mais gardent le langage visuel (et le type humain / fruit humanoïde).
Les Character ID restent stables dans tout le plan généré.
`.trim();
}
function buildGenerationSystemPrompt(kind) {
	return `
Tu es le directeur de production de KREIA Studio.
À partir d'une ANALYSE validée, tu génères un PLAN DE PRODUCTION exploitable (hooks, bible personnages, prompts image, découpage, prompts vidéo).

Tu n'écris pas un résumé. Tu prends des décisions créatives cohérentes à partir de ce qui a été établi, sans trahir le style visuel.

RÈGLES
- lockedStylePhrase de l'analyse doit apparaître dans CHAQUE prompt image et vidéo, à l'identique.
- Character ID stables. Chaque prompt de scène décrit le personnage avec ses traits verrouillés, pas seulement l'ID.
- Durée de chaque prompt vidéo : 6, 8 ou 10 secondes — choisir la plus juste pour l'action, jamais gonfler artificiellement.
- Continuité : vêtements, lumière, décor, époque, météo. Une scène est la suite de la précédente.
- Ne pas changer de style (pas de photoréaliste si la source est 3D cartoon, etc.).
- Prompts professionnels, en anglais pour les champs imagePrompt et videoPrompt (meilleure compatibilité des moteurs), reste du plan en français.
- videoPrompt : un bloc continu, précis, prêt à coller (sujet, action, caméra, lumière, style, audio, contraintes).
- imagePrompt : portrait de référence, cadrage plan américain ou portrait, fond simple cohérent avec l'univers, éclairage adapté.
${fruitHumanoidPromptBlock(kind === "fruit-humanoid")}
${anatomyPromptBlock(kind === "human")}

SORTIE : JSON unique, pas de markdown.
`.trim();
}
function buildGenerationUserPrompt(input) {
	const { analysis, mode, durationSeconds, userNotes } = input;
	const bible = buildContinuityBible(analysis);
	const anatomy = anatomyNegativeClause(input.kind === "human");
	const characterIndex = analysis.characters.map((c) => `${c.id}: ${c.designation}${c.name ? ` « ${c.name} »` : ""}`).join("\n");
	const sceneIndex = analysis.scenes.map((s) => {
		const who = expandCharacterIds(s.characters, analysis.characters);
		return `Scène ${String(s.number).padStart(2, "0")} (~${s.estimatedDuration}s) | ${s.setting} | ${s.action} | caméra: ${s.camera} | persos:\n${who}`;
	}).join("\n\n");
	return `
${modeInstructions(mode)}

DURÉE SOURCE : ${durationSeconds.toFixed(1)} s
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
    "dialoguesNote": "string — précise s'il y a des dialogues originaux, adaptés, ou aucun"
  },
  "characters": [
    {
      "id": "CHARACTER_01",
      "bible": "string FR — fiche de continuité",
      "imagePrompt": "string EN — prompt de création d'image de référence"
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
      "dialogue": "string|null",
      "videoPrompt": "string EN — prompt vidéo professionnel complet",
      "continuityNotes": "string — lien avec la scène précédente"
    }
  ]
}

duration de hook et de chaque scène ∈ {6, 8, 10}.
Reprendre TOUS les personnages importants et TOUTES les scènes de l'analyse (fusionner seulement si deux micro-plans sont la même action).
`.trim();
}
function buildReviseAnalysisPrompt(analysis, instruction) {
	return `
Tu corriges une analyse KREIA selon l'instruction utilisateur.
Ne réécris que ce qui est affecté. Conserve le reste à l'identique, y compris les Character ID existants.
N'invente pas de nouveaux faits. Si l'utilisateur impose un changement créatif (ex. « c'est son frère »), applique-le et note-le.
lockedStylePhrase : ne la change que si l'utilisateur le demande.

Instruction :
${instruction}

Analyse actuelle (JSON) :
${JSON.stringify(analysis)}

Renvoie l'analyse complète corrigée, même schéma JSON, sans markdown.
`.trim();
}
function buildReviseProductionPrompt(args) {
	return `
Tu modifies un plan de production KREIA.
${args.focus ? `Cible : section=${args.focus.section}${args.focus.characterId ? ` character=${args.focus.characterId}` : ""}${typeof args.focus.sceneNumber === "number" ? ` scène=${args.focus.sceneNumber}` : ""}` : "Cible : ajustement local, pas de refonte globale."}
Conserve lockedStylePhrase, Character ID, et la continuité. Ne régénère pas tout le projet.
Instruction : ${args.instruction}

Bible :
${buildContinuityBible(args.analysis)}

Plan actuel :
${JSON.stringify(args.production)}

Renvoie le plan COMPLET mis à jour, même schéma JSON que la génération, sans markdown.
`.trim();
}
function isRecord(v) {
	return typeof v === "object" && v !== null && !Array.isArray(v);
}
function str(v, fallback = "") {
	return typeof v === "string" ? v.trim() : fallback;
}
function strOrNull(v) {
	if (v === null || v === void 0) return null;
	const s = str(v);
	return s.length ? s : null;
}
function num(v, fallback = 0) {
	return typeof v === "number" && Number.isFinite(v) ? v : fallback;
}
function bool(v, fallback = false) {
	return typeof v === "boolean" ? v : fallback;
}
function strArr(v) {
	if (!Array.isArray(v)) return [];
	return v.map((x) => str(x)).filter(Boolean);
}
function confidence(v, fallback = "inferred") {
	return v === "observed" || v === "inferred" || v === "proposed" ? v : fallback;
}
function prominence(v) {
	return v === "principal" || v === "secondary" || v === "punctual" ? v : "secondary";
}
function duration(v, fallback = 8) {
	if (v === 6 || v === 8 || v === 10) return v;
	const n = Math.round(num(v, fallback));
	if (n <= 6) return 6;
	if (n >= 10) return 10;
	return 8;
}
function extractJson(text) {
	const trimmed = text.trim();
	const fence = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/);
	const raw = fence ? fence[1].trim() : trimmed;
	const start = raw.indexOf("{");
	const end = raw.lastIndexOf("}");
	if (start === -1 || end === -1 || end <= start) throw new Error("La réponse du modèle n'est pas un JSON exploitable.");
	return JSON.parse(raw.slice(start, end + 1));
}
function parseCharacter(raw, index) {
	const o = isRecord(raw) ? raw : {};
	return {
		id: str(o.id, characterId(index + 1)).toUpperCase().replace(/\s+/g, "_"),
		designation: str(o.designation, `Personnage ${index + 1}`),
		name: strOrNull(o.name),
		nameConfidence: confidence(o.nameConfidence, "inferred"),
		ageApparent: str(o.ageApparent),
		sex: str(o.sex),
		appearance: str(o.appearance),
		complexion: str(o.complexion),
		morphology: str(o.morphology),
		hair: str(o.hair),
		eyes: str(o.eyes),
		clothing: str(o.clothing),
		accessories: str(o.accessories),
		role: str(o.role),
		personality: str(o.personality),
		relationships: str(o.relationships),
		prominence: prominence(o.prominence),
		lockedTraits: strArr(o.lockedTraits),
		notes: str(o.notes)
	};
}
function parseNarrative(raw) {
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
		confidence: confidence(o.confidence)
	};
}
function parseHook(raw) {
	const o = isRecord(raw) ? raw : {};
	return {
		firstSecondsDescription: str(o.firstSecondsDescription),
		attentionMechanism: str(o.attentionMechanism),
		revealedInfo: str(o.revealedInfo),
		introducedConflict: str(o.introducedConflict),
		curiosityCreated: str(o.curiosityCreated),
		whyContinue: str(o.whyContinue),
		confidence: confidence(o.confidence)
	};
}
function parseStyle(raw) {
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
		lockedStylePhrase: locked || [renderType, artisticStyle].filter(Boolean).join(", "),
		confidence: confidence(o.confidence)
	};
}
function parseCinematic(raw) {
	const o = isRecord(raw) ? raw : {};
	return {
		dominantShots: strArr(o.dominantShots),
		cameraAngles: strArr(o.cameraAngles),
		movements: strArr(o.movements),
		lightingStyle: str(o.lightingStyle),
		rhythm: str(o.rhythm)
	};
}
function parseScene(raw, index) {
	const o = isRecord(raw) ? raw : {};
	return {
		number: Math.max(1, Math.round(num(o.number, index + 1))),
		estimatedDuration: Math.max(1, num(o.estimatedDuration, 6)),
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
		confidence: confidence(o.confidence)
	};
}
function parseAudio(raw) {
	const o = isRecord(raw) ? raw : {};
	const source = o.source === "transcript" || o.source === "visual-inference" || o.source === "unavailable" ? o.source : "unavailable";
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
		source
	};
}
function parseAnalysis(raw) {
	const o = isRecord(raw) ? raw : {};
	const characters = Array.isArray(o.characters) ? o.characters.map((c, i) => parseCharacter(c, i)) : [];
	const scenes = Array.isArray(o.scenes) ? o.scenes.map((s, i) => parseScene(s, i)) : [];
	return {
		observedSummary: str(o.observedSummary),
		limitations: strArr(o.limitations),
		language: strOrNull(o.language),
		sceneCountEstimate: Math.max(scenes.length, Math.round(num(o.sceneCountEstimate, scenes.length))),
		narrative: parseNarrative(o.narrative),
		hook: parseHook(o.hook),
		characters,
		visualStyle: parseStyle(o.visualStyle),
		cinematic: parseCinematic(o.cinematic),
		scenes,
		audio: parseAudio(o.audio)
	};
}
function parseSceneProduction(raw, index) {
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
		continuityNotes: str(o.continuityNotes)
	};
}
function parseProduction(raw) {
	const o = isRecord(raw) ? raw : {};
	const hook = isRecord(o.hook) ? o.hook : {};
	const scenario = isRecord(o.scenario) ? o.scenario : {};
	const visual = isRecord(o.visualStyle) ? o.visualStyle : {};
	const characters = Array.isArray(o.characters) ? o.characters.map((c, i) => {
		const r = isRecord(c) ? c : {};
		return {
			id: str(r.id, characterId(i + 1)),
			bible: str(r.bible),
			imagePrompt: str(r.imagePrompt)
		};
	}) : [];
	const scenes = Array.isArray(o.scenes) ? o.scenes.map((s, i) => parseSceneProduction(s, i)) : [];
	return {
		hook: {
			reconstructed: str(hook.reconstructed),
			visualPrompt: str(hook.visualPrompt),
			duration: duration(hook.duration, 6),
			mechanism: str(hook.mechanism)
		},
		scenario: {
			logline: str(scenario.logline),
			synopsis: str(scenario.synopsis),
			structure: str(scenario.structure),
			dialoguesNote: str(scenario.dialoguesNote)
		},
		characters,
		visualStyle: {
			lockedPhrase: str(visual.lockedPhrase),
			productionNotes: str(visual.productionNotes),
			doNot: strArr(visual.doNot)
		},
		scenes
	};
}
var MODEL = "grok-4.5";
var MAX_FRAMES = 6;
var MAX_FRAME_CHARS = 8e4;
var MAX_AUDIO_CHARS = 12e4;
var FETCH_TIMEOUT_MS = 12e4;
var IMPORT_VIDEO_MESSAGE = "Cette vidéo ne peut pas être récupérée directement depuis ce lien. Veuillez importer la vidéo.";
var INVALID_AI_MESSAGE = "L'analyse n'a pas pu être terminée. La réponse reçue est invalide. Veuillez réessayer.";
var NETWORK_MESSAGE = "L'analyse n'a pas pu aboutir. Réessayez.";
function apiKey() {
	return process.env.XAI_API_KEY ?? null;
}
function fail(error) {
	return {
		ok: false,
		error
	};
}
async function withOk(label, run) {
	try {
		const out = await run();
		if (!out || typeof out !== "object" || typeof out.ok !== "boolean") {
			console.error(`[kreia:${label}] handler returned non-ok shape`, out);
			return fail(NETWORK_MESSAGE);
		}
		return out;
	} catch (err) {
		console.error(`[kreia:${label}] uncaught`, err);
		const msg = err instanceof Error ? err.message : "";
		if (/json|parse|illisible/i.test(msg)) return fail(INVALID_AI_MESSAGE);
		if (/abort|timeout|timed out/i.test(msg)) return fail("L'analyse a dépassé le délai imparti. Réessayez avec une vidéo plus courte.");
		return fail(msg.trim() || NETWORK_MESSAGE);
	}
}
async function timedFetch(url, init, timeoutMs) {
	const controller = new AbortController();
	const timer = setTimeout(() => controller.abort(), timeoutMs);
	try {
		const parent = init.signal;
		if (parent) {
			if (parent.aborted) controller.abort();
			else parent.addEventListener("abort", () => controller.abort(), { once: true });
		}
		const res = await fetch(url, {
			...init,
			signal: controller.signal
		});
		if (!res) throw new Error("Aucune réponse reçue du serveur.");
		return res;
	} finally {
		clearTimeout(timer);
	}
}
async function chat(args) {
	const key = apiKey();
	if (!key) return fail("Les fonctions d'analyse IA ne sont pas disponibles dans cet environnement.");
	let res;
	try {
		res = await timedFetch("https://api.x.ai/v1/chat/completions", {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
				Authorization: `Bearer ${key}`
			},
			body: JSON.stringify({
				model: MODEL,
				messages: args.messages,
				temperature: .35,
				max_tokens: args.maxTokens,
				response_format: { type: "json_object" }
			})
		}, FETCH_TIMEOUT_MS);
	} catch (err) {
		const aborted = err instanceof Error && err.name === "AbortError";
		console.error("[kreia:chat] fetch failed", err);
		return fail(aborted ? "L'analyse a dépassé le délai imparti. Réessayez avec une vidéo plus courte." : NETWORK_MESSAGE);
	}
	if (!res.ok) {
		const body = await res.text().catch(() => "");
		console.error("[kreia:chat] http", res.status, body.slice(0, 300));
		return fail(`Erreur du modèle (${res.status}). ${body.slice(0, 220)}`);
	}
	let json;
	try {
		json = await res.json();
	} catch (err) {
		console.error("[kreia:chat] invalid json", err);
		return fail(INVALID_AI_MESSAGE);
	}
	const text = json.choices?.[0]?.message?.content ?? "";
	if (!text.trim()) {
		console.error("[kreia:chat] empty model content", json);
		return fail(INVALID_AI_MESSAGE);
	}
	return {
		ok: true,
		text
	};
}
async function transcribeWav(audioWavBase64) {
	const key = apiKey();
	if (!key) return {
		text: null,
		note: "Transcription indisponible."
	};
	const bytes = Buffer.from(audioWavBase64, "base64");
	if (bytes.length < 2048) return {
		text: null,
		note: "Piste audio trop courte pour être transcrite."
	};
	const form = new FormData();
	form.append("file", new Blob([new Uint8Array(bytes)], { type: "audio/wav" }), "clip.wav");
	form.append("model", "grok-stt");
	for (const attempt of [{ url: "https://api.x.ai/v1/audio/transcriptions" }, { url: "https://api.x.ai/v1/stt" }]) try {
		const res = await timedFetch(attempt.url, {
			method: "POST",
			headers: { Authorization: `Bearer ${key}` },
			body: form
		}, 45e3);
		if (!res.ok) continue;
		const json = await res.json();
		const text = (json.text ?? json.transcript ?? "").trim();
		if (text) return {
			text,
			note: "Transcription obtenue."
		};
	} catch {
		continue;
	}
	return {
		text: null,
		note: "La piste audio n'a pas pu être transcrite. L'analyse se base sur les images."
	};
}
function clampFrames(frames) {
	return frames.filter((f) => typeof f.dataUrl === "string" && f.dataUrl.startsWith("data:image/")).slice(0, MAX_FRAMES).map((f) => {
		if (f.dataUrl.length > MAX_FRAME_CHARS) {
			console.warn("[kreia:analyze] dropping oversized frame", f.t, f.dataUrl.length);
			return null;
		}
		return {
			t: f.t,
			dataUrl: f.dataUrl
		};
	}).filter((f) => Boolean(f));
}
function isTikTokHost(host) {
	return host === "tiktok.com" || host.endsWith(".tiktok.com") || host === "vm.tiktok.com" || host === "vt.tiktok.com";
}
async function probeRemoteVideo(url) {
	const headers = { "User-Agent": "KREIA-Studio/1.0" };
	let res;
	try {
		res = await timedFetch(url, {
			method: "HEAD",
			redirect: "follow",
			headers
		}, 8e3);
	} catch (err) {
		console.warn("[kreia:probe] HEAD failed, trying GET", err);
	}
	if (!res || !res.ok || !(res.headers.get("content-type") ?? "").length) try {
		res = await timedFetch(url, {
			method: "GET",
			redirect: "follow",
			headers: {
				...headers,
				Range: "bytes=0-1"
			}
		}, 8e3);
	} catch (err) {
		console.error("[kreia:probe] GET failed", err);
		return {
			ok: false,
			code: "unreachable",
			message: IMPORT_VIDEO_MESSAGE
		};
	}
	if (!res) {
		console.error("[kreia:probe] empty fetch response");
		return {
			ok: false,
			code: "unreachable",
			message: IMPORT_VIDEO_MESSAGE
		};
	}
	const type = res.headers.get("content-type") ?? "";
	if (!res.ok) return {
		ok: false,
		code: "unreachable",
		message: "Cette ressource n'est pas accessible. Importez le fichier vidéo depuis votre appareil."
	};
	if (!type.includes("video") && !type.includes("mp4") && !type.includes("webm")) return {
		ok: false,
		code: "not-video",
		message: "Cette URL ne pointe pas vers un fichier vidéo accessible. Veuillez importer la vidéo."
	};
	return {
		ok: true,
		contentType: type,
		message: "Fichier vidéo détecté. Tentative de lecture dans le navigateur."
	};
}
var checkAiAvailable_createServerFn_handler = createServerRpc({
	id: "68e121ddd88b9bb75a31f03876ea2201702cd0929c1824b2eea072181dc5409e",
	name: "checkAiAvailable",
	filename: "src/lib/kreia/ai.ts"
}, (opts) => checkAiAvailable.__executeServer(opts));
var checkAiAvailable = createServerFn({ method: "GET" }).handler(checkAiAvailable_createServerFn_handler, async () => {
	return { available: Boolean(apiKey()) };
});
var probeVideoUrl_createServerFn_handler = createServerRpc({
	id: "2c9e0efd825c3cfc42bb33ba0a2c2c38d16b972cd2738d6bcd5a9f235f1794fa",
	name: "probeVideoUrl",
	filename: "src/lib/kreia/ai.ts"
}, (opts) => probeVideoUrl.__executeServer(opts));
var probeVideoUrl = createServerFn({ method: "POST" }).validator((input) => input).handler(probeVideoUrl_createServerFn_handler, async ({ data }) => {
	return withOk("probe", async () => {
		const raw = (data?.url ?? "").trim();
		let parsed;
		try {
			parsed = new URL(raw);
		} catch {
			return {
				ok: false,
				error: "Ce lien n'est pas une URL valide.",
				message: "Ce lien n'est pas une URL valide.",
				code: "invalid"
			};
		}
		if (!/^https?:$/.test(parsed.protocol)) return {
			ok: false,
			error: "Seuls les liens http(s) sont acceptés.",
			message: "Seuls les liens http(s) sont acceptés.",
			code: "invalid"
		};
		const host = parsed.hostname.replace(/^www\./, "");
		if (isTikTokHost(host)) {
			console.info("[kreia:probe] tiktok blocked", host);
			return {
				ok: false,
				error: IMPORT_VIDEO_MESSAGE,
				message: IMPORT_VIDEO_MESSAGE,
				code: "tiktok"
			};
		}
		const probed = await probeRemoteVideo(parsed.toString());
		if (!probed.ok) return {
			ok: false,
			error: probed.message,
			message: probed.message,
			code: probed.code
		};
		return {
			ok: true,
			contentType: probed.contentType,
			message: probed.message
		};
	});
});
var analyzeVideo_createServerFn_handler = createServerRpc({
	id: "d7a2a55277debbccd2a6e433903c8474f5ab433e414f59cdc62f39185b188c7a",
	name: "analyzeVideo",
	filename: "src/lib/kreia/ai.ts"
}, (opts) => analyzeVideo.__executeServer(opts));
var analyzeVideo = createServerFn({ method: "POST" }).validator((input) => input).handler(analyzeVideo_createServerFn_handler, async ({ data }) => {
	return withOk("analyze", async () => {
		if (!data) {
			console.error("[kreia:analyze] missing payload");
			return fail("Aucune vidéo sélectionnée. Veuillez importer une vidéo avant de lancer l'analyse.");
		}
		const frames = clampFrames(data.frames ?? []);
		console.info("[kreia:analyze] start", {
			kind: data.kind,
			duration: data.durationSeconds,
			frames: frames.length,
			hasAudio: Boolean(data.audioWavBase64)
		});
		if (frames.length < 2) return fail("Pas assez d'images extraites de la vidéo. Vérifiez que le fichier n'est pas corrompu.");
		let transcript = null;
		let transcriptNote = "Aucune piste audio extraite.";
		if (data.audioWavBase64) {
			if (data.audioWavBase64.length > MAX_AUDIO_CHARS) {
				console.warn("[kreia:analyze] audio payload too large, skipping STT");
				transcriptNote = "Piste audio trop volumineuse pour être transmise. L'analyse se base sur les images.";
			} else {
				const tr = await transcribeWav(data.audioWavBase64);
				transcript = tr.text;
				transcriptNote = tr.note;
			}
		}
		const userContent = [{
			type: "text",
			text: buildAnalysisUserPrompt({
				durationSeconds: data.durationSeconds,
				width: data.width,
				height: data.height,
				frameTimes: frames.map((f) => f.t),
				transcript,
				userNotes: data.userNotes,
				kind: data.kind
			})
		}];
		for (let i = 0; i < frames.length; i += 1) {
			const frame = frames[i];
			userContent.push({
				type: "image_url",
				image_url: {
					url: frame.dataUrl,
					detail: i < 2 ? "high" : "low"
				}
			});
		}
		const result = await chat({
			messages: [{
				role: "system",
				content: buildAnalysisSystemPrompt(data.kind)
			}, {
				role: "user",
				content: userContent
			}],
			maxTokens: 8192
		});
		if (!result || typeof result.ok !== "boolean") {
			console.error("[kreia:analyze] chat returned empty", result);
			return fail(NETWORK_MESSAGE);
		}
		if (!result.ok) return fail(result.error);
		try {
			const parsed = extractJson(result.text);
			if (!parsed || typeof parsed !== "object") {
				console.error("[kreia:analyze] model json is not an object");
				return fail(INVALID_AI_MESSAGE);
			}
			const analysis = parseAnalysis(parsed);
			if (!analysis.audio.notes) analysis.audio.notes = transcriptNote;
			if (transcript && !analysis.audio.transcriptExcerpt) {
				analysis.audio.transcriptExcerpt = transcript.slice(0, 4e3);
				analysis.audio.source = "transcript";
			}
			if (!analysis.observedSummary) return fail("L'analyse n'a pas pu identifier le contenu de la vidéo. Aucune invention n'a été produite.");
			return {
				ok: true,
				analysis
			};
		} catch (err) {
			const repair = await chat({
				messages: [{
					role: "system",
					content: "Répare ce JSON d'analyse KREIA. Renvoie uniquement un objet JSON valide, même schéma, sans markdown."
				}, {
					role: "user",
					content: result.text.slice(0, 24e3)
				}],
				maxTokens: 8192
			});
			if (!repair || !repair.ok) return fail(`Analyse illisible. ${err instanceof Error ? err.message : ""}`.trim());
			try {
				return {
					ok: true,
					analysis: parseAnalysis(extractJson(repair.text))
				};
			} catch {
				return fail("L'analyse n'a pas pu être reconstruite de façon fiable. Réessayez ou importez une autre vidéo.");
			}
		}
	});
});
var reviseAnalysis_createServerFn_handler = createServerRpc({
	id: "d692495fddea21eccdb7e7ba7b37d5471320af0bc9a833e48f3a9cbc3c883458",
	name: "reviseAnalysis",
	filename: "src/lib/kreia/ai.ts"
}, (opts) => reviseAnalysis.__executeServer(opts));
var reviseAnalysis = createServerFn({ method: "POST" }).validator((input) => input).handler(reviseAnalysis_createServerFn_handler, async ({ data }) => {
	return withOk("revise-analysis", async () => {
		const result = await chat({
			messages: [{
				role: "system",
				content: buildAnalysisSystemPrompt(data.kind)
			}, {
				role: "user",
				content: buildReviseAnalysisPrompt(data.analysis, data.instruction)
			}],
			maxTokens: 8192
		});
		if (!result || !result.ok) return fail(result?.error || NETWORK_MESSAGE);
		try {
			return {
				ok: true,
				analysis: parseAnalysis(extractJson(result.text))
			};
		} catch {
			return fail("La correction n'a pas pu être appliquée de façon fiable.");
		}
	});
});
var generateProduction_createServerFn_handler = createServerRpc({
	id: "2742d6b640efda8a639b4709a114d1e91b44445a48de2dee31b1e13947999e80",
	name: "generateProduction",
	filename: "src/lib/kreia/ai.ts"
}, (opts) => generateProduction.__executeServer(opts));
var generateProduction = createServerFn({ method: "POST" }).validator((input) => input).handler(generateProduction_createServerFn_handler, async ({ data }) => {
	return withOk("generate", async () => {
		const result = await chat({
			messages: [{
				role: "system",
				content: buildGenerationSystemPrompt(data.kind)
			}, {
				role: "user",
				content: buildGenerationUserPrompt(data)
			}],
			maxTokens: 8192
		});
		if (!result || !result.ok) return fail(result?.error || NETWORK_MESSAGE);
		try {
			const production = parseProduction(extractJson(result.text));
			if (!production.visualStyle.lockedPhrase) production.visualStyle.lockedPhrase = data.analysis.visualStyle.lockedStylePhrase;
			return {
				ok: true,
				production
			};
		} catch {
			return fail("Le plan de production n'a pas pu être lu. Réessayez.");
		}
	});
});
var reviseProduction_createServerFn_handler = createServerRpc({
	id: "d3cda9f74722bfabb87c80a99410b35e7e3b7a36d4dee4e8a9908d3d431de242",
	name: "reviseProduction",
	filename: "src/lib/kreia/ai.ts"
}, (opts) => reviseProduction.__executeServer(opts));
var reviseProduction = createServerFn({ method: "POST" }).validator((input) => input).handler(reviseProduction_createServerFn_handler, async ({ data }) => {
	return withOk("revise-production", async () => {
		const result = await chat({
			messages: [{
				role: "system",
				content: buildGenerationSystemPrompt(data.kind)
			}, {
				role: "user",
				content: buildReviseProductionPrompt({
					analysis: data.analysis,
					production: data.production,
					instruction: data.instruction,
					focus: data.focus
				})
			}],
			maxTokens: 8192
		});
		if (!result || !result.ok) return fail(result?.error || NETWORK_MESSAGE);
		try {
			return {
				ok: true,
				production: parseProduction(extractJson(result.text))
			};
		} catch {
			return fail("La modification n'a pas pu être appliquée de façon fiable.");
		}
	});
});
//#endregion
export { analyzeVideo_createServerFn_handler, checkAiAvailable_createServerFn_handler, generateProduction_createServerFn_handler, probeVideoUrl_createServerFn_handler, reviseAnalysis_createServerFn_handler, reviseProduction_createServerFn_handler };
