import { t as __exportAll } from "./rolldown-runtime-D7D4PA-g.mjs";
import { i as fruitCharacterId, n as characterId, t as angelCharacterId } from "./ids-ckhly8rN.mjs";
import { S as styleWeave, _ as parseDialogueLine, b as remapIdForType, c as enforceProductionDialogues, d as formatLockedDialogue, f as identityFingerprint, h as lockCharactersSourceNames, i as attachDialogues, l as enforceProductionIdentity, n as applyLinesToScenes, o as emptyDialogueBible, p as identityParagraph, r as applyNameSubstitutionsToBible, u as fitDialoguesToScenes, v as parseSilentReaction, x as stableIdFor } from "./dialogues-KrU24qXd.mjs";
import { n as progressAt } from "./analysis-stages-BnF573uV.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/analyze-core-JthFBtKe.js
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
var ANGEL_RULES = `
UNIVERS ANGES — règles obligatoires
- Un ange est un PERSONNAGE identifiable (visage, corps, vêtements), jamais un simple effet de lumière.
- Reconstruire UNIQUEMENT ce qui est visible : ailes, nombre d'ailes, forme, couleur, texture des plumes, halo, lueur — seulement s'ils apparaissent dans la référence.
- Interdit d'inventer : ailes, halo, tunique blanche, lumière dorée, pouvoirs, attributs religieux, si absents de la vidéo.
- Les anges peuvent coexister avec des humains. IDs stables : ANGEL_CHARACTER_01… pour les anges, CHARACTER_01… pour les humains.
- Continuité : même visage, mêmes ailes (si présentes), mêmes vêtements, mêmes proportions d'une scène à l'autre.
- Ne pas transformer un ange en humain, ni un humain en ange, sauf si la source le montre.
`.trim();
function angelPromptBlock(enabled) {
	if (!enabled) return "";
	return `\n\n${ANGEL_RULES}\n`;
}
var FRUIT_HUMANOID_RULES = `
UNIVERS FRUIT HUMANOID — règles obligatoires
- Aucun humain, aucun visage humain, aucune silhouette humaine, même floue, même en arrière-plan.
- Tous les personnages sont des fruits humanoïdes (corps-fruit, membres, visage stylisé propre à l'espèce).
- L'espèce fruit de chaque Character ID est verrouillée (ex. FRUIT_CHARACTER_01 = pastèque, FRUIT_CHARACTER_02 = ananas). Ne pas changer d'espèce entre les scènes.
- Une fois un personnage identifié, le réutiliser dans tous les segments. Interdit de recréer un nouveau personnage uniquement parce que l'angle de caméra change.
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

STYLE VISUEL — PRIORITÉ
Identifie précisément le rendu (photoréaliste, semi-réaliste, 3D, 2D, animation, illustration, etc.) et le style artistique.
Produis une lockedStylePhrase courte et impérative, ex. « 3D cartoon cinématographique, éclairage studio chaud, textures satinées ».
Cette phrase deviendra une contrainte de production. Ne la dilue pas.

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
Découpe UNIQUEMENT selon un vrai changement narratif : lieu, temps, personnages présents, ou action.
Un simple changement de caméra / de plan n'est PAS une nouvelle scène.
Plusieurs plans courts de la MÊME action se regroupent en UNE scène.

BUDGET DURÉE — RÈGLE ABSOLUE
La durée source D est fournie. La somme des estimatedDuration doit rester proche de D (écart < 20 %).
Interdit : une scène toutes les 6 secondes, ou 4 prompts de 6 s pour une vidéo de 10 s.
Si D ≤ 11 s → UNE seule scène, estimatedDuration = 6, 8 ou 10 (la plus proche de D).
Si D ≤ 16 s → au plus 2 scènes.
estimatedDuration ∈ {6, 8, 10}. Jamais gonfler artificiellement.
Ne crée pas de scène que les images ne justifient pas. Si le découpage est incertain, limitations + confidence = "inferred".

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
Ne jamais fusionner deux locuteurs dans une même ligne. Ne jamais attribuer une réplique au personnage principal par défaut.
Si le locuteur n'est pas certain : attribution = "unverified", speakerId = null.
Ordre de parole = ordre source. speakerId = CHARACTER_XX du locuteur réel.

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
${fruitHumanoidPromptBlock(kind === "fruit-humanoid")}${angelPromptBlock(kind === "angel")}${anatomyPromptBlock(kind === "human")}
`.trim();
}
function buildAnalysisUserPrompt(args) {
	const times = args.frameTimes.map((t, i) => `image ${i + 1} = ${t.toFixed(2)}s`).join(", ");
	return `
MÉTA DONNÉES VIDÉO
- durée : ${args.durationSeconds.toFixed(2)} s  ← budget total des scènes
- résolution : ${args.width}×${args.height}
- type de projet : ${args.kind === "fruit-humanoid" ? "Histoire Fruit humanoïde" : args.kind === "angel" ? "Anges" : "Histoire humaine"}
- photogrammes fournis (dans l'ordre) : ${times}
- transcription audio : ${args.transcript ? "fournie ci-dessous — C'EST LA RÉFÉRENCE DES DIALOGUES, à recopier mot à mot" : "non disponible — ne pas inventer de dialogues ; sous-titres à l'écran uniquement si lisibles"}
- plafond de scènes : ${args.durationSeconds <= 11 ? "1 scène unique" : args.durationSeconds <= 16 ? "2 scènes maximum" : `environ ${Math.max(1, Math.round(args.durationSeconds / 8))} scènes, jamais plus de ${Math.max(1, Math.round(args.durationSeconds / 6))}`}
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
/** Max scenes for a source: never more than one prompt per ~6s. */
function maxSceneCount(sourceDuration) {
	if (!Number.isFinite(sourceDuration) || sourceDuration <= 0) return 1;
	if (sourceDuration <= 11) return 1;
	if (sourceDuration <= 16) return 2;
	return Math.max(1, Math.round(sourceDuration / 6));
}
function minSceneCount(sourceDuration) {
	if (!Number.isFinite(sourceDuration) || sourceDuration <= 0) return 1;
	if (sourceDuration <= 16) return 1;
	return Math.max(1, Math.round(sourceDuration / 10));
}
function chooseSceneCount(sourceDuration, proposed) {
	const min = minSceneCount(sourceDuration);
	const max = maxSceneCount(sourceDuration);
	return Math.min(max, Math.max(min, Number.isFinite(proposed) ? Math.round(proposed) : min));
}
function closestPromptDuration(seconds) {
	if (seconds <= 7) return 6;
	if (seconds <= 9) return 8;
	return 10;
}
function packDurations(sourceDuration, count) {
	const n = Math.max(1, Math.round(count));
	if (n === 1) return [closestPromptDuration(sourceDuration)];
	const share = sourceDuration / n;
	const durations = Array.from({ length: n }, () => closestPromptDuration(share));
	let sum = durations.reduce((a, b) => a + b, 0);
	let guard = 0;
	while (Math.abs(sum - sourceDuration) > 1.25 && guard < 48) {
		guard += 1;
		if (sum > sourceDuration) {
			const idx = [...durations.keys()].reverse().find((i) => durations[i] > 6);
			if (idx === void 0) break;
			const next = durations[idx] === 10 ? 8 : 6;
			sum += next - durations[idx];
			durations[idx] = next;
		} else {
			const idx = durations.findIndex((d) => d < 10);
			if (idx < 0) break;
			const next = durations[idx] === 6 ? 8 : 10;
			sum += next - durations[idx];
			durations[idx] = next;
		}
	}
	return durations;
}
function splitEven(length, buckets) {
	const n = Math.max(1, length);
	const k = Math.min(n, Math.max(1, buckets));
	const out = [];
	let cursor = 0;
	for (let i = 0; i < k; i += 1) {
		const remaining = n - cursor;
		const left = k - i;
		const size = Math.max(1, Math.round(remaining / left));
		const group = [];
		for (let j = 0; j < size && cursor < n; j += 1) {
			group.push(cursor);
			cursor += 1;
		}
		if (group.length) out.push(group);
	}
	while (cursor < n) {
		out[out.length - 1].push(cursor);
		cursor += 1;
	}
	return out;
}
function mergeText(values, sep = " Puis ") {
	const seen = /* @__PURE__ */ new Set();
	const parts = [];
	for (const raw of values) {
		const t = raw.trim();
		if (!t) continue;
		const key = t.toLowerCase();
		if (seen.has(key)) continue;
		seen.add(key);
		parts.push(t);
	}
	return parts.join(sep);
}
function joinDialogues(values) {
	const parts = [];
	const seen = /* @__PURE__ */ new Set();
	for (const raw of values) {
		const t = (raw ?? "").trim();
		if (!t) continue;
		const key = t.toLowerCase();
		if (seen.has(key)) continue;
		seen.add(key);
		parts.push(t);
	}
	return parts.length ? parts.join("\n") : null;
}
function joinSpeakers(values) {
	return mergeText(values.filter((v) => Boolean(v && v.trim())), ", ") || null;
}
function collapseAnalysisScenes(scenes, sourceDuration) {
	if (!scenes.length) return [{
		number: 1,
		estimatedDuration: closestPromptDuration(sourceDuration),
		startHint: "0s",
		characters: [],
		setting: "",
		action: "",
		emotion: "",
		camera: "",
		lighting: "",
		audio: "",
		dialogue: null,
		dialogueSpeaker: null,
		styleNotes: "",
		confidence: "inferred",
		silentReactions: []
	}];
	const count = chooseSceneCount(sourceDuration, scenes.length);
	const groups = splitEven(scenes.length, count);
	const durations = packDurations(sourceDuration, groups.length);
	return groups.map((idxs, i) => {
		const chunk = idxs.map((j) => scenes[j]);
		const first = chunk[0];
		const characters = [...new Set(chunk.flatMap((s) => s.characters))];
		return {
			...first,
			number: i + 1,
			estimatedDuration: durations[i] ?? closestPromptDuration(sourceDuration / groups.length),
			startHint: first.startHint || `${Math.round(i * sourceDuration / groups.length)}s`,
			characters,
			setting: mergeText(chunk.map((s) => s.setting), " / "),
			action: mergeText(chunk.map((s) => s.action)),
			emotion: mergeText(chunk.map((s) => s.emotion), " ; "),
			camera: first.camera,
			lighting: first.lighting,
			audio: mergeText(chunk.map((s) => s.audio), " ; "),
			dialogue: joinDialogues(chunk.map((s) => s.dialogue)),
			dialogueSpeaker: joinSpeakers(chunk.map((s) => s.dialogueSpeaker)),
			styleNotes: mergeText(chunk.map((s) => s.styleNotes), " ; "),
			confidence: chunk.every((s) => s.confidence === "observed") ? "observed" : "inferred",
			silentReactions: chunk.flatMap((s) => s.silentReactions ?? [])
		};
	});
}
function collapseProductionScenes(scenes, sourceDuration) {
	if (!scenes.length) return scenes;
	const count = chooseSceneCount(sourceDuration, scenes.length);
	const groups = splitEven(scenes.length, count);
	const durations = packDurations(sourceDuration, groups.length);
	return groups.map((idxs, i) => {
		const chunk = idxs.map((j) => scenes[j]);
		const first = chunk[0];
		return {
			...first,
			number: i + 1,
			duration: durations[i] ?? closestPromptDuration(sourceDuration / groups.length),
			characters: [...new Set(chunk.flatMap((s) => s.characters))],
			location: mergeText(chunk.map((s) => s.location), " / "),
			action: mergeText(chunk.map((s) => s.action)),
			emotion: mergeText(chunk.map((s) => s.emotion), " ; "),
			audio: mergeText(chunk.map((s) => s.audio), " ; "),
			dialogue: joinDialogues(chunk.map((s) => s.dialogue)),
			continuityNotes: i === 0 ? first.continuityNotes : `Suite de la scène ${String(i).padStart(2, "0")}. ${first.continuityNotes}`.trim()
		};
	});
}
function proposeSegments(duration, frameTimes) {
	const times = [...frameTimes].filter((t) => Number.isFinite(t)).sort((a, b) => a - b);
	const count = chooseSceneCount(duration, Math.max(1, Math.round(duration / 8)));
	if (count <= 1) return [{
		index: 0,
		start: 0,
		end: duration,
		frameTimes: times
	}];
	const slice = duration / count;
	const segs = [];
	for (let i = 0; i < count; i += 1) {
		const start = i * slice;
		const end = i === count - 1 ? duration : (i + 1) * slice;
		let owned = times.filter((t) => t >= start && (i === count - 1 ? t <= end : t < end));
		if (!owned.length && times.length) {
			const mid = (start + end) / 2;
			owned = [times.reduce((a, b) => Math.abs(b - mid) < Math.abs(a - mid) ? b : a)];
		}
		segs.push({
			index: i,
			start,
			end,
			frameTimes: owned
		});
	}
	return segs;
}
function characterLockLine(c) {
	return identityParagraph(c);
}
function buildContinuityBible(analysis) {
	const style = styleWeave(analysis.visualStyle);
	const characters = analysis.characters.map((c) => `- ${characterLockLine(c)}`).join("\n");
	return `
BIBLE DE CONTINUITÉ — identités verrouillées
Le style (${style || "fidèle aux images source"}) doit être TISSÉ dans chaque prompt, jamais recopié comme un bloc séparé.

PERSONNAGES VERROUILLÉS — réutiliser tel quel, ne pas redessiner
${characters || "- aucun personnage identifié"}

RÈGLES
- Réutiliser les Character ID. Ne jamais renommer un ID.
- Un fruit, un ange ou un inconnu est un personnage. unknown_character n'est pas une erreur.
- Ne pas modifier visage, espèce fruit, ailes observées, morphologie, coiffure, yeux, vêtements sans raison narrative explicite.
- Ne pas inventer d'ailes, de halo ou d'espèce absents de la fiche.
- Une scène suivante n'est pas une autre histoire : même univers, mêmes identités.
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
Reproduis FIDÈLEMENT l'histoire, le thème, les événements, l'ordre narratif et les DIALOGUES SOURCE.
Les dialogues verrouillés sont la référence. Recopie-les MOT À MOT dans scene.dialogue et dans videoPrompt.
Interdit : paraphraser, résumer, inventer, adoucir, embellir, changer l'ordre des locuteurs.
Seul un prénom modifié par l'utilisateur peut être substitué (Marie → Sarah), sans réécrire le reste de la phrase.
Si aucun dialogue n'a été observé, dialogue = null partout. Ne pas en inventer.
`.trim();
	if (mode === "adaptation") return `
MODE : ADAPTATION
Conserve la mécanique narrative (hook, conflit, rythme, structure) et le style visuel verrouillé.
Tu peux adapter le lieu ou la situation. PAS les paroles.
Les DIALOGUES SOURCE restent verrouillés mot à mot. Seul le prénom peut changer.
Si l'analyse n'a pas de dialogue, dialogue = null partout — n'en invente pas.
`.trim();
	return `
MODE : INSPIRATION ORIGINALE
Conserve : type de hook, rythme, structure, style audiovisuel.
Crée une histoire NOUVELLE, clairement distincte.
N'utilise PAS les dialogues source comme répliques du nouveau récit, et ne les présente pas comme paroles de la source.
`.trim();
}
function buildGenerationSystemPrompt(kind) {
	return `
Tu es le directeur de production de KREIA Studio.
À partir d'une ANALYSE validée, tu génères un PLAN DE PRODUCTION exploitable (hooks, bible personnages, prompts image, découpage, prompts vidéo).

Tu n'écris pas un résumé. Tu prends des décisions créatives cohérentes à partir de ce qui a été établi, sans trahir le style visuel.

RÈGLES
- lockedStylePhrase et le rendu (textures, matériaux, réalisme) sont TISSÉS dans chaque imagePrompt et videoPrompt — jamais un bloc « STYLE VISUEL » séparé à copier.
- Character ID stables. Chaque prompt décrit le personnage COMPLET (type, visage, corps, vêtements, ailes/espèce si observés) + le style, pas seulement l'ID.
- Ne jamais transformer un fruit en autre fruit, un ange en humain, ni ajouter/retirer des ailes absentes de la fiche.
- Durée de chaque prompt vidéo : 6, 8 ou 10 secondes — choisir la plus juste pour l'action, jamais gonfler artificiellement.
- La SOMME des durées de scènes doit rester proche de la durée source. Interdit de transformer 10 s de source en 24 s de prompts.
- Le hook n'ajoute PAS de durée : c'est le début de la scène 1, pas une scène supplémentaire.
- Continuité : vêtements, lumière, décor, époque, météo. Une scène est la suite de la précédente.
- Ne pas changer de style (pas de photoréaliste si la source est 3D cartoon, etc.).
- Prompts professionnels, en anglais pour les champs imagePrompt et videoPrompt (meilleure compatibilité des moteurs), reste du plan en français.
- videoPrompt : un bloc continu, précis, prêt à coller (sujet, action, caméra, lumière, style, audio, contraintes).
- Si un dialogue est verrouillé pour la scène, le videoPrompt DOIT contenir la réplique EXACTE (mots source) ET son interprétation observée (émotion, expression, geste, regard, ton, larmes). Interdit de paraphraser ou d'adoucir.
- Si des larmes / un cri / un tremblement / un geste important sont dans l'analyse, les reproduire. Ne pas inventer de gestes absents.
- imagePrompt : portrait de référence, cadrage plan américain ou portrait, fond simple cohérent avec l'univers, éclairage adapté.
${fruitHumanoidPromptBlock(kind === "fruit-humanoid")}
${angelPromptBlock(kind === "angel")}
${anatomyPromptBlock(kind === "human")}

SORTIE : JSON unique, pas de markdown.
`.trim();
}
function buildGenerationUserPrompt(input) {
	const { analysis, mode, durationSeconds, userNotes } = input;
	const bible = buildContinuityBible(analysis);
	const anatomy = anatomyNegativeClause(input.kind === "human");
	const characterIndex = analysis.characters.map((c) => `${identityParagraph(c)} | empreinte : ${c.identityFingerprint || "—"}`).join("\n");
	const sceneIndex = analysis.scenes.map((s) => {
		const who = expandCharacterIds(s.characters, analysis.characters);
		const locked = formatLockedDialogue((analysis.dialogues?.lines ?? []).filter((l) => l.sceneNumber === s.number));
		return `Scène ${String(s.number).padStart(2, "0")} (~${s.estimatedDuration}s) | ${s.setting} | ${s.action} | caméra: ${s.camera} | persos:\n${who}\nDIALOGUE VERROUILLÉ : ${locked ?? "aucun — ne pas inventer"}`;
	}).join("\n\n");
	const lockedBlock = (analysis.dialogues?.lines ?? []).sort((a, b) => a.order - b.order).map((l) => `${l.id} | SCÈNE ${String(l.sceneNumber).padStart(2, "0")} | ordre ${l.order} | ${l.speakerId || "LOCUTEUR?"} ${l.speakerLabel || ""} | ${l.attribution} | « ${l.displayText || l.sourceText} » | émotion: ${l.performance?.emotionDominant || l.emotion || "?"} | ton: ${l.performance?.tone || "?"} | visage: ${l.performance?.facialExpression || "?"} | geste: ${l.performance?.gesture || "aucun"} | larmes: ${l.performance?.tears || "aucune"}`).join("\n");
	return `
${modeInstructions(mode)}

DURÉE SOURCE : ${durationSeconds.toFixed(1)} s
BUDGET : la somme des duration de "scenes" ≈ ${durationSeconds.toFixed(1)} s (jamais le double).
Si la source ≤ 11 s : UNE seule scène (duration 6, 8 ou 10, la plus proche).
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

DIALOGUES SOURCE VERROUILLÉS — À REPRENDRE MOT À MOT
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
      "bible": "string FR — fiche d'identité complète (type, visage, corps, vêtements, éléments observés)",
      "imagePrompt": "string EN — UN SEUL paragraphe autonome : style de la source TISSÉ dans la description + identité verrouillée. Pas de ligne STYLE: à part."
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
      "videoPrompt": "string EN — prompt vidéo professionnel complet",
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
function buildReviseAnalysisPrompt(analysis, instruction) {
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
function buildReviseProductionPrompt(args) {
	return `
Tu modifies un plan de production KREIA.
${args.focus ? `Cible : section=${args.focus.section}${args.focus.characterId ? ` character=${args.focus.characterId}` : ""}${typeof args.focus.sceneNumber === "number" ? ` scène=${args.focus.sceneNumber}` : ""}` : "Cible : ajustement local, pas de refonte globale."}
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
var MODEL = "grok-4.5";
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
	const jsonMode = args.jsonMode !== false;
	const timeoutMs = args.timeoutMs ?? 9e4;
	const hasImages = args.messages.some((m) => Array.isArray(m.content) && m.content.some((p) => p.type === "image_url"));
	const attempt = async (useJsonMode) => {
		const body = {
			model: MODEL,
			messages: args.messages,
			temperature: .35,
			max_tokens: args.maxTokens
		};
		if (useJsonMode) body.response_format = { type: "json_object" };
		return await timedFetch("https://api.x.ai/v1/chat/completions", {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
				Authorization: `Bearer ${key}`
			},
			body: JSON.stringify(body)
		}, hasImages ? Math.max(timeoutMs, 12e4) : timeoutMs);
	};
	let res;
	try {
		res = await attempt(jsonMode);
	} catch (err) {
		const aborted = err instanceof Error && err.name === "AbortError";
		console.error("[kreia:chat] fetch failed", err);
		return fail(aborted ? "L'analyse a dépassé le délai imparti. Réessayez avec une vidéo plus courte." : NETWORK_MESSAGE);
	}
	if (!res) {
		console.error("[kreia:chat] empty fetch response");
		return fail(NETWORK_MESSAGE);
	}
	if (!res.ok) {
		const body = await res.text().catch(() => "");
		console.error("[kreia:chat] http", res.status, body.slice(0, 400));
		const lower = body.toLowerCase();
		if (jsonMode && (res.status === 400 || lower.includes("response_format"))) try {
			res = await attempt(false);
		} catch (err) {
			console.error("[kreia:chat] retry without json_object failed", err);
			return fail(`Erreur du modèle (${res.status}). ${body.slice(0, 180)}`);
		}
		if (!res || !res.ok) return fail(`Erreur du modèle (${res?.status ?? 0}). ${body.slice(0, 180)}`);
	}
	let json;
	try {
		json = await res.json();
	} catch (err) {
		console.error("[kreia:chat] invalid json", err);
		return fail(INVALID_AI_MESSAGE);
	}
	const text = contentFromCompletion(json);
	if (!text.trim()) {
		const keys = json && typeof json === "object" ? Object.keys(json).join(",") : typeof json;
		console.error("[kreia:chat] empty model content", {
			keys,
			preview: JSON.stringify(json).slice(0, 280)
		});
		return fail(INVALID_AI_MESSAGE);
	}
	return {
		ok: true,
		text
	};
}
function contentFromCompletion(json) {
	if (!json) return "";
	if (typeof json === "string") return json;
	if (typeof json !== "object") return "";
	const rec = json;
	const fromMessage = (msg) => {
		if (!msg) return "";
		if (typeof msg === "string") return msg;
		if (typeof msg !== "object") return "";
		const m = msg;
		if (typeof m.content === "string") return m.content;
		if (Array.isArray(m.content)) return m.content.map((part) => {
			if (typeof part === "string") return part;
			if (part && typeof part === "object" && "text" in part) return String(part.text ?? "");
			return "";
		}).join("");
		if (typeof m.text === "string") return m.text;
		return "";
	};
	const choices = Array.isArray(rec.choices) ? rec.choices : [];
	for (const choice of choices) {
		if (!choice || typeof choice !== "object") continue;
		const c = choice;
		const text = fromMessage(c.message) || fromMessage(c.delta) || (typeof c.text === "string" ? c.text : "");
		if (text.trim()) return text;
	}
	if (typeof rec.output === "string") return rec.output;
	if (typeof rec.content === "string") return rec.content;
	if (typeof rec.text === "string") return rec.text;
	return fromMessage(rec.message);
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
	for (const url of ["https://api.x.ai/v1/audio/transcriptions", "https://api.x.ai/v1/stt"]) try {
		const res = await timedFetch(url, {
			method: "POST",
			headers: { Authorization: `Bearer ${key}` },
			body: form
		}, 2e4);
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
async function timedFetchPublic(url, init, timeoutMs) {
	return timedFetch(url, init, timeoutMs);
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
	return JSON.parse(coerceJsonText(text));
}
function tryExtractJson(text) {
	try {
		return extractJson(text);
	} catch (err) {
		console.error("[kreia:parse] extractJson failed", err instanceof Error ? err.message : err);
		return null;
	}
}
function coerceJsonText(text) {
	const trimmed = (text ?? "").trim();
	if (!trimmed) throw new Error("La réponse du modèle est vide.");
	const fence = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/);
	const raw = fence ? fence[1].trim() : trimmed;
	const obj = raw.indexOf("{");
	const arr = raw.indexOf("[");
	if (arr !== -1 && (obj === -1 || arr < obj)) return closeTruncatedJson(raw.slice(arr));
	if (obj === -1) throw new Error("La réponse du modèle n'est pas un JSON exploitable.");
	const slice = raw.slice(obj);
	const end = slice.lastIndexOf("}");
	if (end > 0) {
		const candidate = slice.slice(0, end + 1);
		try {
			JSON.parse(candidate);
			return candidate;
		} catch {}
	}
	return closeTruncatedJson(slice);
}
function closeTruncatedJson(source) {
	let inString = false;
	let escape = false;
	const stack = [];
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
			if (ch === "\"") inString = false;
			continue;
		}
		if (ch === "\"") {
			inString = true;
			continue;
		}
		if (ch === "{") stack.push("}");
		else if (ch === "[") stack.push("]");
		else if (ch === "}" || ch === "]") stack.pop();
	}
	if (inString) out += "\"";
	out = out.replace(/,\s*$/, "");
	while (stack.length) out += stack.pop();
	JSON.parse(out);
	return out;
}
function characterTypeOf(v, fallback = "unknown_character") {
	if (v === "animal_character") return "animal_humanoid";
	if (v === "unknown") return "unknown_character";
	if (v === "human" || v === "fruit_humanoid" || v === "angel" || v === "animated_character" || v === "animal_humanoid" || v === "fantasy_character" || v === "unknown_character") return v;
	return fallback;
}
function fallbackIdFor(type, index) {
	if (type === "fruit_humanoid") return fruitCharacterId(index + 1);
	if (type === "angel") return angelCharacterId(index + 1);
	return characterId(index + 1);
}
function parseCharacter(raw, index, kind) {
	const o = isRecord(raw) ? raw : {};
	const inferredType = kind === "fruit-humanoid" && !o.characterType ? "fruit_humanoid" : characterTypeOf(o.characterType);
	const fallbackId = fallbackIdFor(inferredType, index);
	return {
		id: str(o.id, fallbackId).toUpperCase().replace(/\s+/g, "_").replace(/[^A-Z0-9_]/g, "").slice(0, 48) || fallbackId,
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
		dialogueColor: strOrNull(o.dialogueColor) ?? void 0
	};
}
function characterListFrom(parsed) {
	if (Array.isArray(parsed)) return parsed;
	if (!isRecord(parsed)) return [];
	const nested = [
		parsed.characters,
		parsed.cast,
		parsed.personnages,
		parsed.people
	];
	for (const item of nested) if (Array.isArray(item)) return item;
	if (isRecord(parsed.data)) return characterListFrom(parsed.data);
	if (isRecord(parsed.result)) return characterListFrom(parsed.result);
	if (isRecord(parsed.analysis)) return characterListFrom(parsed.analysis);
	if (parsed.designation || parsed.characterType || parsed.id) return [parsed];
	return [];
}
function parseCastResult(text, kind) {
	const parsed = tryExtractJson(text);
	if (parsed == null) {
		console.error("[CHARACTER PIPELINE ERROR] parse: no json", {
			type: typeof text,
			preview: String(text ?? "").slice(0, 240)
		});
		return {
			characters: [],
			visualStyle: parseStyle({}),
			cinematic: parseCinematic({}),
			observedSummary: "",
			limitations: ["Réponse d'identification illisible — poursuite avec un résultat partiel."],
			language: null
		};
	}
	const record = isRecord(parsed) ? parsed : {};
	const list = characterListFrom(parsed);
	const characters = [];
	for (const [i, item] of list.entries()) try {
		characters.push(parseCharacter(item, i, kind));
	} catch (err) {
		console.error("[CHARACTER PIPELINE ERROR] skip character", i, err);
	}
	return {
		characters,
		visualStyle: parseStyle(record.visualStyle ?? record.style),
		cinematic: parseCinematic(record.cinematic),
		observedSummary: str(record.observedSummary ?? record.summary),
		limitations: strArr(record.limitations),
		language: strOrNull(record.language)
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
		silentReactions: Array.isArray(o.silentReactions) ? o.silentReactions.map(parseSilentReaction).filter((x) => Boolean(x)) : []
	};
}
function parseAudio(raw) {
	const o = isRecord(raw) ? raw : {};
	const source = o.source === "transcript" || o.source === "subtitles" || o.source === "visual-inference" || o.source === "unavailable" ? o.source : "unavailable";
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
function parseDialogues(raw) {
	const o = isRecord(raw) ? raw : {};
	const source = o.source === "transcript" || o.source === "subtitles" || o.source === "visual-inference" || o.source === "unavailable" ? o.source : "unavailable";
	const lines = Array.isArray(o.lines) ? o.lines.map((line, i) => parseDialogueLine(line, i)) : [];
	return {
		language: strOrNull(o.language),
		source,
		rawTranscript: strOrNull(o.rawTranscript),
		lines
	};
}
function parseAnalysis(raw) {
	const o = isRecord(raw) ? raw : {};
	const characters = Array.isArray(o.characters) ? o.characters.flatMap((c, i) => {
		try {
			return [parseCharacter(c, i)];
		} catch {
			return [];
		}
	}) : [];
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
		audio: parseAudio(o.audio),
		dialogues: o.dialogues ? parseDialogues(o.dialogues) : emptyDialogueBible()
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
var CAST_TOKENS = 3200;
function logPipe(step, msg, extra) {
	const prefix = `[CHARACTER PIPELINE] ${step}. ${msg}`;
	if (extra === void 0) console.info(prefix);
	else console.info(prefix, extra);
}
function logPipeError(step, err, extra) {
	const error = err instanceof Error ? err : new Error(String(err ?? "unknown"));
	console.error("[CHARACTER PIPELINE ERROR]", {
		exactStep: step,
		errorName: error.name,
		errorMessage: error.message,
		stack: error.stack,
		...extra
	});
}
function placeholderCharacter(kind, index) {
	const type = kind === "fruit-humanoid" ? "fruit_humanoid" : kind === "angel" ? "angel" : "unknown_character";
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
		notes: "Personnage temporaire : l'identification automatique n'a pas pu aboutir complètement."
	};
}
function imagesOf(batch) {
	return batch.filter((f) => typeof f.dataUrl === "string" && f.dataUrl.startsWith("data:image/") && f.dataUrl.length > 32).map((frame) => ({
		type: "image_url",
		image_url: {
			url: frame.dataUrl,
			detail: "low"
		}
	}));
}
function normalizeSpoken(text) {
	return text.toLowerCase().normalize("NFD").replace(/\p{M}/gu, "").replace(/[^\p{L}\p{N}\s]/gu, " ").replace(/\s+/g, " ").trim();
}
function normalizeCharacterIds(characters, kind) {
	return characters.map((c, i) => {
		let type = c.characterType || "unknown_character";
		if (kind === "fruit-humanoid" && (type === "unknown" || type === "unknown_character" || !c.characterType)) type = "fruit_humanoid";
		if (type === "unknown") type = "unknown_character";
		let id = (c.id || "").trim();
		if (!id || id === "UNKNOWN") id = stableIdFor(i, kind, type);
		id = remapIdForType(id, type, kind);
		return {
			...c,
			id,
			characterType: type,
			identityFingerprint: identityFingerprint({
				...c,
				id,
				characterType: type
			})
		};
	});
}
function mergeCharacters(current, incoming, kind) {
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
			const sameSpecies = normalizeSpoken(c.species || "") && normalizeSpoken(c.species || "") === normalizeSpoken(add.species || "");
			const sameClothes = normalizeSpoken(c.clothing || "") && normalizeSpoken(c.clothing || "") === normalizeSpoken(add.clothing || "");
			const sameEyes = normalizeSpoken(c.eyes || "") && normalizeSpoken(c.eyes || "") === normalizeSpoken(add.eyes || "");
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
			lockedTraits: [.../* @__PURE__ */ new Set([...match.lockedTraits ?? [], ...add.lockedTraits ?? []])],
			notes: match.notes || add.notes,
			species: match.species || add.species,
			bodyStructure: match.bodyStructure || add.bodyStructure,
			distinctiveFeatures: match.distinctiveFeatures || add.distinctiveFeatures,
			wings: match.wings || add.wings,
			halo: match.halo || add.halo,
			characterType: match.characterType && match.characterType !== "unknown" && match.characterType !== "unknown_character" ? match.characterType : add.characterType
		});
	}
	return normalizeCharacterIds(next, kind);
}
function pickOverview(frames) {
	const valid = frames.filter((f) => typeof f.dataUrl === "string" && f.dataUrl.startsWith("data:image/") && f.dataUrl.length > 32);
	if (valid.length <= 2) return valid;
	const times = [
		valid[0].t,
		valid[Math.floor(valid.length / 3)].t,
		valid[Math.floor(valid.length * 2 / 3)].t,
		valid.at(-1).t
	];
	const picked = [];
	for (const t of times) {
		const nearest = valid.reduce((a, b) => Math.abs(b.t - t) < Math.abs(a.t - t) ? b : a);
		if (!picked.some((p) => p.t === nearest.t)) picked.push(nearest);
	}
	return picked;
}
async function identifyCharacters(args) {
	const empty = {
		characters: [],
		observedSummary: "",
		limitations: [],
		language: null
	};
	try {
		logPipe(1, "Starting identification");
		const sourceOk = Array.isArray(args.frames);
		logPipe(2, `Video source available: ${sourceOk}`);
		logPipe(3, `Frames count: ${sourceOk ? args.frames.length : 0}`);
		const overview = pickOverview(args.frames ?? []);
		const framesValid = overview.length > 0;
		logPipe(4, `Frames valid: ${framesValid}`, {
			overview: overview.length,
			times: overview.map((f) => f.t)
		});
		if (!framesValid) {
			logPipeError("4", "No usable frames");
			return {
				...empty,
				characters: [placeholderCharacter(args.kind, 0)],
				limitations: ["Aucune image exploitable — personnage temporaire créé, l'analyse continue."]
			};
		}
		const fruit = fruitHumanoidPromptBlock(args.kind === "fruit-humanoid");
		const angel = angelPromptBlock(args.kind === "angel");
		const idScheme = args.kind === "fruit-humanoid" ? "FRUIT_CHARACTER_01…" : args.kind === "angel" ? "ANGEL_CHARACTER_01… pour les anges, CHARACTER_01… pour les humains" : "CHARACTER_01…";
		const batches = [overview.slice(0, 2)];
		if (overview.length > 2) batches.push([overview[overview.length - 1]]);
		let merged = [];
		let visualStyle;
		let cinematic;
		let observedSummary = "";
		const limitations = [];
		let language = null;
		let anyOk = false;
		let lastError = "";
		for (const [batchIndex, batch] of batches.entries()) {
			const img = imagesOf(batch);
			if (!img.length) {
				logPipeError("4b", "batch has no valid image payload", { batch: batchIndex + 1 });
				continue;
			}
			logPipe(5, "Preparing analysis request", {
				batch: batchIndex + 1,
				images: img.length
			});
			let cast;
			try {
				logPipe(6, "Request sent", { batch: batchIndex + 1 });
				cast = await chat({
					messages: [{
						role: "system",
						content: `Tu identifies les PERSONNAGES visibles — humains OU non humains — et le style visuel. Pas de découpage de scènes. ${fruit}${angel}
characterType ∈ human | fruit_humanoid | angel | animated_character | animal_humanoid | fantasy_character | unknown_character
Un fruit, un ange, un animal humanoïde = un PERSONNAGE. 0 personnage = "characters": []. unknown_character est VALIDE.
IDs : ${idScheme}. name = null si inconnu.
JSON objet : { "observedSummary":"", "limitations":[], "language": null, "characters": [], "visualStyle": { "renderType":"", "artisticStyle":"", "lockedStylePhrase":"", "confidence":"observed" }, "cinematic": { "dominantShots":[], "cameraAngles":[], "movements":[], "lightingStyle":"", "rhythm":"" } }`
					}, {
						role: "user",
						content: [{
							type: "text",
							text: `Durée ${Number(args.durationSeconds || 0).toFixed(1)} s, ${args.width || 0}×${args.height || 0}, type ${args.kind}.
Photogramme ${batch.map((f) => Number(f.t || 0).toFixed(1) + "s").join(", ")}.
Déjà vus : ${merged.length ? merged.map((c) => `${c.id} ${c.designation}`).join(" · ") : "aucun"}.
${args.userNotes ?? ""}`
						}, ...img]
					}],
					maxTokens: CAST_TOKENS
				});
			} catch (err) {
				logPipeError("6-7", err, { batch: batchIndex + 1 });
				lastError = err instanceof Error ? err.message : "appel IA interrompu";
				limitations.push(`Image ${batchIndex + 1} ignorée : ${lastError}`);
				continue;
			}
			logPipe(7, "Response received", {
				batch: batchIndex + 1,
				hasValue: Boolean(cast)
			});
			const keys = cast && typeof cast === "object" ? Object.keys(cast) : [];
			logPipe(8, "Response status", {
				ok: Boolean(cast && "ok" in cast && cast.ok),
				keys
			});
			logPipe(9, `Response content exists: ${Boolean(cast && "ok" in cast && cast.ok && typeof cast.text === "string" && cast.text.trim())}`, { chars: cast && "ok" in cast && cast.ok ? cast.text.length : 0 });
			if (!cast || !("ok" in cast) || !cast.ok) {
				lastError = cast && "error" in cast && typeof cast.error === "string" && cast.error || "réponse IA absente";
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
			logPipe(12, "Characters result created", { ids: parsed.characters.map((c) => c.id) });
			merged = mergeCharacters(merged, parsed.characters, args.kind);
			if (parsed.visualStyle?.lockedStylePhrase && !visualStyle) visualStyle = parsed.visualStyle;
			if (parsed.cinematic?.dominantShots?.length && !cinematic) cinematic = parsed.cinematic;
			if (parsed.observedSummary && !observedSummary) observedSummary = parsed.observedSummary;
			if (parsed.language && !language) language = parsed.language;
			limitations.push(...parsed.limitations ?? []);
		}
		if (!merged.length) {
			limitations.push(anyOk ? "Aucun personnage clairement identifié. L'analyse continue avec un personnage temporaire." : `Identification partielle : ${lastError || "aucune réponse exploitable"}. L'analyse continue.`);
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
			language
		};
	} catch (err) {
		logPipeError("identifyCharacters", err);
		return {
			...empty,
			characters: [placeholderCharacter(args.kind, 0)],
			limitations: [`Identification partielle (${err instanceof Error ? err.message : "erreur technique"}). L'analyse continue.`]
		};
	}
}
function logStructure(msg, extra) {
	if (extra === void 0) console.info("[STRUCTURE]", msg);
	else console.info("[STRUCTURE]", msg, extra);
}
function logStructureError(subStep, err, extra) {
	const error = err instanceof Error ? err : new Error(String(err ?? "unknown"));
	console.error("[STRUCTURE ERROR]", {
		exactSubStep: subStep,
		errorName: error.name,
		errorMessage: error.message,
		stack: error.stack,
		...extra
	});
}
function toNotes(segs) {
	return segs.map((s) => ({
		index: s.index,
		start: s.start,
		end: s.end,
		frameTimes: Array.isArray(s.frameTimes) ? s.frameTimes : []
	}));
}
function fallbackStructure(durationSeconds, frameTimes) {
	const duration = Number.isFinite(durationSeconds) && durationSeconds > 0 ? durationSeconds : 1;
	const times = (frameTimes ?? []).filter((t) => Number.isFinite(t));
	const segs = proposeSegments(duration, times);
	return {
		duration,
		segments: segs.length ? toNotes(segs) : [{
			index: 0,
			start: 0,
			end: duration,
			frameTimes: times
		}],
		structureStatus: "fallback",
		rhythm: duration <= 11 ? "plan unique" : "rythme régulier"
	};
}
function pickStructureTimes(duration, frameTimes) {
	const times = [...frameTimes].filter((t) => Number.isFinite(t)).sort((a, b) => a - b);
	if (times.length <= 3) return times;
	const marks = duration <= 12 ? [
		0,
		.5,
		1
	] : [
		0,
		.25,
		.5,
		.75,
		1
	];
	const picked = [];
	for (const m of marks) {
		const target = m * duration;
		const nearest = times.reduce((a, b) => Math.abs(b - target) < Math.abs(a - target) ? b : a);
		if (!picked.some((t) => Math.abs(t - nearest) < .2)) picked.push(nearest);
	}
	return picked;
}
function parseStructureResponse(raw, duration, frameTimes) {
	if (raw == null) return null;
	const rec = typeof raw === "object" && !Array.isArray(raw) ? raw : null;
	const list = Array.isArray(raw) ? raw : rec && Array.isArray(rec.segments) ? rec.segments : rec && Array.isArray(rec.structure) ? rec.structure : rec && rec.data && typeof rec.data === "object" && Array.isArray(rec.data.segments) ? rec.data.segments : null;
	if (!list?.length) return null;
	const segs = [];
	for (const [i, item] of list.entries()) {
		if (!item || typeof item !== "object") continue;
		const o = item;
		const start = Number(o.start ?? o.from ?? 0);
		const end = Number(o.end ?? o.to ?? duration);
		if (!Number.isFinite(start) || !Number.isFinite(end)) continue;
		const a = Math.max(0, Math.min(duration, start));
		const b = Math.max(a + .4, Math.min(duration, end));
		const owned = frameTimes.filter((t) => t >= a && t <= b);
		segs.push({
			index: i,
			start: a,
			end: b,
			frameTimes: owned.length ? owned : frameTimes.slice(0, 1)
		});
	}
	return segs.length ? segs : null;
}
async function requestStructure(duration, frameTimes) {
	const marks = pickStructureTimes(duration, frameTimes);
	logStructure("Preparing structure request", { marks });
	logStructure("Request sent");
	const result = await chat({
		messages: [{
			role: "system",
			content: "Tu décris UNIQUEMENT la structure temporelle d'une vidéo. Pas de personnages, pas d'histoire détaillée. JSON : { \"rhythm\":\"string\", \"segments\":[{ \"start\":0, \"end\":1, \"type\":\"opening|development|climax|resolution|main_sequence\" }] }. Les segments couvrent 0 → durée sans trou."
		}, {
			role: "user",
			content: `Durée réelle : ${duration.toFixed(1)} s. Instants des images-clés : ${marks.map((t) => t.toFixed(1) + "s").join(", ") || "aucun"}. Découpe structurel approximatif (début / milieu / fin).`
		}],
		maxTokens: 700,
		timeoutMs: 2e4
	});
	logStructure("Waiting for response");
	if (!result || typeof result !== "object") {
		logStructureError("response", "empty result", { responseReceived: false });
		return null;
	}
	const ok = "ok" in result && result.ok === true;
	logStructure("Response received", {
		ok,
		keys: Object.keys(result)
	});
	logStructure("Response type: " + typeof result);
	if (!ok || !("text" in result) || typeof result.text !== "string") {
		logStructureError("response", "ok" in result && !result.ok ? result.error : "no text", {
			responseReceived: true,
			responseType: typeof result
		});
		return null;
	}
	logStructure("Parsing response");
	return parseStructureResponse(tryExtractJson(result.text), duration, frameTimes);
}
async function analyzeStructure(args) {
	const duration = Number(args.durationSeconds);
	const times = Array.isArray(args.frameTimes) ? args.frameTimes.filter((t) => Number.isFinite(t)) : [];
	logStructure("Starting analysis");
	logStructure(`Video source available: ${Number.isFinite(duration) && duration > 0}`);
	logStructure(`Duration: ${Number.isFinite(duration) ? duration.toFixed(1) : "invalid"} seconds`);
	logStructure("Frames extraction started");
	const marks = pickStructureTimes(duration, times);
	logStructure(`Frames extracted: ${marks.length}`, { times: marks });
	const fallback = fallbackStructure(duration, times);
	if (!Number.isFinite(duration) || duration <= 0) {
		logStructureError("validate", "invalid duration");
		return fallback;
	}
	try {
		let segs = await requestStructure(duration, times);
		if (!segs) {
			logStructure("Retrying once");
			try {
				segs = await requestStructure(duration, times);
			} catch (err) {
				logStructureError("retry", err, {
					framesCount: marks.length,
					responseReceived: false
				});
			}
		}
		if (segs?.length) {
			logStructure("Structure validated", { count: segs.length });
			const result = {
				duration,
				segments: toNotes(segs),
				structureStatus: "complete",
				rhythm: segs.length <= 1 ? "plan unique" : `${segs.length} mouvements`
			};
			logStructure("State updated");
			logStructure("Moving to step 3");
			return result;
		}
	} catch (err) {
		logStructureError("request", err, {
			framesCount: marks.length,
			responseReceived: false
		});
	}
	logStructure("Using fallback structure", { segments: fallback.segments.length });
	logStructure("State updated");
	logStructure("Moving to step 3");
	return fallback;
}
var MAX_FRAMES = 12;
var SEGMENT_TOKENS = 1800;
var NARRATIVE_TOKENS = 3200;
var COMPACT_TOKENS = 4500;
var REPAIR_TOKENS = 2800;
function clampFrames(frames) {
	return (frames ?? []).filter((f) => typeof f?.dataUrl === "string" && f.dataUrl.startsWith("data:image/") && f.dataUrl.length > 32).slice(0, MAX_FRAMES).map((f) => ({
		t: Number.isFinite(f.t) ? f.t : 0,
		dataUrl: f.dataUrl
	}));
}
function pickFrames(frames, times, max = 3) {
	if (!times.length) return frames.slice(0, max);
	const picked = [];
	for (const t of times) {
		const nearest = frames.reduce((a, b) => Math.abs(b.t - t) < Math.abs(a.t - t) ? b : a);
		if (!picked.some((p) => p.t === nearest.t)) picked.push(nearest);
		if (picked.length >= max) break;
	}
	if (picked.length < 2 && frames.length >= 2) return [frames[0], frames[frames.length - 1]].slice(0, max);
	return picked;
}
function isLongForm(duration, frameCount) {
	return duration > 22 || frameCount > 6;
}
function images(frames) {
	return frames.map((frame) => ({
		type: "image_url",
		image_url: {
			url: frame.dataUrl,
			detail: "low"
		}
	}));
}
async function parseOrRepair(text) {
	try {
		return parseAnalysis(extractJson(text));
	} catch (err) {
		const repair = await chat({
			messages: [{
				role: "system",
				content: "Répare ce JSON d'analyse KREIA. Renvoie uniquement un objet JSON valide, même schéma, sans markdown."
			}, {
				role: "user",
				content: text.slice(0, 24e3)
			}],
			maxTokens: REPAIR_TOKENS
		});
		if (!repair.ok) throw new Error(repair.error || "L'analyse n'a pas pu être terminée. La réponse reçue est invalide. Veuillez réessayer.");
		try {
			return parseAnalysis(extractJson(repair.text));
		} catch {
			throw err instanceof Error ? err : new Error(INVALID_AI_MESSAGE);
		}
	}
}
function applyDurationFit(analysis, durationSeconds, transcript) {
	let next = {
		...analysis,
		characters: lockCharactersSourceNames(analysis.characters)
	};
	next = attachDialogues(next, transcript ?? next.dialogues?.rawTranscript ?? next.audio.transcriptExcerpt);
	const before = next.scenes.length;
	const scenes = collapseAnalysisScenes(next.scenes, durationSeconds);
	next = {
		...next,
		scenes,
		sceneCountEstimate: scenes.length
	};
	return fitDialoguesToScenes(next, before);
}
function analysisFromCheckpoint(checkpoint, data, transcript, transcriptNote) {
	const characters = checkpoint.characters ?? [];
	const scenes = (checkpoint.segments ?? []).map((s, i) => ({
		number: i + 1,
		estimatedDuration: closestPromptDuration(Math.max(.5, (s.end ?? 0) - (s.start ?? 0))),
		startHint: `${Number(s.start || 0).toFixed(1)}s`,
		characters: Array.isArray(s.characters) && s.characters.length ? s.characters : characters.map((c) => c.id),
		setting: s.setting || "",
		action: s.action || "Suite observée de la vidéo source.",
		emotion: s.emotion || "",
		camera: s.camera || "",
		lighting: s.lighting || "",
		audio: s.audio || "",
		dialogue: s.dialogue ?? null,
		dialogueSpeaker: s.speakerId ?? null,
		styleNotes: "",
		confidence: "inferred",
		silentReactions: s.silentReactions ?? []
	}));
	let analysis = parseAnalysis({
		observedSummary: checkpoint.observedSummary || "Analyse reconstruite à partir des éléments déjà extraits de la vidéo.",
		limitations: [...checkpoint.limitations ?? [], "Certaines scènes ont été reconstituées automatiquement pour ne pas interrompre l'analyse."],
		language: checkpoint.language,
		characters,
		visualStyle: checkpoint.visualStyle,
		cinematic: checkpoint.cinematic,
		scenes,
		audio: {
			transcriptExcerpt: transcript,
			notes: transcriptNote,
			source: transcript ? "transcript" : "unavailable"
		}
	});
	if (!analysis.audio.notes) analysis.audio.notes = transcriptNote;
	return applyDurationFit(analysis, data.durationSeconds, transcript);
}
async function collectTranscript(data, checkpoint) {
	if (checkpoint.transcript) return {
		text: checkpoint.transcript,
		note: checkpoint.transcriptNote ?? "Transcription reprise."
	};
	const chunks = (data.audioChunks ?? []).filter((c) => typeof c.wavBase64 === "string" && c.wavBase64.length > 2048);
	if (chunks.length) {
		const parts = [];
		for (let i = 0; i < chunks.length; i += 2) {
			const batch = chunks.slice(i, i + 2);
			const results = await Promise.all(batch.map((chunk) => transcribeWav(chunk.wavBase64)));
			batch.forEach((chunk, idx) => {
				const text = results[idx]?.text;
				if (text) parts.push(`[${chunk.t.toFixed(1)}s] ${text}`);
			});
		}
		if (parts.length) return {
			text: parts.join("\n"),
			note: "Transcription obtenue."
		};
		return {
			text: null,
			note: "La piste audio n'a pas pu être transcrite. Les sous-titres et le contexte visuel restent la seule source."
		};
	}
	if (data.audioWavBase64 && data.audioWavBase64.length > 2048 && data.audioWavBase64.length <= 28e4) {
		const tr = await transcribeWav(data.audioWavBase64);
		return {
			text: tr.text,
			note: tr.note
		};
	}
	return {
		text: null,
		note: "Aucune piste audio extraite."
	};
}
function emptyCheckpoint() {
	return {
		version: 1,
		completed: [],
		segments: [],
		analyzedSegmentCount: 0,
		incomplete: false
	};
}
function markCompleted(checkpoint, step) {
	if (!checkpoint.completed.includes(step)) checkpoint.completed = [...checkpoint.completed, step];
}
async function runCastStep(data, frames, checkpoint) {
	let cast;
	try {
		cast = await identifyCharacters({
			frames,
			kind: data.kind,
			durationSeconds: data.durationSeconds,
			width: data.width,
			height: data.height,
			userNotes: data.userNotes
		});
	} catch (err) {
		console.error("[CHARACTER PIPELINE ERROR]", err);
		cast = {
			characters: [],
			observedSummary: "",
			limitations: ["Identification partielle — l'analyse continue."],
			language: null
		};
	}
	markCompleted(checkpoint, "cast");
	checkpoint.characters = cast.characters;
	checkpoint.visualStyle = cast.visualStyle;
	checkpoint.cinematic = cast.cinematic;
	checkpoint.observedSummary = cast.observedSummary;
	checkpoint.limitations = cast.limitations;
	checkpoint.language = cast.language;
}
async function runCompactStep(data, frames, checkpoint) {
	const known = checkpoint.characters ?? [];
	const transcript = checkpoint.transcript ?? null;
	const transcriptNote = checkpoint.transcriptNote ?? "";
	const userContent = [{
		type: "text",
		text: `${buildAnalysisUserPrompt({
			durationSeconds: data.durationSeconds,
			width: data.width,
			height: data.height,
			frameTimes: frames.map((f) => f.t),
			transcript,
			userNotes: data.userNotes,
			kind: data.kind
		})}

PERSONNAGES DÉJÀ IDENTIFIÉS (réutiliser ces IDs) :
${known.length ? JSON.stringify(known) : "aucun personnage identifié — continuer sans en inventer"}`
	}, ...images(frames.slice(0, 4))];
	let result;
	try {
		result = await chat({
			messages: [{
				role: "system",
				content: buildAnalysisSystemPrompt(data.kind)
			}, {
				role: "user",
				content: userContent
			}],
			maxTokens: COMPACT_TOKENS
		});
	} catch (err) {
		result = {
			ok: false,
			error: err instanceof Error && err.message.trim() ? err.message : NETWORK_MESSAGE
		};
	}
	if (!result || !result.ok) {
		const analysis = analysisFromCheckpoint(checkpoint, data, transcript, transcriptNote);
		markCompleted(checkpoint, "segments");
		markCompleted(checkpoint, "narrative");
		checkpoint.incomplete = false;
		checkpoint.limitations = [...checkpoint.limitations ?? [], result?.error || "Analyse visuelle partielle."];
		return analysis;
	}
	try {
		const parsed = tryExtractJson(result.text);
		if (!parsed || typeof parsed !== "object") throw new Error(INVALID_AI_MESSAGE);
		let analysis = parseAnalysis(parsed);
		if (!analysis.characters.length && known.length) analysis.characters = known;
		if (checkpoint.visualStyle && !analysis.visualStyle.lockedStylePhrase) analysis.visualStyle = checkpoint.visualStyle;
		if (!analysis.audio.notes) analysis.audio.notes = transcriptNote;
		if (transcript && !analysis.audio.transcriptExcerpt) {
			analysis.audio.transcriptExcerpt = transcript.slice(0, 4e3);
			analysis.audio.source = "transcript";
		}
		if (!analysis.observedSummary) analysis.observedSummary = checkpoint.observedSummary || "Contenu observé à partir des photogrammes.";
		analysis = applyDurationFit(analysis, data.durationSeconds, transcript);
		markCompleted(checkpoint, "segments");
		markCompleted(checkpoint, "narrative");
		checkpoint.incomplete = false;
		return analysis;
	} catch {
		try {
			let analysis = await parseOrRepair(result.text);
			if (!analysis.characters.length && known.length) analysis.characters = known;
			if (!analysis.audio.notes) analysis.audio.notes = transcriptNote;
			analysis = applyDurationFit(analysis, data.durationSeconds, transcript);
			markCompleted(checkpoint, "segments");
			markCompleted(checkpoint, "narrative");
			return analysis;
		} catch {
			const analysis = analysisFromCheckpoint(checkpoint, data, transcript, transcriptNote);
			markCompleted(checkpoint, "segments");
			markCompleted(checkpoint, "narrative");
			checkpoint.incomplete = false;
			return analysis;
		}
	}
}
async function runOneSegment(data, frames, checkpoint) {
	const fruit = fruitHumanoidPromptBlock(data.kind === "fruit-humanoid");
	const angel = angelPromptBlock(data.kind === "angel");
	const segs = (checkpoint.segments ?? []).map((s) => ({
		index: s.index,
		start: s.start,
		end: s.end,
		frameTimes: s.frameTimes
	}));
	if (!segs.length) {
		const proposed = proposeSegments(data.durationSeconds, frames.map((f) => f.t));
		checkpoint.segments = proposed.map((s) => ({
			index: s.index,
			start: s.start,
			end: s.end,
			frameTimes: s.frameTimes
		}));
		segs.push(...proposed);
	}
	const notes = checkpoint.segmentNotes ?? checkpoint.segments ?? [];
	const i = Math.max(0, checkpoint.analyzedSegmentCount ?? 0);
	const seg = segs[i];
	if (!seg) {
		markCompleted(checkpoint, "segments");
		return;
	}
	const characters = checkpoint.characters ?? [];
	const picked = pickFrames(frames, seg.frameTimes, 2);
	const res = await chat({
		messages: [{
			role: "system",
			content: `Tu décris un SEGMENT déjà découpé. Réutilise les Character ID fournis. ${fruit}${angel}
JSON : { "setting":"", "action":"", "emotion":"", "camera":"", "lighting":"", "audio":"", "characters":[], "dialogue": null }`
		}, {
			role: "user",
			content: [{
				type: "text",
				text: `Segment ${i + 1}/${segs.length}, ${seg.start.toFixed(1)}s–${seg.end.toFixed(1)}s.
Personnages : ${characters.map((c) => c.id).join(", ") || "aucun"}
${data.userNotes ?? ""}`
			}, ...images(picked)]
		}],
		maxTokens: SEGMENT_TOKENS
	});
	const parsed = res.ok ? tryExtractJson(res.text) : null;
	const rec = parsed && typeof parsed === "object" ? parsed : {};
	notes[i] = {
		index: seg.index,
		start: seg.start,
		end: seg.end,
		frameTimes: seg.frameTimes,
		setting: typeof rec.setting === "string" ? rec.setting : "",
		action: typeof rec.action === "string" ? rec.action : "",
		emotion: typeof rec.emotion === "string" ? rec.emotion : "",
		camera: typeof rec.camera === "string" ? rec.camera : "",
		lighting: typeof rec.lighting === "string" ? rec.lighting : "",
		audio: typeof rec.audio === "string" ? rec.audio : "",
		characters: Array.isArray(rec.characters) ? rec.characters.map(String) : [],
		dialogue: typeof rec.dialogue === "string" ? rec.dialogue : null,
		done: true
	};
	checkpoint.segmentNotes = notes;
	checkpoint.analyzedSegmentCount = i + 1;
	checkpoint.segments = notes;
	if (checkpoint.analyzedSegmentCount >= segs.length) markCompleted(checkpoint, "segments");
}
async function runNarrativeStep(data, frames, checkpoint) {
	const transcript = checkpoint.transcript ?? null;
	const transcriptNote = checkpoint.transcriptNote ?? "";
	const characters = checkpoint.characters ?? [];
	const notes = checkpoint.segmentNotes ?? checkpoint.segments ?? [];
	const visualStyle = checkpoint.visualStyle;
	const cinematic = checkpoint.cinematic;
	const observedSummary = checkpoint.observedSummary ?? "";
	const limitations = checkpoint.limitations ?? [];
	const language = checkpoint.language ?? null;
	const scenesBlob = notes.map((n, i) => `Scène ${i + 1} (${n.start.toFixed(1)}–${n.end.toFixed(1)}s) ${n.setting ?? ""} ${n.action ?? ""} dialogue:${n.dialogue ?? "aucun"}`).join("\n");
	const narrative = await chat({
		messages: [{
			role: "system",
			content: buildAnalysisSystemPrompt(data.kind)
		}, {
			role: "user",
			content: `Assemble l'analyse JSON complète à partir des segments et personnages.
${buildAnalysisUserPrompt({
				durationSeconds: data.durationSeconds,
				width: data.width,
				height: data.height,
				frameTimes: frames.map((f) => f.t),
				transcript,
				userNotes: data.userNotes,
				kind: data.kind
			})}
PERSONNAGES : ${JSON.stringify(characters)}
SEGMENTS : ${scenesBlob}
STYLE : ${visualStyle ? JSON.stringify(visualStyle) : "fidèle aux images"}`
		}],
		maxTokens: NARRATIVE_TOKENS
	});
	try {
		const raw = narrative.ok ? tryExtractJson(narrative.text) : null;
		let analysis = raw ? parseAnalysis(raw) : parseAnalysis({});
		if (!analysis.characters.length) analysis.characters = characters;
		if (visualStyle && !analysis.visualStyle.lockedStylePhrase) analysis.visualStyle = visualStyle;
		if (cinematic && !analysis.cinematic.dominantShots.length) analysis.cinematic = cinematic;
		if (!analysis.observedSummary) analysis.observedSummary = observedSummary;
		analysis.limitations = [.../* @__PURE__ */ new Set([...analysis.limitations ?? [], ...limitations])];
		if (language) analysis.language = language;
		if (!analysis.audio.notes) analysis.audio.notes = transcriptNote;
		if (transcript && !analysis.audio.transcriptExcerpt) {
			analysis.audio.transcriptExcerpt = transcript.slice(0, 4e3);
			analysis.audio.source = "transcript";
		}
		analysis = applyDurationFit(analysis, data.durationSeconds, transcript);
		markCompleted(checkpoint, "narrative");
		checkpoint.incomplete = false;
		return analysis;
	} catch (err) {
		console.error("[PIPELINE] long-form narrative failed — synthesizing from checkpoint", err);
		const analysis = analysisFromCheckpoint(checkpoint, data, transcript, transcriptNote);
		markCompleted(checkpoint, "narrative");
		checkpoint.incomplete = false;
		return analysis;
	}
}
async function runPipelineSlice(args) {
	const data = args.data;
	const checkpoint = args.checkpoint ? {
		...emptyCheckpoint(),
		...args.checkpoint,
		incomplete: false
	} : emptyCheckpoint();
	const frames = clampFrames(data.frames ?? []);
	const longForm = isLongForm(data.durationSeconds, frames.length);
	const finish = (nextPhase, step, extra) => ({
		nextPhase,
		checkpoint,
		progress: progressAt(step, {
			compact: extra?.compact,
			segmentsDone: extra?.segmentsDone,
			segmentsTotal: extra?.segmentsTotal,
			label: extra?.label
		}),
		analysis: extra?.analysis,
		error: extra?.error,
		done: Boolean(extra?.done)
	});
	switch (args.phase) {
		case "validate":
			console.info("[VIDEO VALIDATION] Starting");
			if (!frames.length) return finish("done", 1, {
				error: "Pas assez d'images extraites de la vidéo. Vérifiez que le fichier n'est pas corrompu.",
				done: true
			});
			console.info("[VIDEO VALIDATION] Validation complete", { frames: frames.length });
			return finish("structure", 1);
		case "structure":
			console.info("[STRUCTURE] Starting analysis");
			if (!checkpoint.completed.includes("structure")) {
				try {
					const structure = await analyzeStructure({
						durationSeconds: data.durationSeconds,
						frameTimes: frames.map((f) => f.t),
						width: data.width,
						height: data.height
					});
					checkpoint.segments = structure.segments;
					if (structure.structureStatus === "fallback") checkpoint.limitations = [...checkpoint.limitations ?? [], "Structure simplifiée à partir de la durée source."];
				} catch (err) {
					console.error("[STRUCTURE ERROR]", err);
					checkpoint.segments = fallbackStructure(data.durationSeconds, frames.map((f) => f.t)).segments;
				}
				markCompleted(checkpoint, "structure");
			}
			console.info("[STRUCTURE] Moving to step 3", { segments: checkpoint.segments?.length ?? 0 });
			return finish("transcript", 2);
		case "transcript":
			try {
				const transcribed = await collectTranscript(data, checkpoint);
				checkpoint.transcript = transcribed.text;
				checkpoint.transcriptNote = transcribed.note;
			} catch (err) {
				console.error("[PIPELINE] transcript skipped", err);
				checkpoint.transcriptNote = "Transcription indisponible — l'analyse continue.";
			}
			return finish("cast", 3);
		case "cast":
			if (!checkpoint.completed.includes("cast")) await runCastStep(data, frames, checkpoint);
			return finish(longForm ? "segment" : "compact", 3, { compact: !longForm });
		case "compact": return finish("done", 7, {
			compact: true,
			analysis: await runCompactStep(data, frames, checkpoint),
			done: true
		});
		case "segment": {
			await runOneSegment(data, frames, checkpoint);
			const total = checkpoint.segments?.length ?? 1;
			const doneCount = checkpoint.analyzedSegmentCount ?? 0;
			if (checkpoint.completed.includes("segments")) return finish("narrative", 5, {
				segmentsDone: doneCount,
				segmentsTotal: total
			});
			return finish("segment", 5, {
				segmentsDone: doneCount,
				segmentsTotal: total
			});
		}
		case "narrative": return finish("done", 7, {
			analysis: await runNarrativeStep(data, frames, checkpoint),
			done: true
		});
		default: return finish("done", 7, {
			done: true,
			error: NETWORK_MESSAGE
		});
	}
}
async function runAnalysisPipeline(data, onProgress) {
	if (!data) return fail("Aucune vidéo sélectionnée. Veuillez importer une vidéo avant de lancer l'analyse.");
	let phase = "validate";
	let checkpoint = data.checkpoint ? {
		...emptyCheckpoint(),
		...data.checkpoint,
		incomplete: false
	} : emptyCheckpoint();
	const frames = clampFrames(data.frames ?? []);
	const payload = {
		...data,
		frames
	};
	while (phase !== "done") {
		const slice = await runPipelineSlice({
			data: payload,
			checkpoint,
			phase
		});
		checkpoint = slice.checkpoint;
		onProgress?.(slice.progress);
		if (slice.done && slice.analysis) return {
			ok: true,
			analysis: slice.analysis,
			checkpoint
		};
		if (slice.done && slice.error) return {
			ok: false,
			error: slice.error,
			checkpoint,
			incomplete: true
		};
		if (slice.nextPhase === phase && phase !== "segment") return fail(slice.error || "L'analyse n'a pas pu aboutir. Réessayez.");
		phase = slice.nextPhase;
	}
	return fail(NETWORK_MESSAGE);
}
var analyze_core_exports = /* @__PURE__ */ __exportAll({
	IMPORT_VIDEO_MESSAGE: () => IMPORT_VIDEO_MESSAGE,
	INVALID_AI_MESSAGE: () => INVALID_AI_MESSAGE,
	NETWORK_MESSAGE: () => NETWORK_MESSAGE,
	apiKey: () => apiKey,
	fail: () => fail,
	probeVideoUrlCore: () => probeVideoUrlCore,
	runAnalyze: () => runAnalyze,
	runGenerate: () => runGenerate,
	runReviseAnalysis: () => runReviseAnalysis,
	runReviseProduction: () => runReviseProduction
});
var IMPORT_VIDEO_MESSAGE = "Cette vidéo ne peut pas être récupérée directement depuis ce lien. Veuillez importer la vidéo.";
var GENERATE_MAX_TOKENS = 4500;
var REVISE_MAX_TOKENS = 3500;
function isTikTokHost(host) {
	return host === "tiktok.com" || host.endsWith(".tiktok.com") || host === "vm.tiktok.com" || host === "vt.tiktok.com";
}
async function probeRemoteVideo(url) {
	const headers = { "User-Agent": "KREIA-Studio/1.0" };
	let res;
	try {
		res = await timedFetchPublic(url, {
			method: "HEAD",
			redirect: "follow",
			headers
		}, 8e3);
	} catch (err) {
		console.warn("[kreia:probe] HEAD failed, trying GET", err);
	}
	if (!res || !res.ok || !(res.headers.get("content-type") ?? "").length) try {
		res = await timedFetchPublic(url, {
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
async function probeVideoUrlCore(url) {
	const raw = (url ?? "").trim();
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
}
async function runAnalyze(data, onProgress) {
	return runAnalysisPipeline(data, onProgress);
}
async function runReviseAnalysis(data) {
	const result = await chat({
		messages: [{
			role: "system",
			content: buildAnalysisSystemPrompt(data.kind)
		}, {
			role: "user",
			content: buildReviseAnalysisPrompt(data.analysis, data.instruction)
		}],
		maxTokens: REVISE_MAX_TOKENS
	});
	if (!result || !result.ok) return fail(result?.error || "L'analyse n'a pas pu aboutir. Réessayez.");
	try {
		const analysis = parseAnalysis(extractJson(result.text));
		analysis.characters = lockCharactersSourceNames(analysis.characters.map((c) => {
			const prev = data.analysis.characters.find((p) => p.id === c.id);
			return {
				...c,
				sourceName: prev?.sourceName || c.sourceName || c.name
			};
		}));
		analysis.dialogues = applyNameSubstitutionsToBible(analysis.dialogues?.lines?.length ? analysis.dialogues : data.analysis.dialogues, analysis.characters);
		if (Number.isFinite(data.durationSeconds) && data.durationSeconds > 0) {
			const before = analysis.scenes.length;
			analysis.scenes = collapseAnalysisScenes(analysis.scenes, data.durationSeconds);
			analysis.sceneCountEstimate = analysis.scenes.length;
			const fitted = fitDialoguesToScenes(analysis, before);
			analysis.dialogues = fitted.dialogues;
			analysis.scenes = fitted.scenes;
		} else analysis.scenes = applyLinesToScenes(analysis.scenes, analysis.dialogues.lines);
		return {
			ok: true,
			analysis
		};
	} catch {
		return fail("La correction n'a pas pu être appliquée de façon fiable.");
	}
}
async function runGenerate(data) {
	const result = await chat({
		messages: [{
			role: "system",
			content: buildGenerationSystemPrompt(data.kind)
		}, {
			role: "user",
			content: buildGenerationUserPrompt(data)
		}],
		maxTokens: GENERATE_MAX_TOKENS
	});
	if (!result || !result.ok) return fail(result?.error || "L'analyse n'a pas pu aboutir. Réessayez.");
	try {
		const production = parseProduction(extractJson(result.text));
		if (!production.visualStyle.lockedPhrase) production.visualStyle.lockedPhrase = data.analysis.visualStyle.lockedStylePhrase;
		production.scenes = collapseProductionScenes(production.scenes, data.durationSeconds);
		const first = production.scenes[0];
		if (first) production.hook.duration = first.duration;
		return {
			ok: true,
			production: enforceProductionIdentity(enforceProductionDialogues(production, data.analysis, data.mode, data.kind), data.analysis)
		};
	} catch {
		return fail("Le plan de production n'a pas pu être lu. Réessayez.");
	}
}
async function runReviseProduction(data) {
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
		maxTokens: REVISE_MAX_TOKENS
	});
	if (!result || !result.ok) return fail(result?.error || "L'analyse n'a pas pu aboutir. Réessayez.");
	try {
		const production = parseProduction(extractJson(result.text));
		if (Number.isFinite(data.durationSeconds) && data.durationSeconds > 0) {
			production.scenes = collapseProductionScenes(production.scenes, data.durationSeconds);
			const first = production.scenes[0];
			if (first) production.hook.duration = first.duration;
		}
		return {
			ok: true,
			production: enforceProductionIdentity(enforceProductionDialogues(production, data.analysis, data.mode, data.kind), data.analysis)
		};
	} catch {
		return fail("La modification n'a pas pu être appliquée de façon fiable.");
	}
}
//#endregion
export { runPipelineSlice as a, runReviseProduction as i, runGenerate as n, NETWORK_MESSAGE as o, runReviseAnalysis as r, analyze_core_exports as t };
