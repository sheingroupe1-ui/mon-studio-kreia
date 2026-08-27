import { i as __toESM } from "../_runtime.mjs";
import { n as require_react } from "../_libs/@radix-ui/react-compose-refs+[...].mjs";
import { S as require_jsx_runtime, b as useNavigate } from "../_libs/@tanstack/react-router+[...].mjs";
import { b as Apple, d as Link, n as User, p as FileVideo, r as Upload, u as LoaderCircle } from "../_libs/lucide-react.mjs";
import { a as extractFrames, c as loadVideoElement, d as videoMetaFromElement, i as cn, l as toAnalysisFrames, n as Button, o as formatDuration, s as formatTimecode, t as AppShell, u as useKreia } from "./store-vNv43kSC.mjs";
import { c as logKreiaError, i as fitAnalyzePayload, l as probeVideoUrl, n as analyzeVideo, o as isTransportError, p as userFacingError, r as failMessage, s as logKreia, t as Textarea, u as readServerResult } from "./rpc-DQkZuZAN.mjs";
import { n as KIND_REGISTRY, r as MODE_REGISTRY, t as FUTURE_KINDS } from "./kinds-Cq3ES8qX.mjs";
import { n as toast } from "../_libs/sonner.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/new-BlDxHJWf.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
var Input = (0, import_react.forwardRef)(({ className, ...props }, ref) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
	ref,
	className: cn("flex h-11 w-full rounded-[var(--radius-md)] bg-[var(--bg-elevated)] px-3.5 text-sm text-[var(--fg)] shadow-[inset_0_0_0_1px_color-mix(in_oklab,var(--fg)_14%,transparent)] placeholder:text-[var(--fg-subtle)] transition-[box-shadow] duration-150 focus-visible:outline-none focus-visible:shadow-[inset_0_0_0_1px_var(--accent),0_0_0_3px_color-mix(in_oklab,var(--accent)_25%,transparent)] disabled:opacity-40", className),
	...props
}));
Input.displayName = "Input";
var MAX_SECONDS = 20;
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
function mixMono(audio, maxSeconds) {
	const length = Math.min(audio.length, Math.floor(audio.sampleRate * maxSeconds));
	const mono = new Float32Array(length);
	const channels = audio.numberOfChannels;
	for (let c = 0; c < channels; c += 1) {
		const data = audio.getChannelData(c);
		for (let i = 0; i < length; i += 1) mono[i] = (mono[i] ?? 0) + (data[i] ?? 0) / channels;
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
async function extractAudioWavBase64(file) {
	const ctx = new AudioContext();
	try {
		const data = await file.arrayBuffer();
		const decoded = await ctx.decodeAudioData(data.slice(0));
		if (decoded.duration < .4) return null;
		return bytesToBase64(writeWav(resample(mixMono(decoded, MAX_SECONDS), decoded.sampleRate, SAMPLE_RATE), SAMPLE_RATE));
	} catch {
		return null;
	} finally {
		await ctx.close().catch(() => void 0);
	}
}
var PHASES = [
	"Préparation de la vidéo",
	"Extraction des photogrammes",
	"Lecture de la piste audio",
	"Analyse narrative et visuelle"
];
function NewProject() {
	const navigate = useNavigate();
	const createDraft = useKreia((s) => s.createDraft);
	const setAnalysis = useKreia((s) => s.setAnalysis);
	const patchCurrent = useKreia((s) => s.patchCurrent);
	const fileRef = (0, import_react.useRef)(null);
	const [step, setStep] = (0, import_react.useState)(1);
	const [source, setSource] = (0, import_react.useState)("file");
	const [url, setUrl] = (0, import_react.useState)("");
	const [file, setFile] = (0, import_react.useState)(null);
	const [objectUrl, setObjectUrl] = (0, import_react.useState)(null);
	const [meta, setMeta] = (0, import_react.useState)(null);
	const [kind, setKind] = (0, import_react.useState)("human");
	const [mode, setMode] = (0, import_react.useState)("reconstruction");
	const [notes, setNotes] = (0, import_react.useState)("");
	const [busy, setBusy] = (0, import_react.useState)(false);
	const [phase, setPhase] = (0, import_react.useState)(null);
	const [frames, setFrames] = (0, import_react.useState)([]);
	const [error, setError] = (0, import_react.useState)(null);
	const [failed, setFailed] = (0, import_react.useState)(false);
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
	async function runAnalysis() {
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
		setBusy(true);
		setPhase(PHASES[0]);
		logKreia("analyze:start", {
			source: meta.source,
			file: meta.fileName,
			duration: meta.durationSeconds,
			size: file?.size ?? null
		});
		try {
			setPhase(PHASES[1]);
			const video = await loadVideoElement(objectUrl);
			const extracted = await extractFrames(video, () => void 0);
			setFrames(extracted);
			await new Promise((r) => window.setTimeout(r, 80));
			logKreia("analyze:frames", { count: extracted.length });
			if (extracted.length < 2) throw new Error("Pas assez d'images exploitables dans cette vidéo.");
			setPhase(PHASES[2]);
			const analysisFrames = await toAnalysisFrames(extracted);
			logKreia("analyze:rpc-frames", {
				count: analysisFrames.length,
				chars: analysisFrames.reduce((n, f) => n + f.dataUrl.length, 0)
			});
			let audioWavBase64 = null;
			const frameChars = analysisFrames.reduce((n, f) => n + f.dataUrl.length, 0);
			const skipAudio = !file || file.size > 8388608 || meta.durationSeconds > 28 || frameChars > 28e4;
			if (file && !skipAudio) try {
				audioWavBase64 = await extractAudioWavBase64(file);
			} catch (err) {
				logKreiaError("analyze:audio", err);
				audioWavBase64 = null;
			}
			else logKreia("analyze:audio-skipped", {
				fileSize: file?.size ?? null,
				duration: meta.durationSeconds,
				frameChars
			});
			logKreia("analyze:audio", {
				present: Boolean(audioWavBase64),
				chars: audioWavBase64?.length ?? 0
			});
			setPhase(PHASES[3]);
			const project = await createDraft({
				kind,
				mode,
				video: meta,
				frames: extracted,
				thumbnailDataUrl: extracted[0]?.dataUrl,
				userNotes: notes
			});
			async function sendAnalysis(frames, audio, label) {
				const fitted = fitAnalyzePayload({
					frames,
					audioWavBase64: audio
				});
				if (fitted.droppedAudio || fitted.droppedFrames) logKreia("analyze:payload-trimmed", {
					droppedAudio: fitted.droppedAudio,
					droppedFrames: fitted.droppedFrames,
					label
				});
				const payloadChars = fitted.frames.reduce((n, f) => n + f.dataUrl.length, 0) + (fitted.audioWavBase64?.length ?? 0);
				logKreia(label, {
					payloadChars,
					kind,
					mode,
					frames: fitted.frames.length
				});
				const resultRaw = await analyzeVideo({ data: {
					frames: fitted.frames,
					audioWavBase64: fitted.audioWavBase64,
					durationSeconds: meta.durationSeconds,
					width: meta.width,
					height: meta.height,
					kind,
					userNotes: notes
				} });
				logKreia("analyze:rpc-raw", {
					label,
					type: typeof resultRaw,
					isNull: resultRaw == null,
					keys: resultRaw && typeof resultRaw === "object" ? Object.keys(resultRaw).slice(0, 12) : []
				});
				return readServerResult(resultRaw, "analyzeVideo");
			}
			let result;
			try {
				result = await sendAnalysis(analysisFrames, audioWavBase64, "analyze:rpc");
			} catch (err) {
				if (!isTransportError(err)) throw err;
				logKreiaError("analyze:retry-compact", err);
				result = await sendAnalysis(await toAnalysisFrames(extracted, {
					maxFrames: 4,
					maxWidth: 384,
					quality: .34,
					maxChars: 36e3
				}), null, "analyze:rpc-retry");
			}
			logKreia("analyze:response", { ok: result.ok });
			if (!result.ok) {
				const message = failMessage(result, "L'analyse n'a pas pu être terminée. La réponse reçue est invalide. Veuillez réessayer.");
				await patchCurrent({
					status: "error",
					errorMessage: message
				});
				throw new Error(message);
			}
			if (!result.analysis) {
				logKreiaError("analyze:missing-analysis", result);
				throw new Error("L'analyse n'a pas pu être terminée. La réponse reçue est invalide. Veuillez réessayer.");
			}
			await setAnalysis(result.analysis);
			toast.success("Analyse prête à vérifier.");
			await navigate({
				to: "/projects/$id",
				params: { id: project.id }
			});
		} catch (err) {
			logKreiaError("analyze:failed", err);
			const message = userFacingError(err, "L'analyse a échoué. Aucun contenu n'a été inventé.");
			setFailed(true);
			try {
				await patchCurrent({
					status: "error",
					errorMessage: message
				});
			} catch {}
			setError(message);
			toast.error(message);
		} finally {
			runningRef.current = false;
			setBusy(false);
			setPhase(null);
		}
	}
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(AppShell, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "mx-auto max-w-3xl",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "text-[11px] font-medium uppercase tracking-[0.18em] text-[var(--champagne)]",
				children: "Nouveau projet"
			}),
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
								label: "Importer",
								icon: Upload
							},
							{
								id: "tiktok",
								label: "Lien TikTok",
								icon: Link
							},
							{
								id: "url",
								label: "Autre lien",
								icon: FileVideo
							}
						].map((item) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
							type: "button",
							onClick: () => setSource(item.id),
							className: cn("flex h-12 items-center justify-center gap-2 rounded-[var(--radius-md)] text-sm transition-colors duration-150", source === item.id ? "bg-[var(--accent-fill)] text-[var(--fg)] shadow-[inset_0_0_0_1px_color-mix(in_oklab,var(--accent)_40%,transparent)]" : "bg-[var(--bg-elevated)] text-[var(--fg-muted)]"),
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(item.icon, { className: "size-4" }), item.label]
						}, item.id))
					}),
					source === "file" ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						role: "button",
						tabIndex: 0,
						onClick: () => fileRef.current?.click(),
						onKeyDown: (e) => {
							if (e.key === "Enter" || e.key === " ") fileRef.current?.click();
						},
						onDragOver: (e) => e.preventDefault(),
						onDrop: (e) => {
							e.preventDefault();
							onPickFile(e.dataTransfer.files[0] ?? null);
						},
						className: "flex min-h-56 cursor-pointer flex-col items-center justify-center rounded-[28px] bg-[var(--bg-elevated)] px-6 py-14 text-center shadow-[var(--shadow-border)]",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Upload, { className: "size-7 text-[var(--accent)]" }),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "mt-3 font-display text-2xl",
								children: "Déposez la vidéo ici"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "mt-1 max-w-sm text-sm text-[var(--fg-muted)]",
								children: "MP4, WebM, MOV. Méthode prioritaire, la plus fiable."
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
								ref: fileRef,
								type: "file",
								accept: "video/*",
								hidden: true,
								onChange: (e) => void onPickFile(e.target.files?.[0] ?? null)
							})
						]
					}) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "rounded-[28px] bg-[var(--bg-elevated)] p-5 shadow-[var(--shadow-border)]",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("label", {
								className: "text-[11px] font-medium uppercase tracking-[0.14em] text-[var(--fg-subtle)]",
								children: source === "tiktok" ? "URL TikTok" : "URL vidéo"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "mt-2 flex flex-col gap-2 sm:flex-row",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
									value: url,
									onChange: (e) => setUrl(e.target.value),
									placeholder: source === "tiktok" ? "https://www.tiktok.com/@…/video/…" : "https://"
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
									type: "button",
									onClick: () => void onSubmitUrl(),
									disabled: busy,
									children: "Vérifier"
								})]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "mt-3 text-xs leading-relaxed text-[var(--fg-subtle)]",
								children: "Si la plateforme bloque l'accès, importez le fichier. KREIA n'invente jamais une analyse à partir d'un lien mort."
							})
						]
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
						className: "grid gap-3 sm:grid-cols-2",
						children: KIND_REGISTRY.map((item) => {
							const Icon = item.id === "human" ? User : Apple;
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
					})] })
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
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("dd", { children: MODE_REGISTRY.find((m) => m.id === mode)?.label })] })
							]
						})
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("label", {
						className: "text-[11px] font-medium uppercase tracking-[0.14em] text-[var(--fg-subtle)]",
						children: "Notes (optionnel)"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Textarea, {
						className: "mt-2",
						value: notes,
						onChange: (e) => setNotes(e.target.value),
						placeholder: "Ex. le personnage en bleu est son frère, pas son mari."
					})] }),
					frames.length ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "flex gap-2 overflow-x-auto",
						children: frames.map((f) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
							src: f.dataUrl,
							alt: formatTimecode(f.t),
							className: "h-16 w-28 rounded-[var(--radius-sm)] object-cover outline outline-1 -outline-offset-1 outline-white/10"
						}, f.t))
					}) : null,
					busy && phase ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
						className: "shimmer-text flex items-center gap-2 text-sm",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(LoaderCircle, { className: "size-4 animate-spin text-[var(--accent)]" }), phase]
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
					disabled: step === 1 || busy,
					onClick: () => setStep((s) => s === 1 ? 1 : s - 1),
					children: "Retour"
				}), step < 3 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
					type: "button",
					disabled: step === 1 && !canAnalyze,
					onClick: () => setStep((s) => s === 3 ? 3 : s + 1),
					children: "Continuer"
				}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
					type: "button",
					disabled: !canAnalyze || busy,
					onClick: () => void runAnalysis(),
					children: busy ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(LoaderCircle, { className: "size-4 animate-spin" }), "Analyse en cours…"] }) : failed ? "Réessayer l'analyse" : "Analyser la vidéo"
				})]
			})
		]
	}) });
}
//#endregion
export { NewProject as component };
