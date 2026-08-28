import { r as __exportAll } from "../_runtime.mjs";
import { t as __exportAll$1 } from "./rolldown-runtime-D7D4PA-g.mjs";
import { i as fruitCharacterId, n as characterId, t as angelCharacterId } from "./ids-ckhly8rN.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/cast-edit-B0U-aGNG.js
var cast_edit_B0U_aGNG_exports = /* @__PURE__ */ __exportAll({
	A: () => lockCharactersSourceNames,
	B: () => angelPromptBlock,
	C: () => attachDialogues,
	D: () => enforceProductionDialogues,
	E: () => emptyPerformance,
	F: () => enforceProductionIdentity,
	I: () => identityParagraph,
	L: () => labelCharacterType,
	M: () => reassignDialogueSpeaker,
	N: () => swatchForCharacter,
	O: () => fitDialoguesToScenes,
	P: () => composeCharacterImagePrompt,
	R: () => styleWeave,
	S: () => applyNameSubstitutionsToBible,
	T: () => emptyDialogueBible,
	_: () => fail,
	a: () => cast_exports,
	b: () => applyDialogueEdits,
	c: () => extractJson,
	d: () => parseProduction,
	f: () => tryExtractJson,
	g: () => chat,
	h: () => apiKey,
	i: () => reindexCharacters,
	j: () => matchCharacter,
	k: () => formatLockedDialogue,
	l: () => parseAnalysis,
	m: () => NETWORK_MESSAGE,
	n: () => duplicateWarnings,
	o: () => identifyCharacters,
	p: () => INVALID_AI_MESSAGE,
	r: () => mergeCharacterPair,
	s: () => listCastBatches,
	t: () => blankCharacter,
	u: () => parseCharacter,
	v: () => timedFetchPublic,
	w: () => dialogueCharCount,
	x: () => applyLinesToScenes,
	y: () => transcribeWav,
	z: () => fruitHumanoidPromptBlock
});
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
var TYPE_LABEL = {
	human: "humain",
	fruit_humanoid: "fruit humanoïde",
	angel: "ange",
	animated_character: "personnage animé",
	animal_humanoid: "animal humanoïde",
	fantasy_character: "personnage fantastique",
	unknown_character: "personnage",
	unknown: "personnage"
};
function labelCharacterType(type) {
	return TYPE_LABEL[type ?? "unknown"] ?? "personnage";
}
function stableIdFor(index, kind, type) {
	if (type === "fruit_humanoid" || kind === "fruit-humanoid" && (!type || type === "unknown" || type === "unknown_character")) return fruitCharacterId(index + 1);
	if (type === "angel") return angelCharacterId(index + 1);
	return characterId(index + 1);
}
function remapIdForType(id, type, kind) {
	if (!id) return stableIdFor(0, kind, type);
	if ((type === "fruit_humanoid" || kind === "fruit-humanoid") && /^CHARACTER_\d+$/.test(id)) return id.replace(/^CHARACTER_/, "FRUIT_CHARACTER_");
	if (type === "angel" && /^CHARACTER_\d+$/.test(id) && kind === "angel") return id.replace(/^CHARACTER_/, "ANGEL_CHARACTER_");
	return id;
}
function styleWeave(style) {
	if (!style) return "";
	const bits = [
		style.lockedStylePhrase,
		style.renderType,
		style.artisticStyle,
		style.textures && `textures ${style.textures}`,
		style.materials && `matériaux ${style.materials}`,
		style.detailLevel && `détail ${style.detailLevel}`,
		style.lighting && `éclairage ${style.lighting}`
	].filter(Boolean);
	return [...new Set(bits)].join(", ");
}
function identityFingerprint(c) {
	if (c.identityFingerprint?.trim()) return c.identityFingerprint.trim();
	return [
		c.characterType || "unknown",
		c.species,
		c.bodyStructure || c.morphology,
		c.complexion,
		c.eyes,
		c.hair,
		c.clothing,
		c.accessories,
		c.wings,
		c.distinctiveFeatures
	].filter((x) => x && String(x).trim()).join(" · ");
}
function identityParagraph(c) {
	const type = labelCharacterType(c.characterType);
	return [
		`${c.name || c.designation || c.id} (${c.id}), ${type}`,
		c.species && `espèce / nature : ${c.species}`,
		c.bodyStructure && `structure : ${c.bodyStructure}`,
		c.morphology && `morphologie : ${c.morphology}`,
		c.appearance && `apparence : ${c.appearance}`,
		c.complexion && `teint / surface : ${c.complexion}`,
		c.hair && `coiffure : ${c.hair}`,
		c.eyes && `yeux : ${c.eyes}`,
		c.clothing && `vêtements : ${c.clothing}`,
		c.accessories && `accessoires : ${c.accessories}`,
		c.wings && `ailes (observées) : ${c.wings}`,
		c.halo && `halo (observé) : ${c.halo}`,
		c.distinctiveFeatures && `traits distinctifs : ${c.distinctiveFeatures}`,
		c.lockedTraits.length ? `verrouillé : ${c.lockedTraits.join(", ")}` : ""
	].filter(Boolean).join(". ");
}
function composeCharacterImagePrompt(character, analysis) {
	const weave = styleWeave(analysis.visualStyle);
	const type = character.characterType;
	const name = character.name || character.designation || character.id;
	const head = type === "fruit_humanoid" ? `Create a reference portrait of ${name}, a fruit-humanoid character (${character.species || "fruit species as seen in the source"}), body-fruit with humanoid limbs` : type === "angel" ? `Create a reference portrait of ${name}, an angel character matching the source exactly` : `Create a reference portrait of ${name}`;
	const identity = identityParagraph(character);
	const noInvent = type === "angel" ? "Do not invent wings, halo, white robes, golden glow or religious symbols unless listed above as observed." : type === "fruit_humanoid" ? "Do not change fruit species, seed pattern, body-fruit proportions, or clothing. Not a human." : "Keep face, eyes, hair, skin, body proportions and clothing identical to the locked identity.";
	return [
		`${head}, rendered in the same ${weave || "visual style as the source video"}, highly detailed, consistent proportions, immediately recognizable.`,
		identity,
		noInvent,
		"Medium shot portrait, simple background coherent with the source universe, cinematic lighting matching the reference. Identity lock: do not redesign this character."
	].filter(Boolean).join(" ");
}
function weaveStyleIntoPrompt(prompt, analysis) {
	const weave = styleWeave(analysis.visualStyle);
	if (!weave) return prompt;
	const base = prompt.trim();
	if (!base) return weave;
	if (base.toLowerCase().includes(weave.toLowerCase().slice(0, 24))) return base;
	return `${base} Rendered in the same ${weave} as the source video, matching textures, materials, proportions and cinematic quality of the reference.`;
}
function enforceProductionIdentity(production, analysis) {
	const sheets = analysis.characters;
	const characters = production.characters.map((entry) => {
		const sheet = sheets.find((c) => c.id === entry.id);
		if (!sheet) return {
			...entry,
			imagePrompt: weaveStyleIntoPrompt(entry.imagePrompt, analysis)
		};
		return {
			...entry,
			bible: identityParagraph(sheet),
			imagePrompt: composeCharacterImagePrompt(sheet, analysis)
		};
	});
	const scenes = production.scenes.map((scene) => ({
		...scene,
		visualStyle: styleWeave(analysis.visualStyle) || scene.visualStyle,
		videoPrompt: weaveStyleIntoPrompt(scene.videoPrompt, analysis)
	}));
	return {
		...production,
		characters,
		scenes,
		hook: {
			...production.hook,
			visualPrompt: weaveStyleIntoPrompt(production.hook.visualPrompt, analysis)
		}
	};
}
var SPEAKER_SWATCHES = [
	{
		id: "rose",
		label: "rose",
		cssVar: "--speaker-rose",
		mark: "🟥"
	},
	{
		id: "azure",
		label: "bleu",
		cssVar: "--speaker-azure",
		mark: "🟦"
	},
	{
		id: "sage",
		label: "vert",
		cssVar: "--speaker-sage",
		mark: "🟩"
	},
	{
		id: "violet",
		label: "violet",
		cssVar: "--speaker-violet",
		mark: "🟪"
	},
	{
		id: "amber",
		label: "ambre",
		cssVar: "--speaker-amber",
		mark: "🟧"
	},
	{
		id: "teal",
		label: "sarcelle",
		cssVar: "--speaker-teal",
		mark: "●"
	}
];
function swatchById(id) {
	return SPEAKER_SWATCHES.find((s) => s.id === id) ?? SPEAKER_SWATCHES[0];
}
function swatchForIndex(index) {
	return SPEAKER_SWATCHES[Math.abs(index) % SPEAKER_SWATCHES.length];
}
function dialogueId(index) {
	return `D${String(index + 1).padStart(3, "0")}`;
}
function normalizeSpoken$1(text) {
	return text.toLowerCase().normalize("NFD").replace(/\p{M}/gu, "").replace(/[^\p{L}\p{N}\s]/gu, " ").replace(/\s+/g, " ").trim();
}
function escapeRegExp(value) {
	return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
function substituteNames(text, replacements) {
	const sorted = replacements.filter((r) => r.from.trim() && r.to.trim() && r.from.trim() !== r.to.trim()).sort((a, b) => b.from.length - a.from.length);
	let out = text;
	for (const { from, to } of sorted) {
		const re = new RegExp(`(?<![\\p{L}\\p{N}])${escapeRegExp(from)}(?![\\p{L}\\p{N}])`, "giu");
		out = out.replace(re, (match) => {
			if (match === match.toUpperCase() && match.length > 1) return to.toUpperCase();
			if (match[0] && match[0] === match[0].toUpperCase()) return to.charAt(0).toUpperCase() + to.slice(1);
			return to;
		});
	}
	return out;
}
function nameReplacements(characters) {
	const pairs = [];
	for (const c of characters) {
		const from = c.sourceName?.trim();
		const to = c.name?.trim();
		if (from && to && from !== to) pairs.push({
			from,
			to
		});
	}
	return pairs;
}
function applyNameSubstitutionsToBible(bible, characters) {
	const replacements = nameReplacements(characters);
	return {
		...bible,
		lines: bible.lines.map((line) => {
			const matched = matchCharacter(line.speakerId, characters);
			const spoken = replacements.length ? substituteNames(line.sourceText, replacements) : line.sourceText;
			return {
				...line,
				displayText: spoken,
				speakerLabel: matched ? displayCharacterName(matched) : replacements.length ? substituteNames(line.speakerLabel, replacements) : line.speakerLabel
			};
		})
	};
}
function utterancesFromTranscript(transcript) {
	const parts = transcript.replace(/\[\d+(?:\.\d+)?s\]/g, "\n").replace(/\.{3}|…/g, "").split(/(?<=[.!?])\s+|\n+/).map((s) => s.replace(/\uE000/g, "...").replace(/^["«»""]+|["«»""]+$/g, "").trim()).filter((s) => s.length > 1);
	const unique = [];
	const seen = /* @__PURE__ */ new Set();
	for (const part of mergeUtteranceFragments(parts)) {
		const key = normalizeSpoken$1(part);
		if (!key || seen.has(key)) continue;
		seen.add(key);
		unique.push(part);
	}
	return unique;
}
function mergeUtteranceFragments(parts) {
	const out = [];
	for (const part of parts) {
		const prev = out.at(-1);
		if (!prev) {
			out.push(part);
			continue;
		}
		const speakerTag = /^[\p{Lu}][\p{L}'-]{1,20}\s*:/u.test(part);
		const prevOpen = /(?:\.\.\.|…|,|;|:)\s*$/.test(prev);
		const continues = /^[\p{Ll}]/u.test(part);
		if (!speakerTag && (prevOpen || continues)) {
			out[out.length - 1] = `${prev} ${part}`.replace(/\s+/g, " ").trim();
			continue;
		}
		out.push(part);
	}
	return out;
}
function isFaithfulToTranscript(line, transcript) {
	const n = normalizeSpoken$1(line);
	const t = normalizeSpoken$1(transcript);
	if (!n) return false;
	if (t.includes(n)) return true;
	const words = n.split(" ").filter((w) => w.length > 2);
	if (words.length < 2) return t.includes(n);
	return words.filter((w) => t.includes(w)).length / words.length >= .72;
}
function parseConfidence(value) {
	if (value === "clear" || value === "uncertain" || value === "inaudible") return value;
	return "uncertain";
}
function parseAttribution(value, speakerId) {
	if (value === "certain" || value === "unverified") return value;
	return speakerId ? "certain" : "unverified";
}
function emptyPerformance() {
	return {
		emotionStart: "",
		emotionDominant: "",
		intensity: 0,
		facialExpression: "",
		gaze: "",
		gesture: "",
		posture: "",
		tone: "",
		tears: "",
		evolution: ""
	};
}
function parsePerformance(raw, fallbackEmotion = "") {
	const record = raw && typeof raw === "object" ? raw : {};
	const nested = record.performance && typeof record.performance === "object" ? record.performance : record;
	const pick = (...keys) => {
		for (const key of keys) {
			const v = nested[key];
			if (typeof v === "string" && v.trim()) return v.trim();
		}
		return "";
	};
	const intensityRaw = nested.intensity;
	const intensity = typeof intensityRaw === "number" ? Math.min(10, Math.max(0, Math.round(intensityRaw))) : typeof intensityRaw === "string" && /^\d+/.test(intensityRaw) ? Math.min(10, Math.max(0, parseInt(intensityRaw, 10))) : 0;
	return {
		emotionStart: pick("emotionStart", "startingEmotion"),
		emotionDominant: pick("emotionDominant", "emotion", "dominantEmotion") || fallbackEmotion,
		intensity,
		facialExpression: pick("facialExpression", "expression", "face"),
		gaze: pick("gaze", "look"),
		gesture: pick("gesture", "gestures", "body"),
		posture: pick("posture"),
		tone: pick("tone", "voice", "delivery"),
		tears: pick("tears", "crying", "pleurs"),
		evolution: pick("evolution", "arc")
	};
}
function parseSilentReaction(raw) {
	const o = raw && typeof raw === "object" ? raw : {};
	const characterId = typeof o.characterId === "string" ? o.characterId.trim() : "";
	const expression = typeof o.expression === "string" ? o.expression.trim() : "";
	const gaze = typeof o.gaze === "string" ? o.gaze.trim() : "";
	const gesture = typeof o.gesture === "string" ? o.gesture.trim() : "";
	const posture = typeof o.posture === "string" ? o.posture.trim() : "";
	if (!characterId && !expression && !gaze && !gesture) return null;
	return {
		characterId,
		characterLabel: typeof o.characterLabel === "string" ? o.characterLabel.trim() : "",
		expression,
		gaze,
		gesture,
		posture
	};
}
function formatPerformancePrompt(line) {
	const p = line.performance ?? emptyPerformance();
	const rows = [];
	const emotion = [p.emotionStart, p.emotionDominant].filter(Boolean).join(" → ");
	if (emotion) rows.push(`Émotion : ${emotion}${p.intensity ? ` (${p.intensity}/10)` : ""}.`);
	if (p.facialExpression) rows.push(`Expression : ${p.facialExpression}`);
	if (p.tears) rows.push(`Larmes : ${p.tears}`);
	if (p.gaze) rows.push(`Regard : ${p.gaze}`);
	if (p.gesture) rows.push(`Gestes : ${p.gesture}`);
	if (p.posture) rows.push(`Posture : ${p.posture}`);
	if (p.tone) rows.push(`Ton : ${p.tone}`);
	if (p.evolution) rows.push(`Évolution : ${p.evolution}`);
	if (!rows.length) return "Interprétation : non observée avec certitude — ne pas inventer de larmes, de cris ni de gestes.";
	rows.push("Interprétation : prononcer la réplique exacte avec cette charge émotionnelle, sans adoucir.");
	return rows.join("\n");
}
function matchCharacter(label, characters) {
	if (!label) return void 0;
	const n = normalizeSpoken$1(label);
	if (!n) return void 0;
	return characters.find((c) => normalizeSpoken$1(c.id) === n || normalizeSpoken$1(c.name || "") === n || normalizeSpoken$1(c.sourceName || "") === n || normalizeSpoken$1(c.designation) === n);
}
function displayCharacterName(character) {
	return (character.name || character.designation || character.id).trim();
}
function parseTaggedReplica(raw) {
	const t = raw.trim();
	const m = t.match(/^(?:[🟥🟦🟩🟪🟧●]\s*)?([A-ZÀ-Ÿ][\p{L}0-9'’\- ]{0,40}?)\s*(?:[:—–→-]|→)\s*[«"“]?(.+?)[»"”]?$/iu);
	if (m?.[1] && m[2] && m[1].trim().length < 32) return {
		speaker: m[1].trim(),
		text: m[2].replace(/[«»"“”]/g, "").trim()
	};
	return {
		speaker: null,
		text: t.replace(/^[«"“]+|[»"”]+$/g, "").trim()
	};
}
function explodeMixedDialogue(raw) {
	const text = raw.trim();
	if (!text) return [];
	const lines = text.split(/\n+/).map((s) => s.trim()).filter(Boolean);
	if (lines.length >= 2 && lines.every((l) => parseTaggedReplica(l).speaker)) return lines.map(parseTaggedReplica);
	const tagged = [...text.matchAll(/([A-ZÀ-Ÿ][\p{L}'’\- ]{1,30}?)\s*(?:[:—–]|→)\s*[«"“]([^«»"“”]+)[»"”]/giu)];
	if (tagged.length >= 2) return tagged.map((m) => ({
		speaker: (m[1] ?? "").trim(),
		text: (m[2] ?? "").trim()
	}));
	return [parseTaggedReplica(text)];
}
function assignSpeakerColors(characters) {
	return characters.map((c, i) => ({
		...c,
		dialogueColor: c.dialogueColor || swatchForIndex(i).id
	}));
}
function swatchForCharacter(character, fallbackIndex = 0) {
	if (character?.dialogueColor) return swatchById(character.dialogueColor);
	return swatchForIndex(fallbackIndex);
}
function sealDialogueLines(lines, characters) {
	const roster = assignSpeakerColors(characters);
	const sorted = lines.slice().sort((a, b) => a.order - b.order || a.sceneNumber - b.sceneNumber || (a.id || "").localeCompare(b.id || ""));
	let next = 0;
	const used = new Set(sorted.map((l) => l.id).filter((id) => /^D\d{3}$/.test(id)));
	function takeId(existing) {
		if (existing && /^D\d{3}$/.test(existing) && used.has(existing)) return existing;
		let id = dialogueId(next);
		next += 1;
		while (used.has(id)) {
			id = dialogueId(next);
			next += 1;
		}
		used.add(id);
		return id;
	}
	return sorted.map((line, i) => {
		const matched = matchCharacter(line.speakerId, roster) || matchCharacter(line.speakerLabel, roster);
		const speakerId = matched?.id ?? null;
		return {
			...line,
			id: takeId(line.id),
			order: i + 1,
			speakerId,
			speakerLabel: matched ? displayCharacterName(matched) : line.speakerLabel,
			displayText: (line.displayText || line.sourceText).trim(),
			sourceText: line.sourceText.trim(),
			attribution: speakerId ? line.attribution === "unverified" ? "unverified" : "certain" : "unverified",
			performance: line.performance ?? parsePerformance(line, line.emotion)
		};
	});
}
function reassignDialogueSpeaker(line, speakerId, characters) {
	if (!speakerId) return {
		...line,
		speakerId: null,
		speakerLabel: "",
		attribution: "unverified"
	};
	const matched = matchCharacter(speakerId, characters);
	if (!matched) return {
		...line,
		speakerId,
		attribution: "unverified"
	};
	return {
		...line,
		speakerId: matched.id,
		speakerLabel: displayCharacterName(matched),
		attribution: "certain"
	};
}
function dialogueCharCount(lines) {
	return lines.reduce((n, line) => n + (line.displayText || line.sourceText).length, 0);
}
function parseDialogueLine(raw, index) {
	const o = raw && typeof raw === "object" ? raw : {};
	const sourceText = typeof o.sourceText === "string" ? o.sourceText.trim() : typeof o.text === "string" ? o.text.trim() : typeof o.dialogue === "string" ? o.dialogue.trim() : "";
	const speakerLabel = typeof o.speakerLabel === "string" ? o.speakerLabel.trim() : typeof o.speaker === "string" ? o.speaker.trim() : "";
	const speakerId = typeof o.speakerId === "string" && o.speakerId.trim() ? o.speakerId.trim() : null;
	return {
		id: typeof o.id === "string" && /^D\d{3}$/.test(o.id.trim()) ? o.id.trim() : dialogueId(index),
		sceneNumber: Math.max(1, Math.round(typeof o.sceneNumber === "number" ? o.sceneNumber : 1)),
		order: Math.max(1, Math.round(typeof o.order === "number" ? o.order : index + 1)),
		speakerId,
		speakerLabel,
		sourceText,
		displayText: typeof o.displayText === "string" && o.displayText.trim() ? o.displayText.trim() : sourceText,
		timeHint: typeof o.timeHint === "string" ? o.timeHint : "",
		emotion: typeof o.emotion === "string" ? o.emotion : "",
		intention: typeof o.intention === "string" ? o.intention : "",
		confidence: parseConfidence(o.confidence),
		attribution: parseAttribution(o.attribution, speakerId),
		performance: parsePerformance(o, typeof o.emotion === "string" ? o.emotion : ""),
		uncertainSpan: typeof o.uncertainSpan === "string" ? o.uncertainSpan : void 0
	};
}
function emptyDialogueBible() {
	return {
		language: null,
		source: "unavailable",
		rawTranscript: null,
		lines: []
	};
}
function lineFromUtterance(text, index, sceneNumber, characters) {
	const tagged = parseTaggedReplica(text);
	const matched = matchCharacter(tagged.speaker, characters);
	return {
		id: dialogueId(index),
		sceneNumber: Math.max(1, sceneNumber),
		order: index + 1,
		speakerId: matched?.id ?? null,
		speakerLabel: matched ? displayCharacterName(matched) : tagged.speaker || "",
		sourceText: tagged.text,
		displayText: tagged.text,
		timeHint: "",
		emotion: "",
		intention: "",
		confidence: matched ? "clear" : "uncertain",
		attribution: matched ? "certain" : "unverified",
		performance: emptyPerformance()
	};
}
function finalizeLockedDialogues(args) {
	const sceneCount = Math.max(1, args.sceneCount);
	const utterances = args.transcript ? utterancesFromTranscript(args.transcript) : [];
	const llmLines = args.llmLines.flatMap((line, i) => {
		const pieces = explodeMixedDialogue(line.sourceText || line.displayText);
		if (pieces.length <= 1) return [line];
		return pieces.map((piece, j) => {
			const matched = matchCharacter(piece.speaker, args.characters);
			return {
				...line,
				id: line.id ? `${line.id}${j ? `_${j}` : ""}` : dialogueId(i * 10 + j),
				sourceText: piece.text,
				displayText: piece.text,
				speakerId: matched?.id ?? (piece.speaker ? null : line.speakerId),
				speakerLabel: matched ? displayCharacterName(matched) : piece.speaker || line.speakerLabel,
				attribution: matched ? "certain" : "unverified",
				order: line.order + j
			};
		});
	});
	let lines = [];
	if (utterances.length) {
		const used = /* @__PURE__ */ new Set();
		for (const [i, utterance] of utterances.entries()) {
			const matchIdx = llmLines.findIndex((line, idx) => !used.has(idx) && isFaithfulToTranscript(line.sourceText, utterance));
			const fallback = llmLines.findIndex((line, idx) => !used.has(idx) && isFaithfulToTranscript(utterance, line.sourceText));
			const idx = matchIdx >= 0 ? matchIdx : fallback;
			if (idx >= 0) {
				used.add(idx);
				const llm = llmLines[idx];
				lines.push({
					...llm,
					sourceText: utterance,
					displayText: utterance,
					confidence: llm.confidence === "inaudible" ? "clear" : llm.confidence,
					sceneNumber: Math.min(sceneCount, Math.max(1, llm.sceneNumber || 1)),
					order: i + 1
				});
			} else lines.push(lineFromUtterance(utterance, i, Math.min(sceneCount, Math.floor(i * sceneCount / utterances.length) + 1), args.characters));
		}
	} else lines = llmLines.filter((line) => line.sourceText.trim()).map((line, i) => ({
		...line,
		order: i + 1,
		sceneNumber: Math.min(sceneCount, Math.max(1, line.sceneNumber || 1)),
		confidence: line.confidence === "clear" ? "uncertain" : line.confidence,
		displayText: line.sourceText
	}));
	lines = applyNameSubstitutionsToBible({
		language: args.language ?? null,
		source: utterances.length ? "transcript" : args.sourceHint ?? "unavailable",
		rawTranscript: args.transcript,
		lines
	}, args.characters).lines;
	lines = mergeConsecutiveSpeakerTurns(lines);
	return {
		language: args.language ?? null,
		source: utterances.length ? "transcript" : lines.length ? args.sourceHint ?? "visual-inference" : "unavailable",
		rawTranscript: args.transcript,
		lines: sealDialogueLines(lines, args.characters)
	};
}
function mergeConsecutiveSpeakerTurns(lines) {
	const out = [];
	for (const line of lines) {
		const prev = out.at(-1);
		if (prev && prev.speakerId && prev.speakerId === line.speakerId && prev.sceneNumber === line.sceneNumber && /(?:\.\.\.|…|,|;|:)\s*$/.test(prev.sourceText.trim())) {
			prev.sourceText = `${prev.sourceText} ${line.sourceText}`.replace(/\s+/g, " ").trim();
			prev.displayText = `${prev.displayText} ${line.displayText}`.replace(/\s+/g, " ").trim();
			continue;
		}
		out.push({ ...line });
	}
	return out.map((line, i) => ({
		...line,
		order: i + 1
	}));
}
function remapDialogueScenes(lines, previousSceneCount, nextSceneCount) {
	if (!lines.length || previousSceneCount <= 0 || nextSceneCount <= 0) return lines;
	if (previousSceneCount === nextSceneCount) return lines.map((line) => ({
		...line,
		sceneNumber: Math.min(nextSceneCount, Math.max(1, line.sceneNumber))
	}));
	return lines.map((line) => {
		const oldIndex = Math.min(previousSceneCount, Math.max(1, line.sceneNumber)) - 1;
		const mapped = Math.floor(oldIndex * nextSceneCount / previousSceneCount) + 1;
		return {
			...line,
			sceneNumber: Math.min(nextSceneCount, Math.max(1, mapped))
		};
	});
}
function formatLockedDialogue(lines) {
	const parts = [];
	for (const line of lines) {
		const spoken = (line.displayText || line.sourceText).trim();
		if (!spoken) continue;
		const who = line.speakerLabel.trim() || "Locuteur à vérifier";
		const mark = line.attribution === "unverified" ? " [attribution à vérifier]" : line.confidence === "uncertain" ? " [incertain]" : line.confidence === "inaudible" ? " [inaudible]" : "";
		parts.push(`${who} : « ${spoken} »${mark}`);
	}
	return parts.length ? parts.join("\n") : null;
}
function formatAttributedPromptBlock(lines, characters) {
	const roster = assignSpeakerColors(characters);
	const parts = [];
	const ordered = lines.slice().sort((a, b) => a.order - b.order);
	for (const line of ordered) {
		const spoken = (line.displayText || line.sourceText).trim();
		if (!spoken) continue;
		const character = matchCharacter(line.speakerId, roster) || matchCharacter(line.speakerLabel, roster);
		const idx = character ? roster.findIndex((c) => c.id === character.id) : 0;
		const swatch = swatchForCharacter(character, Math.max(0, idx));
		const who = character ? displayCharacterName(character) : line.speakerLabel || "LOCUTEUR À VÉRIFIER";
		parts.push(`${swatch.mark} ${who.toUpperCase()} — RÉPLIQUE ${line.order}\n${formatPerformancePrompt(line)}\nDialogue exact :\n« ${spoken} »`);
	}
	return parts.length ? parts.join("\n\n") : null;
}
function applyLinesToScenes(scenes, lines) {
	return scenes.map((scene) => {
		const owned = lines.filter((line) => line.sceneNumber === scene.number).sort((a, b) => a.order - b.order);
		const dialogue = formatLockedDialogue(owned);
		const speakers = [...new Set(owned.map((l) => l.speakerLabel || l.speakerId).filter(Boolean))];
		return {
			...scene,
			dialogue,
			dialogueSpeaker: speakers.length === 1 ? speakers[0] : speakers.length ? speakers.join(", ") : scene.dialogueSpeaker
		};
	});
}
function attachDialogues(analysis, transcript) {
	const llmLines = analysis.dialogues?.lines ?? [];
	const fromScenes = analysis.scenes.flatMap((scene, i) => {
		if (!scene.dialogue) return [];
		return explodeMixedDialogue(scene.dialogue).map((piece, j) => {
			const matched = matchCharacter(piece.speaker, analysis.characters) || matchCharacter(scene.dialogueSpeaker, analysis.characters) || matchCharacter(scene.characters[0], analysis.characters);
			const unverified = !piece.speaker && scene.characters.length !== 1;
			return {
				id: dialogueId(i * 10 + j),
				sceneNumber: scene.number,
				order: i * 10 + j + 1,
				speakerId: matched && !unverified ? matched.id : matched?.id ?? null,
				speakerLabel: matched && !unverified ? displayCharacterName(matched) : piece.speaker || scene.dialogueSpeaker || "",
				sourceText: piece.text,
				displayText: piece.text,
				timeHint: scene.startHint,
				emotion: scene.emotion,
				intention: "",
				confidence: scene.confidence === "observed" ? "clear" : "uncertain",
				attribution: matched && !unverified ? "certain" : "unverified",
				performance: parsePerformance({}, scene.emotion)
			};
		});
	});
	const bible = finalizeLockedDialogues({
		transcript,
		llmLines: llmLines.length ? llmLines : fromScenes,
		characters: analysis.characters,
		sceneCount: Math.max(1, analysis.scenes.length),
		language: analysis.language,
		sourceHint: analysis.dialogues?.source ?? analysis.audio.source
	});
	const scenes = applyLinesToScenes(analysis.scenes, bible.lines);
	const dialoguePresent = bible.lines.some((l) => l.sourceText.trim() && l.confidence !== "inaudible");
	return {
		...analysis,
		dialogues: bible,
		scenes,
		audio: {
			...analysis.audio,
			dialoguePresent: dialoguePresent || analysis.audio.dialoguePresent,
			transcriptExcerpt: bible.rawTranscript ? bible.rawTranscript.slice(0, 4e3) : analysis.audio.transcriptExcerpt,
			source: bible.source === "transcript" ? "transcript" : analysis.audio.source,
			notes: analysis.audio.notes
		}
	};
}
function fitDialoguesToScenes(analysis, previousSceneCount) {
	const lines = remapDialogueScenes(analysis.dialogues?.lines ?? [], previousSceneCount, analysis.scenes.length);
	const dialogues = {
		...analysis.dialogues ?? emptyDialogueBible(),
		lines
	};
	return {
		...analysis,
		dialogues,
		scenes: applyLinesToScenes(analysis.scenes, lines)
	};
}
function composeLockedVideoPrompt(args) {
	const roster = assignSpeakerColors(args.analysis.characters);
	const present = (args.scene.characters.length ? args.scene.characters : [...new Set(args.lines.map((l) => l.speakerId).filter(Boolean))]).map((id) => matchCharacter(id, roster)).filter((c) => Boolean(c));
	const uniquePresent = present.length ? present : roster.filter((c) => args.lines.some((l) => l.speakerId === c.id));
	const dialogueBlock = formatAttributedPromptBlock(args.lines, roster);
	const total = dialogueCharCount(args.lines);
	const style = styleWeave(args.analysis.visualStyle) || args.scene.visualStyle;
	const cards = uniquePresent.map((character) => identityParagraph(character));
	const parts = [
		`Scène en ${style || "style de la vidéo source"}, textures, matériaux et proportions identiques à la référence.`,
		cards.length ? cards.join("\n") : "Aucun personnage parlant identifié.",
		"Identité verrouillée : même visage, mêmes yeux, même morphologie, même espèce fruit ou mêmes ailes observées, mêmes vêtements. Ne pas redessiner. Ne pas inventer d'ailes, de halo ou d'espèce absents de la fiche."
	];
	parts.push(`Caméra ${args.scene.camera || args.analysis.cinematic?.dominantShots?.join(", ") || "cadrage source"}. Lieu : ${args.scene.location}. Action : ${args.scene.action}. Émotion : ${args.scene.emotion}. Éclairage : ${args.scene.lighting}.`);
	parts.push(`TOTAL DIALOGUES : ${total} caractères`);
	if (dialogueBlock) {
		parts.push("RESPECT ABSOLU DES DIALOGUES ET DE L'INTERPRÉTATION — une réplique = un personnage, ordre source, émotion et gestes observés.");
		parts.push("LANGUE PARLÉE : français uniquement. Traduire fidèlement le sens si la source n'est pas en français. Aucune réplique prononcée en anglais ou autre langue.");
		parts.push(dialogueBlock);
	} else parts.push("Aucun dialogue dans cette scène. Ne pas en inventer. Bouches fermées.");
	const silent = args.analysis.scenes.find((s) => s.number === args.scene.number)?.silentReactions ?? [];
	if (silent.length) {
		parts.push("Personnages silencieux — bouche fermée, aucune parole.");
		for (const reaction of silent) {
			const character = matchCharacter(reaction.characterId, roster);
			const label = character ? displayCharacterName(character) : reaction.characterLabel || reaction.characterId;
			const bits = [
				reaction.expression && `expression : ${reaction.expression}`,
				reaction.gaze && `regard : ${reaction.gaze}`,
				reaction.gesture && `geste : ${reaction.gesture}`,
				reaction.posture && `posture : ${reaction.posture}`
			].filter(Boolean);
			parts.push(`${label} — ${bits.length ? bits.join(" · ") : "présent, silencieux, réaction naturelle sans parler"}`);
		}
	}
	parts.push("Un seul personnage parle à la fois. Les autres ont la bouche fermée. Synchronisation labiale sur les mots exacts. Les dialogues commencent dans les 2 premières secondes.");
	parts.push("Fidélité émotionnelle : larmes, cri, tremblement ou geste important décrits ci-dessus doivent être reproduits. Ne pas adoucir. Ne pas inventer.");
	const cleaned = (args.scene.videoPrompt?.trim() ?? "").replace(/PERSONNAGES PRÉSENTS DANS LA SCÈNE[\s\S]*$/i, "").replace(/DIALOGUES VERROUILLÉS[\s\S]*$/i, "").replace(/Scène en [\s\S]*$/i, "").trim();
	if (cleaned && !/Identité verrouillée/i.test(cleaned)) return `${parts.join("\n")}\n\n${cleaned}`;
	return parts.join("\n");
}
function enforceProductionDialogues(production, analysis, mode, kind = "human") {
	if (mode === "inspiration") return {
		...production,
		scenario: {
			...production.scenario,
			dialoguesNote: production.scenario.dialoguesNote || "Mode inspiration : dialogues originaux, distincts des paroles source."
		}
	};
	const lines = remapDialogueScenes(analysis.dialogues?.lines ?? [], Math.max(1, analysis.scenes.length), Math.max(1, production.scenes.length));
	const locked = analysis;
	const scenes = production.scenes.map((scene) => {
		const owned = lines.filter((line) => line.sceneNumber === scene.number).sort((a, b) => a.order - b.order);
		const fallback = formatLockedDialogue(owned);
		return {
			...scene,
			dialogue: fallback,
			audio: fallback ? `${scene.audio ? `${scene.audio} · ` : ""}dialogue source verrouillé` : scene.audio,
			videoPrompt: composeLockedVideoPrompt({
				kind,
				scene,
				analysis: locked,
				lines: owned
			})
		};
	});
	const has = scenes.some((s) => s.dialogue);
	return {
		...production,
		scenes,
		scenario: {
			...production.scenario,
			dialoguesNote: has ? "Dialogues source verrouillés, repris mot à mot. Seul un prénom modifié par l'utilisateur peut être substitué." : "Aucun dialogue audible identifié — aucun dialogue inventé."
		}
	};
}
function lockCharactersSourceNames(characters) {
	return assignSpeakerColors(characters.map((c) => ({
		...c,
		sourceName: c.sourceName?.trim() || c.name
	})));
}
function applyDialogueEdits(analysis, lines) {
	const characters = assignSpeakerColors(analysis.characters);
	const sealed = sealDialogueLines(lines, characters);
	return {
		...analysis,
		characters,
		dialogues: {
			...analysis.dialogues ?? emptyDialogueBible(),
			lines: sealed
		},
		scenes: applyLinesToScenes(analysis.scenes, sealed)
	};
}
var MODEL = "grok-4.5";
var VISION_TIMEOUT_MS = 1e5;
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
		}, hasImages ? Math.max(timeoutMs, VISION_TIMEOUT_MS) : timeoutMs);
	};
	let res;
	try {
		res = await attempt(jsonMode);
	} catch (err) {
		const aborted = err instanceof Error && err.name === "AbortError";
		console.error("[kreia:chat] fetch failed", err);
		return fail(aborted ? `Timeout IA après ${hasImages ? Math.max(timeoutMs, VISION_TIMEOUT_MS) : timeoutMs} ms (vision=${hasImages}).` : `Réseau IA: ${err instanceof Error ? err.message : NETWORK_MESSAGE}`);
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
		dialogueColor: strOrNull(o.dialogueColor) ?? void 0,
		userLocked: Boolean(o.userLocked)
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
var cast_exports = /* @__PURE__ */ __exportAll$1({
	CAST_BATCH_SIZE: () => 3,
	identifyCharacters: () => identifyCharacters,
	listCastBatches: () => listCastBatches,
	mergeCharacters: () => mergeCharacters,
	normalizeCharacterIds: () => normalizeCharacterIds,
	pickOverview: () => pickOverview
});
var CAST_TOKENS = 4200;
var CAST_MAX_FRAMES = 12;
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
	return [...frames.filter((f) => typeof f.dataUrl === "string" && f.dataUrl.startsWith("data:image/") && f.dataUrl.length > 32)].sort((a, b) => a.t - b.t).slice(0, CAST_MAX_FRAMES);
}
function listCastBatches(frames) {
	const overview = pickOverview(frames);
	if (!overview.length) return [[]];
	const batches = [];
	for (let i = 0; i < overview.length; i += 3) batches.push(overview.slice(i, i + 3));
	return batches;
}
async function identifyCharacters(args) {
	const empty = {
		characters: args.knownCharacters ?? [],
		observedSummary: "",
		limitations: [],
		language: null,
		done: true,
		batchIndex: 0,
		batchCount: 1
	};
	try {
		logPipe(1, "Starting identification");
		const sourceOk = Array.isArray(args.frames);
		logPipe(2, `Video source available: ${sourceOk}`);
		logPipe(3, `Frames count: ${sourceOk ? args.frames.length : 0}`);
		const batches = listCastBatches(args.frames ?? []);
		const batchCount = Math.max(1, batches.length);
		const batchIndex = Math.max(0, Math.min(args.batchIndex ?? 0, batchCount - 1));
		const batch = batches[batchIndex] ?? [];
		const framesValid = batch.some((f) => typeof f.dataUrl === "string" && f.dataUrl.startsWith("data:image/") && f.dataUrl.length > 32);
		logPipe(4, `Frames valid: ${framesValid}`, {
			overview: pickOverview(args.frames ?? []).length,
			batch: batchIndex + 1,
			batchCount,
			times: batch.map((f) => f.t)
		});
		const known = args.knownCharacters ?? [];
		if (!framesValid) {
			logPipeError("4", "No usable frames in batch", { batch: batchIndex + 1 });
			const characters = known.length ? known : [placeholderCharacter(args.kind, 0)];
			return {
				...empty,
				characters,
				limitations: known.length ? [`Lot ${batchIndex + 1}/${batchCount} sans image exploitable — poursuite.`] : ["Aucune image exploitable — personnage temporaire créé, l'analyse continue."],
				done: batchIndex + 1 >= batchCount,
				batchIndex,
				batchCount
			};
		}
		const fruit = fruitHumanoidPromptBlock(args.kind === "fruit-humanoid");
		const angel = angelPromptBlock(args.kind === "angel");
		const idScheme = args.kind === "fruit-humanoid" ? "FRUIT_CHARACTER_01…" : args.kind === "angel" ? "ANGEL_CHARACTER_01… pour les anges, CHARACTER_01… pour les humains" : "CHARACTER_01…";
		const img = imagesOf(batch);
		logPipe(5, "Preparing analysis request", {
			batch: batchIndex + 1,
			images: img.length
		});
		console.info("[CHARACTERS] Preparing AI request", {
			batch: batchIndex + 1,
			images: img.length
		});
		console.info("[CHARACTERS] AI request START");
		let merged = known;
		let visualStyle;
		let cinematic;
		let observedSummary = "";
		const limitations = [];
		let language = null;
		let cast;
		try {
			logPipe(6, "Request sent", { batch: batchIndex + 1 });
			cast = await chat({
				messages: [{
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
JSON objet : { "observedSummary":"", "limitations":[], "language": null, "characters": [{ "id":"", "designation":"", "name":null, "nameConfidence":"inferred", "characterType":"", "ageApparent":"", "appearance":"", "hair":"", "eyes":"", "complexion":"", "morphology":"", "clothing":"", "accessories":"", "distinctiveFeatures":"", "species":"", "bodyStructure":"", "wings":"", "halo":"", "role":"", "prominence":"principal|secondary|punctual", "firstSeen":"", "lastSeen":"", "notes":"" }] }`
				}, {
					role: "user",
					content: [{
						type: "text",
						text: `Durée ${Number(args.durationSeconds || 0).toFixed(1)} s, ${args.width || 0}×${args.height || 0}, type ${args.kind}.
Photogrammes ${batch.map((f) => Number(f.t || 0).toFixed(1) + "s").join(", ")} — parcours toute l'image, pas seulement le centre.
Déjà identifiés : ${merged.length ? merged.map((c) => `${c.id} ${c.designation} (${c.appearance || c.clothing || "—"})`).join(" · ") : "aucun — cherche-les tous"}.
${args.userNotes ?? ""}
Si un visage déjà listé réapparaît, réutilise le même ID. Sinon crée un nouveau personnage.`
					}, ...img]
				}],
				maxTokens: CAST_TOKENS
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
				batchCount
			};
		}
		logPipe(7, "Response received", {
			batch: batchIndex + 1,
			hasValue: Boolean(cast)
		});
		console.info("[CHARACTERS] AI response RECEIVED", {
			batch: batchIndex + 1,
			ok: Boolean(cast && "ok" in cast && cast.ok),
			length: cast && "ok" in cast && cast.ok ? cast.text.length : 0,
			error: cast && "error" in cast ? cast.error : void 0
		});
		const keys = cast && typeof cast === "object" ? Object.keys(cast) : [];
		logPipe(8, "Response status", {
			ok: Boolean(cast && "ok" in cast && cast.ok),
			keys
		});
		logPipe(9, `Response content exists: ${Boolean(cast && "ok" in cast && cast.ok && typeof cast.text === "string" && cast.text.trim())}`, { chars: cast && "ok" in cast && cast.ok ? cast.text.length : 0 });
		if (!cast || !("ok" in cast) || !cast.ok) {
			const lastError = cast && "error" in cast && typeof cast.error === "string" && cast.error || "réponse IA absente";
			logPipeError("8", lastError, { batch: batchIndex + 1 });
			limitations.push(`Image ${batchIndex + 1} ignorée : ${lastError}`);
		} else {
			logPipe(10, "Parsing response");
			try {
				const parsed = parseCastResult(cast.text, args.kind);
				logPipe(11, "Parsed successfully", { count: parsed.characters.length });
				logPipe(12, "Characters result created", { ids: parsed.characters.map((c) => c.id) });
				merged = mergeCharacters(merged, parsed.characters, args.kind);
				visualStyle = parsed.visualStyle;
				cinematic = parsed.cinematic;
				observedSummary = parsed.observedSummary;
				language = parsed.language;
				limitations.push(...parsed.limitations ?? []);
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
		logPipe(13, "Updating application state", {
			count: characters.length,
			done,
			batch: batchIndex + 1
		});
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
			batchCount
		};
	} catch (err) {
		logPipeError("identifyCharacters", err);
		const known = args.knownCharacters ?? [];
		return {
			...empty,
			characters: known.length ? known : [placeholderCharacter(args.kind, 0)],
			limitations: [`Identification partielle (${err instanceof Error ? err.message : "erreur technique"}). L'analyse continue.`],
			done: true
		};
	}
}
function blankCharacter(kind, index) {
	const type = kind === "fruit-humanoid" ? "fruit_humanoid" : kind === "angel" ? "angel" : "unknown_character";
	return {
		id: stableIdFor(index, kind, type),
		designation: `Personnage ${index + 1}`,
		name: null,
		sourceName: null,
		nameConfidence: "proposed",
		characterType: type,
		species: "",
		bodyStructure: "",
		distinctiveFeatures: "",
		wings: "",
		halo: "",
		identityFingerprint: "",
		firstSeen: "",
		lastSeen: "",
		ageApparent: "",
		sex: "",
		appearance: "",
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
		notes: "Ajouté manuellement.",
		userLocked: true
	};
}
function mergeCharacterPair(keep, drop) {
	const merged = {
		...keep,
		designation: keep.designation || drop.designation,
		name: keep.name || drop.name,
		sourceName: keep.sourceName || drop.sourceName,
		appearance: keep.appearance || drop.appearance,
		complexion: keep.complexion || drop.complexion,
		morphology: keep.morphology || drop.morphology,
		hair: keep.hair || drop.hair,
		eyes: keep.eyes || drop.eyes,
		clothing: keep.clothing || drop.clothing,
		accessories: keep.accessories || drop.accessories,
		species: keep.species || drop.species,
		bodyStructure: keep.bodyStructure || drop.bodyStructure,
		distinctiveFeatures: keep.distinctiveFeatures || drop.distinctiveFeatures,
		wings: keep.wings || drop.wings,
		halo: keep.halo || drop.halo,
		ageApparent: keep.ageApparent || drop.ageApparent,
		role: keep.role || drop.role,
		personality: keep.personality || drop.personality,
		relationships: keep.relationships || drop.relationships,
		firstSeen: keep.firstSeen || drop.firstSeen,
		lastSeen: drop.lastSeen || keep.lastSeen,
		lockedTraits: [.../* @__PURE__ */ new Set([...keep.lockedTraits ?? [], ...drop.lockedTraits ?? []])],
		notes: [keep.notes, drop.notes].filter(Boolean).join(" · "),
		userLocked: true
	};
	merged.identityFingerprint = identityFingerprint(merged);
	return merged;
}
function reindexCharacters(list, kind) {
	return normalizeCharacterIds(list.map((c) => ({
		...c,
		userLocked: c.userLocked ?? true
	})), kind);
}
function keyOf(c) {
	return [
		(c.name || c.designation || "").toLowerCase().trim(),
		(c.hair || "").toLowerCase().trim(),
		(c.clothing || "").toLowerCase().trim(),
		(c.eyes || "").toLowerCase().trim()
	].join("|");
}
function duplicateWarnings(list) {
	const warnings = [];
	for (let i = 0; i < list.length; i++) for (let j = i + 1; j < list.length; j++) {
		const a = list[i];
		const b = list[j];
		const printA = identityFingerprint(a);
		const printB = identityFingerprint(b);
		if (printA && printB && printA === printB) {
			warnings.push(`${a.id} et ${b.id} semblent être la même personne — fusionnez-les si c’est le cas.`);
			continue;
		}
		if (keyOf(a) && keyOf(a) === keyOf(b)) warnings.push(`${a.id} et ${b.id} ont une apparence très proche.`);
	}
	return warnings;
}
//#endregion
export { mergeCharacterPair as A, tryExtractJson as B, fruitHumanoidPromptBlock as C, listCastBatches as D, labelCharacterType as E, reindexCharacters as F, styleWeave as I, swatchForCharacter as L, parseCharacter as M, parseProduction as N, lockCharactersSourceNames as O, reassignDialogueSpeaker as P, timedFetchPublic as R, formatLockedDialogue as S, identityParagraph as T, enforceProductionDialogues as _, applyDialogueEdits as a, fail as b, attachDialogues as c, chat as d, composeCharacterImagePrompt as f, emptyPerformance as g, emptyDialogueBible as h, apiKey as i, parseAnalysis as j, matchCharacter as k, blankCharacter as l, duplicateWarnings as m, NETWORK_MESSAGE as n, applyLinesToScenes as o, dialogueCharCount as p, angelPromptBlock as r, applyNameSubstitutionsToBible as s, INVALID_AI_MESSAGE as t, cast_edit_B0U_aGNG_exports as u, enforceProductionIdentity as v, identifyCharacters as w, fitDialoguesToScenes as x, extractJson as y, transcribeWav as z };
