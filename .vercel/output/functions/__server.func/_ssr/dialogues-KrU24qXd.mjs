import { i as fruitCharacterId, n as characterId, t as angelCharacterId } from "./ids-ckhly8rN.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/dialogues-KrU24qXd.js
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
function normalizeSpoken(text) {
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
	const parts = transcript.replace(/\[\d+(?:\.\d+)?s\]/g, "\n").split(/(?<=[.!?…])\s+|\n+/).map((s) => s.replace(/^["«»""]+|["«»""]+$/g, "").trim()).filter((s) => s.length > 1);
	const unique = [];
	const seen = /* @__PURE__ */ new Set();
	for (const part of parts) {
		const key = normalizeSpoken(part);
		if (!key || seen.has(key)) continue;
		seen.add(key);
		unique.push(part);
	}
	return unique;
}
function isFaithfulToTranscript(line, transcript) {
	const n = normalizeSpoken(line);
	const t = normalizeSpoken(transcript);
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
	const n = normalizeSpoken(label);
	if (!n) return void 0;
	return characters.find((c) => normalizeSpoken(c.id) === n || normalizeSpoken(c.name || "") === n || normalizeSpoken(c.sourceName || "") === n || normalizeSpoken(c.designation) === n);
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
	return {
		language: args.language ?? null,
		source: utterances.length ? "transcript" : lines.length ? args.sourceHint ?? "visual-inference" : "unavailable",
		rawTranscript: args.transcript,
		lines: sealDialogueLines(lines, args.characters)
	};
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
//#endregion
export { swatchForCharacter as C, styleWeave as S, parseDialogueLine as _, dialogueCharCount as a, remapIdForType as b, enforceProductionDialogues as c, formatLockedDialogue as d, identityFingerprint as f, matchCharacter as g, lockCharactersSourceNames as h, attachDialogues as i, enforceProductionIdentity as l, labelCharacterType as m, applyLinesToScenes as n, emptyDialogueBible as o, identityParagraph as p, applyNameSubstitutionsToBible as r, emptyPerformance as s, applyDialogueEdits as t, fitDialoguesToScenes as u, parseSilentReaction as v, stableIdFor as x, reassignDialogueSpeaker as y };
