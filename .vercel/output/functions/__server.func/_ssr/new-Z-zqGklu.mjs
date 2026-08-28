import { o as __toESM } from "../_runtime.mjs";
import { n as require_react } from "../_libs/@radix-ui/react-compose-refs+[...].mjs";
import { S as require_jsx_runtime, b as useNavigate } from "../_libs/@tanstack/react-router+[...].mjs";
import { n as TSS_SERVER_FUNCTION, r as getServerFnById, t as createServerFn } from "./ssr.mjs";
import { r as createId } from "./ids-ckhly8rN.mjs";
import { n as progressAt } from "./analysis-stages-DZplH0Sn.mjs";
import { i as isBriefEmpty, n as emptyBrief, r as formatUserBrief } from "./user-brief-BwowZZX-.mjs";
import { t as VISUAL_STYLE_REGISTRY } from "./visual-styles-BkOrGZiu.mjs";
import { D as Apple, _ as FileVideo, a as Trash2, d as LoaderCircle, f as Link, n as User, p as Lightbulb, r as Upload, s as Plus, v as Feather, x as Clapperboard } from "../_libs/lucide-react.mjs";
import { a as useKreia, i as cn, n as Button, t as AppShell } from "./store-jieHu2MF.mjs";
import { a as fitAnalyzePayload, c as logKreiaError, d as userFacingError, i as failMessage, l as readServerResult, n as Input, o as isPostTransportError, r as Textarea, s as logKreia, t as AnalysisProgressView, u as runKreiaJob } from "./job-client-CQEEGWOt.mjs";
import { n as KIND_REGISTRY, r as MODE_REGISTRY, t as FUTURE_KINDS } from "./kinds-BdI3El3n.mjs";
import { n as toast } from "../_libs/sonner.mjs";
import { a as toAnalysisFrames, i as loadVideoElement, n as formatDuration, o as videoMetaFromElement, r as formatTimecode, t as extractFrames } from "./frames-hdJ0P3Qu.mjs";
import { i as DialogueBoard, n as CharacterCast } from "./dialogue-board-CbpxrFUT.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/new-Z-zqGklu.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
function UserBriefForm({ brief, onChange }) {
	function patch(partial) {
		onChange({
			...brief,
			...partial
		});
	}
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "space-y-5",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
					className: "font-display text-2xl",
					children: "Brief utilisateur"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "mt-1 text-sm text-[var(--fg-muted)]",
					children: "Facultatif — mais recommandé. Aidez KREIA à mieux comprendre votre vidéo."
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "mt-2 text-sm leading-relaxed text-[var(--fg-subtle)]",
					children: "Vous avez regardé la vidéo et vous pouvez déjà donner quelques informations. Décrivez ce que vous avez compris, les personnages remarqués ou les éléments à conserver. KREIA s'en sert comme contexte, pas comme remplacement de l'analyse."
				})
			] }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
				className: "block text-[11px] font-medium uppercase tracking-[0.14em] text-[var(--fg-subtle)]",
				children: ["Résumé de l'histoire", /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Textarea, {
					className: "mt-2",
					value: brief.story,
					onChange: (e) => patch({ story: e.target.value }),
					placeholder: "Résumez avec vos propres mots ce qui se passe dans la vidéo..."
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex items-center justify-between gap-2",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "text-[11px] font-medium uppercase tracking-[0.14em] text-[var(--fg-subtle)]",
						children: "Personnages déjà identifiés"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
						type: "button",
						variant: "outline",
						size: "sm",
						onClick: () => patch({ characters: [...brief.characters, {
							id: createId("hint"),
							name: "",
							description: ""
						}] }),
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Plus, { className: "size-3.5" }), "Ajouter un personnage"]
					})]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "mt-1 text-sm text-[var(--fg-muted)]",
					children: "Facultatif. KREIA cherchera aussi les autres."
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "mt-3 space-y-3",
					children: brief.characters.map((c, i) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "rounded-[20px] bg-[var(--bg-elevated)] p-4 shadow-[var(--shadow-border)]",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "flex items-center justify-between gap-2",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
									className: "font-mono text-[11px] tracking-wide text-[var(--accent)]",
									children: ["Personnage ", String(i + 1).padStart(2, "0")]
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
									type: "button",
									variant: "ghost",
									size: "sm",
									onClick: () => patch({ characters: brief.characters.filter((item) => item.id !== c.id) }),
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Trash2, { className: "size-3.5" }), "Retirer"]
								})]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
								className: "mt-3 block text-xs text-[var(--fg-subtle)]",
								children: ["Nom", /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
									className: "mt-1",
									value: c.name,
									placeholder: "Sarah",
									onChange: (e) => patch({ characters: brief.characters.map((item) => item.id === c.id ? {
										...item,
										name: e.target.value
									} : item) })
								})]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
								className: "mt-3 block text-xs text-[var(--fg-subtle)]",
								children: ["Description", /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Textarea, {
									className: "mt-1",
									value: c.description,
									placeholder: "Femme noire d'environ 30 ans, cheveux longs noirs, robe rouge.",
									onChange: (e) => patch({ characters: brief.characters.map((item) => item.id === c.id ? {
										...item,
										description: e.target.value
									} : item) })
								})]
							})
						]
					}, c.id))
				})
			] }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
				className: "block text-[11px] font-medium uppercase tracking-[0.14em] text-[var(--fg-subtle)]",
				children: ["Nombre de personnages remarqués", /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
					className: "mt-2",
					inputMode: "numeric",
					value: brief.expectedCount,
					onChange: (e) => patch({ expectedCount: e.target.value.replace(/[^\d]/g, "") }),
					placeholder: "3"
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
				className: "block text-[11px] font-medium uppercase tracking-[0.14em] text-[var(--fg-subtle)]",
				children: ["Éléments importants à conserver", /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Textarea, {
					className: "mt-2",
					value: brief.keep,
					onChange: (e) => patch({ keep: e.target.value }),
					placeholder: "Indiquez les éléments que KREIA doit absolument respecter..."
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
				className: "block text-[11px] font-medium uppercase tracking-[0.14em] text-[var(--fg-subtle)]",
				children: ["Précisions supplémentaires", /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Textarea, {
					className: "mt-2",
					value: brief.extra,
					onChange: (e) => patch({ extra: e.target.value }),
					placeholder: "Ajoutez toute autre information qui pourrait aider KREIA..."
				})]
			})
		]
	});
}
var SAMPLE_RATE = 16e3;
function writeWav(samples, sampleRate) {
	const n = samples.length;
	const buffer = /* @__PURE__ */ new ArrayBuffer(44 + n * 2);
	const view = new DataView(buffer);
	const ascii = (offset, text) => {
		for (let i = 0; i < text.length; i += 1) view.setUint8(offset + i, text.charCodeAt(i));
	};
	ascii(0, "RIFF");
	view.setUint32(4, 36 + n * 2, true);
	ascii(8, "WAVE");
	ascii(12, "fmt ");
	view.setUint32(16, 16, true);
	view.setUint16(20, 1, true);
	view.setUint16(22, 1, true);
	view.setUint32(24, sampleRate, true);
	view.setUint32(28, sampleRate * 2, true);
	view.setUint16(32, 2, true);
	view.setUint16(34, 16, true);
	ascii(36, "data");
	view.setUint32(40, n * 2, true);
	let offset = 44;
	for (let i = 0; i < n; i += 1) {
		const s = Math.max(-1, Math.min(1, samples[i] ?? 0));
		view.setInt16(offset, s < 0 ? s * 32768 : s * 32767, true);
		offset += 2;
	}
	return buffer;
}
function mixMonoRange(audio, startSec, endSec) {
	const start = Math.max(0, Math.floor(audio.sampleRate * startSec));
	const end = Math.min(audio.length, Math.floor(audio.sampleRate * endSec));
	const length = Math.max(0, end - start);
	const mono = new Float32Array(length);
	const channels = audio.numberOfChannels;
	for (let c = 0; c < channels; c += 1) {
		const data = audio.getChannelData(c);
		for (let i = 0; i < length; i += 1) mono[i] = (mono[i] ?? 0) + (data[start + i] ?? 0) / channels;
	}
	return mono;
}
function resample(input, fromRate, toRate) {
	if (fromRate === toRate) return input;
	const ratio = fromRate / toRate;
	const outLen = Math.max(1, Math.round(input.length / ratio));
	const out = new Float32Array(outLen);
	for (let i = 0; i < outLen; i += 1) {
		const src = i * ratio;
		const i0 = Math.floor(src);
		const i1 = Math.min(input.length - 1, i0 + 1);
		const t = src - i0;
		out[i] = (input[i0] ?? 0) * (1 - t) + (input[i1] ?? 0) * t;
	}
	return out;
}
function bytesToBase64(buffer) {
	const bytes = new Uint8Array(buffer);
	const chunk = 32768;
	let binary = "";
	for (let i = 0; i < bytes.length; i += chunk) binary += String.fromCharCode(...bytes.subarray(i, i + chunk));
	return btoa(binary);
}
function rms(samples) {
	if (!samples.length) return 0;
	let sum = 0;
	const step = Math.max(1, Math.floor(samples.length / 4e3));
	let n = 0;
	for (let i = 0; i < samples.length; i += step) {
		const v = samples[i] ?? 0;
		sum += v * v;
		n += 1;
	}
	return Math.sqrt(sum / Math.max(1, n));
}
async function extractAudioChunks(file, durationSeconds) {
	const ctx = new AudioContext();
	try {
		const data = await file.arrayBuffer();
		const decoded = await ctx.decodeAudioData(data.slice(0));
		if (decoded.duration < .4) return [];
		const total = Math.min(decoded.duration, Number.isFinite(durationSeconds) ? durationSeconds : decoded.duration);
		const chunkLen = 5;
		const count = Math.min(12, Math.max(1, Math.ceil(total / chunkLen)));
		const chunks = [];
		for (let i = 0; i < count; i += 1) {
			const start = i * chunkLen;
			if (start >= total - .2) break;
			const mono = mixMonoRange(decoded, start, Math.min(total, start + chunkLen));
			if (rms(mono) < .004) continue;
			const wav = writeWav(resample(mono, decoded.sampleRate, SAMPLE_RATE), SAMPLE_RATE);
			chunks.push({
				t: start,
				wavBase64: bytesToBase64(wav)
			});
		}
		return chunks;
	} catch {
		return [];
	} finally {
		await ctx.close().catch(() => void 0);
	}
}
var activeSession = null;
function emptyCheckpoint() {
	return {
		version: 1,
		completed: [],
		segments: [],
		analyzedSegmentCount: 0,
		incomplete: false
	};
}
async function runFullVideoAnalysis(input) {
	const session = createId("anl");
	activeSession = session;
	const report = (step, extra) => {
		if (activeSession !== session) return;
		input.onProgress(progressAt(step, extra));
	};
	try {
		report(1);
		console.info("[VIDEO VALIDATION] Starting", { session });
		console.info("[VIDEO VALIDATION] Source exists:", Boolean(input.objectUrl && input.meta));
		console.info("[VIDEO VALIDATION] Source type:", input.meta.source);
		if (!input.objectUrl || !input.meta) {
			console.error("[VIDEO VALIDATION ERROR]", {
				exactSubStep: "source",
				error: "missing source",
				session
			});
			return {
				ok: false,
				error: "Aucune vidéo sélectionnée. Veuillez importer une vidéo avant de lancer l'analyse."
			};
		}
		if (!Number.isFinite(input.meta.durationSeconds) || input.meta.durationSeconds <= 0) {
			console.error("[VIDEO VALIDATION ERROR]", {
				exactSubStep: "metadata",
				error: "invalid duration",
				session
			});
			return {
				ok: false,
				error: "La durée de la vidéo n'a pas pu être lue. Réimportez le fichier."
			};
		}
		console.info("[VIDEO VALIDATION] File accessible:", Boolean(input.file || input.objectUrl));
		console.info("[VIDEO VALIDATION] Metadata loading");
		let extracted = [];
		try {
			const video = await loadVideoElement(input.objectUrl);
			console.info("[VIDEO VALIDATION] Metadata loaded");
			console.info("[VIDEO VALIDATION] Duration:", input.meta.durationSeconds);
			extracted = await extractFrames(video, () => void 0);
			video.removeAttribute("src");
			video.load();
		} catch (err) {
			console.error("[VIDEO VALIDATION ERROR]", {
				exactSubStep: "load",
				error: err instanceof Error ? err.message : String(err),
				session,
				sourceType: input.meta.source,
				fileExists: Boolean(input.file)
			});
			return {
				ok: false,
				error: err instanceof Error ? err.message : "Impossible de lire cette vidéo. Vérifiez le fichier et réessayez."
			};
		}
		input.onFrames(extracted);
		logKreia("analyze:frames", {
			count: extracted.length,
			session
		});
		if (!extracted.length) {
			console.error("[VIDEO VALIDATION ERROR]", {
				exactSubStep: "frames",
				error: "no frames",
				session
			});
			return {
				ok: false,
				error: "Pas assez d'images exploitables dans cette vidéo."
			};
		}
		console.info("[VIDEO VALIDATION] Validation complete");
		const checkpoint = input.resume && input.checkpoint ? {
			...emptyCheckpoint(),
			...input.checkpoint,
			incomplete: false,
			userBrief: input.brief ?? input.checkpoint.userBrief
		} : {
			...emptyCheckpoint(),
			userBrief: input.brief
		};
		const formattedNotes = [formatUserBrief(input.brief), input.notes].filter(Boolean).join("\n");
		const analysisFrames = await toAnalysisFrames(extracted, { maxFrames: 12 });
		let audioChunks = [];
		if (input.file && !(input.resume && checkpoint.transcript)) try {
			audioChunks = await extractAudioChunks(input.file, input.meta.durationSeconds);
		} catch (err) {
			logKreiaError("analyze:audio", err);
			audioChunks = [];
		}
		let projectId = input.currentProjectId ?? "";
		if (!input.resume || !projectId) projectId = (await input.createDraft({
			kind: input.kind,
			mode: input.mode,
			video: input.meta,
			frames: extracted,
			thumbnailDataUrl: extracted[0]?.dataUrl,
			userNotes: formattedNotes,
			userBrief: input.brief
		})).id;
		const send = (frames, chunks) => {
			const fitted = fitAnalyzePayload({
				frames,
				audioWavBase64: null
			});
			return runKreiaJob("analyze", {
				frames: fitted.frames,
				audioChunks: chunks,
				durationSeconds: input.meta.durationSeconds,
				width: input.meta.width,
				height: input.meta.height,
				kind: input.kind,
				mode: input.mode,
				userNotes: formattedNotes,
				userBrief: input.brief,
				chosenStyleId: input.chosenStyleId,
				chosenStyleText: input.chosenStyleText,
				checkpoint
			}, (p) => {
				if (activeSession !== session) return;
				input.onProgress(p);
			});
		};
		let result;
		try {
			result = await send(analysisFrames, audioChunks);
		} catch (err) {
			if (!isPostTransportError(err)) throw err;
			logKreiaError("analyze:retry-compact-post", err);
			result = await send(await toAnalysisFrames(extracted, {
				maxFrames: 2,
				maxWidth: 256,
				quality: .24,
				maxChars: 14e3
			}), audioChunks.slice(0, 1));
		}
		if (activeSession !== session) return {
			ok: false,
			error: "L'analyse a été remplacée par une nouvelle session."
		};
		if (!result.ok) return {
			ok: false,
			error: result.error || "Échec d'analyse (sans message).",
			checkpoint: result.checkpoint,
			incomplete: result.incomplete
		};
		if (result.awaitingCastReview) return {
			ok: true,
			awaitingCastReview: true,
			projectId,
			checkpoint: result.checkpoint ?? checkpoint ?? emptyCheckpoint(),
			characters: result.characters ?? result.checkpoint?.characters ?? []
		};
		if (result.awaitingDialogueReview) {
			const analysis = result.analysis ?? result.checkpoint?.analysis;
			if (!analysis) return {
				ok: false,
				error: "Les dialogues n'ont pas pu être préparés pour validation.",
				checkpoint: result.checkpoint
			};
			return {
				ok: true,
				awaitingDialogueReview: true,
				projectId,
				checkpoint: result.checkpoint ?? checkpoint ?? emptyCheckpoint(),
				analysis
			};
		}
		if (!result.analysis) return {
			ok: false,
			error: "L'analyse n'a pas pu être terminée. La réponse reçue est invalide. Veuillez réessayer.",
			checkpoint: result.checkpoint
		};
		return {
			ok: true,
			analysis: result.analysis,
			production: result.production,
			projectId
		};
	} catch (err) {
		logKreiaError("analyze:orchestrator", err);
		return {
			ok: false,
			error: err instanceof Error && err.message.trim() ? err.message : "L'analyse a échoué. Aucun contenu n'a été inventé."
		};
	} finally {
		if (activeSession === session) activeSession = null;
	}
}
var createSsrRpc = (functionId) => {
	const url = "/_serverFn/" + functionId;
	const serverFnMeta = { id: functionId };
	const fn = async (...args) => {
		return (await getServerFnById(functionId, { origin: "server" }))(...args);
	};
	return Object.assign(fn, {
		url,
		serverFnMeta,
		[TSS_SERVER_FUNCTION]: true
	});
};
createServerFn({ method: "GET" }).handler(createSsrRpc("68e121ddd88b9bb75a31f03876ea2201702cd0929c1824b2eea072181dc5409e"));
var probeVideoUrl = createServerFn({ method: "POST" }).validator((input) => input).handler(createSsrRpc("2c9e0efd825c3cfc42bb33ba0a2c2c38d16b972cd2738d6bcd5a9f235f1794fa"));
createServerFn({ method: "POST" }).validator((input) => input).handler(createSsrRpc("d7a2a55277debbccd2a6e433903c8474f5ab433e414f59cdc62f39185b188c7a"));
createServerFn({ method: "POST" }).validator((input) => input).handler(createSsrRpc("d692495fddea21eccdb7e7ba7b37d5471320af0bc9a833e48f3a9cbc3c883458"));
createServerFn({ method: "POST" }).validator((input) => input).handler(createSsrRpc("2742d6b640efda8a639b4709a114d1e91b44445a48de2dee31b1e13947999e80"));
createServerFn({ method: "POST" }).validator((input) => input).handler(createSsrRpc("d3cda9f74722bfabb87c80a99410b35e7e3b7a36d4dee4e8a9908d3d431de242"));
function NewProject() {
	const navigate = useNavigate();
	const createDraft = useKreia((s) => s.createDraft);
	const setAnalysis = useKreia((s) => s.setAnalysis);
	const setProduction = useKreia((s) => s.setProduction);
	const patchCurrent = useKreia((s) => s.patchCurrent);
	const fileRef = (0, import_react.useRef)(null);
	const [step, setStep] = (0, import_react.useState)(1);
	const [flow, setFlow] = (0, import_react.useState)("pick");
	const [source, setSource] = (0, import_react.useState)("file");
	const [url, setUrl] = (0, import_react.useState)("");
	const [file, setFile] = (0, import_react.useState)(null);
	const [objectUrl, setObjectUrl] = (0, import_react.useState)(null);
	const [meta, setMeta] = (0, import_react.useState)(null);
	const [kind, setKind] = (0, import_react.useState)("human");
	const [mode, setMode] = (0, import_react.useState)("reconstruction");
	const [styleId, setStyleId] = (0, import_react.useState)(null);
	const [styleText, setStyleText] = (0, import_react.useState)("");
	const [brief, setBrief] = (0, import_react.useState)(emptyBrief());
	const [busy, setBusy] = (0, import_react.useState)(false);
	const [progress, setProgress] = (0, import_react.useState)(null);
	const [frames, setFrames] = (0, import_react.useState)([]);
	const [error, setError] = (0, import_react.useState)(null);
	const [failed, setFailed] = (0, import_react.useState)(false);
	const [incomplete, setIncomplete] = (0, import_react.useState)(false);
	const [checkpoint, setCheckpoint] = (0, import_react.useState)(null);
	const [reviewingCast, setReviewingCast] = (0, import_react.useState)(false);
	const [reviewingDialogues, setReviewingDialogues] = (0, import_react.useState)(false);
	const [cast, setCast] = (0, import_react.useState)([]);
	const [reviewAnalysis, setReviewAnalysis] = (0, import_react.useState)(null);
	const [reviewProjectId, setReviewProjectId] = (0, import_react.useState)(null);
	const runningRef = (0, import_react.useRef)(false);
	const canAnalyze = Boolean(meta && objectUrl);
	const sourceLabel = (0, import_react.useMemo)(() => {
		if (file) return file.name;
		if (url.trim()) return url.trim();
		return null;
	}, [file, url]);
	function resetVideo() {
		if (objectUrl) URL.revokeObjectURL(objectUrl);
		setObjectUrl(null);
		setFile(null);
		setMeta(null);
		setFrames([]);
	}
	async function onPickFile(next) {
		setError(null);
		if (!next) return;
		if (!next.type.startsWith("video/")) {
			setError("Ce fichier n'est pas une vidéo compatible.");
			return;
		}
		if (next.size > 146800640) {
			setError("Cette vidéo est trop volumineuse (limite 140 Mo). Compressez-la puis réessayez.");
			return;
		}
		resetVideo();
		const src = URL.createObjectURL(next);
		try {
			const video = await loadVideoElement(src);
			setFile(next);
			setObjectUrl(src);
			setMeta(videoMetaFromElement(video, next.name, "file"));
			video.removeAttribute("src");
			video.load();
		} catch (err) {
			URL.revokeObjectURL(src);
			setError(err instanceof Error ? err.message : "Impossible de lire cette vidéo.");
		}
	}
	async function onSubmitUrl() {
		setError(null);
		const trimmed = url.trim();
		if (!trimmed) {
			setError("Collez un lien vidéo.");
			return;
		}
		logKreia("probe:start", {
			source,
			url: trimmed.slice(0, 180)
		});
		setBusy(true);
		try {
			const probeRaw = await probeVideoUrl({ data: { url: trimmed } });
			const probe = readServerResult(probeRaw, "probeVideoUrl");
			if (!probe.ok) {
				logKreia("probe:rejected", probe);
				setError(failMessage(probe, "Cette vidéo ne peut pas être récupérée directement depuis ce lien. Veuillez importer la vidéo."));
				return;
			}
			resetVideo();
			try {
				const video = await loadVideoElement(trimmed);
				setObjectUrl(trimmed);
				setMeta(videoMetaFromElement(video, trimmed.split("/").pop() || "video", source === "tiktok" ? "tiktok" : "url", trimmed));
				logKreia("probe:video-loaded");
			} catch (err) {
				logKreiaError("probe:video-load", err);
				setError("Cette vidéo ne peut pas être analysée directement depuis ce lien. Veuillez importer la vidéo.");
			}
		} catch (err) {
			logKreiaError("probe:failed", err);
			setError(userFacingError(err, "Cette vidéo ne peut pas être récupérée directement depuis ce lien. Veuillez importer la vidéo."));
		} finally {
			setBusy(false);
		}
	}
	async function runAnalysis(opts) {
		if (runningRef.current) return;
		if (!meta || !objectUrl) {
			const message = "Aucune vidéo sélectionnée. Veuillez importer une vidéo avant de lancer l'analyse.";
			setFailed(true);
			setError(message);
			toast.error(message);
			return;
		}
		runningRef.current = true;
		setError(null);
		setFailed(false);
		setIncomplete(false);
		setBusy(true);
		setProgress(progressAt(1));
		try {
			const result = await runFullVideoAnalysis({
				meta,
				objectUrl,
				file,
				kind,
				mode,
				notes: "",
				brief,
				chosenStyleId: styleId ?? void 0,
				chosenStyleText: styleId === "custom" ? styleText : void 0,
				resume: opts?.resume,
				checkpoint: opts?.checkpoint ?? checkpoint,
				onProgress: setProgress,
				onFrames: setFrames,
				createDraft,
				currentProjectId: reviewProjectId ?? useKreia.getState().current?.id ?? null
			});
			if (!result.ok) {
				if (result.checkpoint) setCheckpoint(result.checkpoint);
				setIncomplete(Boolean(result.incomplete && result.checkpoint));
				await patchCurrent({
					status: result.incomplete ? "incomplete" : "error",
					errorMessage: result.error,
					analysisCheckpoint: result.checkpoint,
					analysisIncomplete: Boolean(result.incomplete)
				});
				throw new Error(result.error);
			}
			if ("awaitingCastReview" in result && result.awaitingCastReview) {
				setCheckpoint(result.checkpoint);
				setCast(result.characters);
				setReviewingCast(true);
				setReviewProjectId(result.projectId);
				setProgress(progressAt(3));
				await patchCurrent({
					status: "analyzing",
					analysisCheckpoint: result.checkpoint
				});
				toast.message("Vérifiez les personnages avant de continuer.");
				return;
			}
			if ("awaitingDialogueReview" in result && result.awaitingDialogueReview) {
				setCheckpoint(result.checkpoint);
				setReviewAnalysis(result.analysis);
				setReviewingDialogues(true);
				setReviewProjectId(result.projectId);
				setProgress(progressAt(6));
				await patchCurrent({
					status: "analyzing",
					analysis: result.analysis,
					analysisCheckpoint: result.checkpoint
				});
				toast.message("Vérifiez les dialogues avant de générer les prompts.");
				return;
			}
			if (!("analysis" in result) || !result.analysis) throw new Error("L'analyse n'a pas pu être terminée. La réponse reçue est invalide. Veuillez réessayer.");
			await setAnalysis(result.analysis);
			const production = "production" in result ? result.production : void 0;
			if (production) await setProduction(production);
			toast.success(production ? "Prompts prêts à copier." : "Analyse prête à vérifier.");
			await navigate({
				to: "/projects/$id",
				params: { id: result.projectId }
			});
		} catch (err) {
			logKreiaError("analyze:failed", err);
			const message = userFacingError(err, "L'analyse a échoué. Aucun contenu n'a été inventé.");
			setFailed(true);
			setError(message);
			toast.error(message);
		} finally {
			runningRef.current = false;
			setBusy(false);
		}
	}
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(AppShell, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "mx-auto max-w-3xl",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
			className: "text-[11px] font-medium uppercase tracking-[0.18em] text-[var(--champagne)]",
			children: "Nouveau projet"
		}), flow === "pick" ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
				className: "mt-2 font-display text-4xl tracking-[-0.03em] sm:text-5xl",
				children: "Comment voulez-vous commencer ?"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "mt-2 text-sm text-[var(--fg-muted)]",
				children: "Deux chemins, même résultat : un projet prêt à générer."
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "mt-8 grid gap-3 sm:grid-cols-2",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
					type: "button",
					onClick: () => setFlow("video"),
					className: "rounded-[24px] bg-[var(--bg-elevated)] p-6 text-left shadow-[var(--shadow-border)]",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Clapperboard, { className: "size-5" }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
							className: "mt-4 font-display text-2xl",
							children: "Reconstruire une vidéo"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "mt-2 text-sm leading-relaxed text-[var(--fg-muted)]",
							children: "Importez une vidéo de référence. KREIA analyse sa structure pour reconstruire le projet."
						})
					]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
					type: "button",
					onClick: () => void navigate({ to: "/idea" }),
					className: "rounded-[24px] bg-[var(--bg-elevated)] p-6 text-left shadow-[var(--shadow-border)]",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Lightbulb, { className: "size-5" }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
							className: "mt-4 font-display text-2xl",
							children: "Partir d'une idée"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "mt-2 text-sm leading-relaxed text-[var(--fg-muted)]",
							children: "Décrivez votre histoire. KREIA construit le projet de A à Z, sans vidéo."
						})
					]
				})]
			})
		] }) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("h1", {
				className: "mt-2 font-display text-4xl tracking-[-0.03em] sm:text-5xl",
				children: [
					step === 1 && "Ajouter la vidéo",
					step === 2 && "Type de reconstruction",
					step === 3 && "Lancer l'analyse"
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
				className: "mt-2 text-sm text-[var(--fg-muted)]",
				children: [
					"Étape ",
					step,
					" / 3"
				]
			}),
			step === 1 ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "mt-8 space-y-4",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "grid gap-2 sm:grid-cols-3",
						children: [
							{
								id: "file",
								label: "Fichier",
								Icon: Upload
							},
							{
								id: "tiktok",
								label: "TikTok",
								Icon: FileVideo
							},
							{
								id: "url",
								label: "Lien",
								Icon: Link
							}
						].map((item) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
							type: "button",
							onClick: () => setSource(item.id),
							className: cn("rounded-[20px] px-4 py-3 text-left shadow-[var(--shadow-border)]", source === item.id ? "bg-[var(--accent-fill)]" : "bg-[var(--bg-elevated)]"),
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(item.Icon, { className: "size-4" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "mt-2 text-sm font-medium",
								children: item.label
							})]
						}, item.id))
					}),
					source === "file" ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "rounded-[24px] bg-[var(--bg-elevated)] p-5 shadow-[var(--shadow-border)]",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
								ref: fileRef,
								type: "file",
								accept: "video/*",
								className: "hidden",
								onChange: (e) => void onPickFile(e.target.files?.[0] ?? null)
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
								type: "button",
								onClick: () => fileRef.current?.click(),
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Upload, { className: "size-4" }), "Importer une vidéo"]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "mt-3 text-xs text-[var(--fg-subtle)]",
								children: "MP4 ou WebM, jusqu'à 140 Mo. L'analyse reste sur cet appareil."
							})
						]
					}) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "rounded-[24px] bg-[var(--bg-elevated)] p-5 shadow-[var(--shadow-border)]",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex gap-2",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
								value: url,
								onChange: (e) => setUrl(e.target.value),
								placeholder: "https://"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
								type: "button",
								onClick: () => void onSubmitUrl(),
								disabled: busy,
								children: "Vérifier"
							})]
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "mt-3 text-xs leading-relaxed text-[var(--fg-subtle)]",
							children: "Si la plateforme bloque l'accès, importez le fichier. KREIA n'invente jamais une analyse à partir d'un lien mort."
						})]
					}),
					meta ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex items-center justify-between gap-3 rounded-[20px] bg-[var(--bg-subtle)] px-4 py-3 text-sm",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "min-w-0",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "truncate text-[var(--fg)]",
								children: sourceLabel
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
								className: "text-[var(--fg-subtle)]",
								children: [
									formatDuration(meta.durationSeconds),
									" · ",
									meta.width,
									"×",
									meta.height
								]
							})]
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
							variant: "ghost",
							size: "sm",
							onClick: resetVideo,
							children: "Retirer"
						})]
					}) : null
				]
			}) : null,
			step === 2 ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "mt-8 space-y-8",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "grid gap-3 sm:grid-cols-3",
						children: KIND_REGISTRY.map((item) => {
							const Icon = item.id === "human" ? User : item.id === "angel" ? Feather : Apple;
							const selected = kind === item.id;
							return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
								type: "button",
								onClick: () => setKind(item.id),
								className: cn("rounded-[24px] p-5 text-left shadow-[var(--shadow-border)] transition-colors duration-150", selected ? "bg-[var(--accent-fill)] text-[var(--fg)] shadow-[inset_0_0_0_1px_color-mix(in_oklab,var(--accent)_40%,transparent)]" : "bg-[var(--bg-elevated)] text-[var(--fg)]"),
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Icon, { className: "size-5" }),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
										className: "mt-3 font-display text-2xl",
										children: item.label
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
										className: cn("mt-2 text-sm leading-relaxed", selected ? "text-[var(--accent)]" : "text-[var(--fg-muted)]"),
										children: item.description
									})
								]
							}, item.id);
						})
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
						className: "text-xs text-[var(--fg-subtle)]",
						children: [
							"Plus tard : ",
							FUTURE_KINDS.join(" · "),
							"."
						]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
						className: "font-display text-2xl",
						children: "Niveau de reconstruction"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "mt-3 grid gap-3",
						children: MODE_REGISTRY.map((item) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
							type: "button",
							onClick: () => setMode(item.id),
							className: cn("rounded-[20px] px-4 py-4 text-left shadow-[var(--shadow-border)]", mode === item.id ? "bg-[var(--accent-fill)] shadow-[inset_0_0_0_1px_color-mix(in_oklab,var(--accent)_40%,transparent)]" : "bg-[var(--bg-elevated)]"),
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "text-sm font-medium",
								children: item.label
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "mt-1 text-sm text-[var(--fg-muted)]",
								children: item.description
							})]
						}, item.id))
					})] }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(UserBriefForm, {
						brief,
						onChange: setBrief
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
							className: "font-display text-2xl",
							children: "Style visuel"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "mt-1 text-sm text-[var(--fg-muted)]",
							children: "Choisissez le rendu des prompts. Il n'est plus détecté automatiquement."
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "mt-3 grid gap-2 sm:grid-cols-2",
							children: VISUAL_STYLE_REGISTRY.map((item) => {
								const selected = styleId === item.id;
								return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
									type: "button",
									onClick: () => setStyleId(item.id),
									className: cn("rounded-[20px] px-4 py-4 text-left shadow-[var(--shadow-border)]", selected ? "bg-[var(--accent-fill)] shadow-[inset_0_0_0_1px_color-mix(in_oklab,var(--accent)_40%,transparent)]" : "bg-[var(--bg-elevated)]"),
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
										className: "text-sm font-medium",
										children: item.label
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
										className: "mt-1 text-sm text-[var(--fg-muted)]",
										children: item.description
									})]
								}, item.id);
							})
						}),
						styleId === "custom" ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "mt-3",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("label", {
								className: "text-[11px] font-medium uppercase tracking-[0.14em] text-[var(--fg-subtle)]",
								children: "Décrivez le style"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Textarea, {
								className: "mt-2",
								value: styleText,
								onChange: (e) => setStyleText(e.target.value),
								placeholder: "Ex. 3D cartoon satiné, lumière chaude, textures de velours, caméra douce."
							})]
						}) : null
					] })
				]
			}) : null,
			step === 3 ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "mt-8 space-y-5",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "rounded-[24px] bg-[var(--bg-elevated)] p-5 shadow-[var(--shadow-border)]",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("dl", {
							className: "grid gap-3 text-sm sm:grid-cols-2",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("dt", {
									className: "text-[var(--fg-subtle)]",
									children: "Source"
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("dd", {
									className: "truncate",
									children: sourceLabel
								})] }),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("dt", {
									className: "text-[var(--fg-subtle)]",
									children: "Durée"
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("dd", { children: meta ? formatDuration(meta.durationSeconds) : "—" })] }),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("dt", {
									className: "text-[var(--fg-subtle)]",
									children: "Type"
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("dd", { children: KIND_REGISTRY.find((k) => k.id === kind)?.label })] }),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("dt", {
									className: "text-[var(--fg-subtle)]",
									children: "Mode"
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("dd", { children: MODE_REGISTRY.find((m) => m.id === mode)?.label })] }),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("dt", {
									className: "text-[var(--fg-subtle)]",
									children: "Style visuel"
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("dd", { children: styleId === "custom" ? styleText.trim() || "Personnalisé" : VISUAL_STYLE_REGISTRY.find((s) => s.id === styleId)?.label ?? "—" })] }),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("dt", {
									className: "text-[var(--fg-subtle)]",
									children: "Brief"
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("dd", { children: isBriefEmpty(brief) ? "Aucun" : "Renseigné" })] })
							]
						})
					}),
					frames.length ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "flex gap-2 overflow-x-auto",
						children: frames.map((f) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
							src: f.dataUrl,
							alt: formatTimecode(f.t),
							className: "h-16 w-28 rounded-[var(--radius-sm)] object-cover outline outline-1 -outline-offset-1 outline-white/10"
						}, f.t))
					}) : null,
					progress && !reviewingCast && !reviewingDialogues ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(AnalysisProgressView, { progress }) : null,
					reviewingCast ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "rounded-[24px] bg-[var(--bg-elevated)] p-5 shadow-[var(--shadow-border)]",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CharacterCast, {
							characters: cast,
							kind,
							warnings: checkpoint?.limitations,
							validating: busy,
							onChange: setCast,
							onRerun: () => {
								const next = {
									...checkpoint ?? {
										version: 1,
										completed: [],
										segments: [],
										analyzedSegmentCount: 0,
										incomplete: false
									},
									version: 1,
									completed: (checkpoint?.completed ?? []).filter((s) => s !== "cast"),
									characters: [],
									castValidated: false,
									incomplete: false
								};
								setReviewingCast(false);
								setCheckpoint(next);
								runAnalysis({
									resume: true,
									checkpoint: next
								});
							},
							onValidate: () => {
								const next = {
									...checkpoint ?? {
										version: 1,
										completed: ["cast"],
										segments: [],
										analyzedSegmentCount: 0,
										incomplete: false
									},
									version: 1,
									characters: cast,
									castValidated: true,
									incomplete: false
								};
								setCheckpoint(next);
								setReviewingCast(false);
								runAnalysis({
									resume: true,
									checkpoint: next
								});
							}
						})
					}) : null,
					reviewingDialogues && reviewAnalysis ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "rounded-[24px] bg-[var(--bg-elevated)] p-5 shadow-[var(--shadow-border)]",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogueBoard, {
							analysis: reviewAnalysis,
							validating: busy,
							onChange: setReviewAnalysis,
							onValidate: () => {
								const nextAnalysis = reviewAnalysis;
								const next = {
									...checkpoint ?? {
										version: 1,
										completed: ["narrative"],
										segments: [],
										analyzedSegmentCount: 0,
										incomplete: false
									},
									version: 1,
									analysis: nextAnalysis,
									dialoguesValidated: true,
									incomplete: false
								};
								setCheckpoint(next);
								setReviewingDialogues(false);
								runAnalysis({
									resume: true,
									checkpoint: next
								});
							}
						})
					}) : null
				]
			}) : null,
			error ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "mt-5 rounded-[var(--radius-md)] bg-[color-mix(in_oklab,var(--color-danger)_14%,transparent)] px-4 py-3 text-sm text-[#f3c7bf]",
				children: error
			}) : null,
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "mt-8 flex flex-wrap items-center justify-between gap-3",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
					type: "button",
					variant: "ghost",
					disabled: busy,
					onClick: () => {
						if (step === 1) setFlow("pick");
						else setStep((s) => s === 1 ? 1 : s - 1);
					},
					children: "Retour"
				}), step < 3 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
					type: "button",
					disabled: step === 1 && !canAnalyze || step === 2 && (!styleId || styleId === "custom" && !styleText.trim()),
					onClick: () => setStep((s) => s === 3 ? 3 : s + 1),
					children: "Continuer"
				}) : reviewingCast ? null : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex flex-wrap gap-2",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
						type: "button",
						disabled: !canAnalyze || busy,
						onClick: () => void runAnalysis(),
						children: busy ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(LoaderCircle, { className: "size-4 animate-spin" }), "Analyse en cours…"] }) : incomplete ? "Recommencer l'analyse" : failed ? "Réessayer l'analyse" : "Analyser la vidéo"
					}), incomplete && checkpoint && !busy ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
						type: "button",
						variant: "outline",
						disabled: !canAnalyze,
						onClick: () => void runAnalysis({ resume: true }),
						children: "Reprendre l'analyse"
					}) : null]
				})]
			})
		] })]
	}) });
}
//#endregion
export { NewProject as component };
