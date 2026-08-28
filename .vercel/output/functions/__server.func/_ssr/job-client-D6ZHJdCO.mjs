import { o as __toESM } from "../_runtime.mjs";
import { n as require_react } from "../_libs/@radix-ui/react-compose-refs+[...].mjs";
import { S as require_jsx_runtime } from "../_libs/@tanstack/react-router+[...].mjs";
import { a as cn } from "./store-CUNo2_1I.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/job-client-D6ZHJdCO.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
var Input = (0, import_react.forwardRef)(({ className, ...props }, ref) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
	ref,
	className: cn("flex h-11 w-full rounded-[var(--radius-md)] bg-[var(--bg-elevated)] px-3.5 text-sm text-[var(--fg)] shadow-[inset_0_0_0_1px_color-mix(in_oklab,var(--fg)_14%,transparent)] placeholder:text-[var(--fg-subtle)] transition-[box-shadow] duration-150 focus-visible:outline-none focus-visible:shadow-[inset_0_0_0_1px_var(--accent),0_0_0_3px_color-mix(in_oklab,var(--accent)_25%,transparent)] disabled:opacity-40", className),
	...props
}));
Input.displayName = "Input";
var Textarea = (0, import_react.forwardRef)(({ className, ...props }, ref) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("textarea", {
	ref,
	className: cn("min-h-28 w-full resize-y rounded-[var(--radius-lg)] bg-[var(--bg-elevated)] px-3.5 py-3 text-sm leading-relaxed text-[var(--fg)] shadow-[inset_0_0_0_1px_color-mix(in_oklab,var(--fg)_14%,transparent)] placeholder:text-[var(--fg-subtle)] transition-[box-shadow] duration-150 focus-visible:outline-none focus-visible:shadow-[inset_0_0_0_1px_var(--accent),0_0_0_3px_color-mix(in_oklab,var(--accent)_25%,transparent)] disabled:opacity-40", className),
	...props
}));
Textarea.displayName = "Textarea";
var JOB_TRANSPORT_MESSAGE = "L'analyse n'a pas pu aboutir. Réessayez.";
var JOB_MISSING_MESSAGE = "La session d'analyse n'est plus disponible. Relancez l'analyse.";
var KREIA_JOBS_PATH = "/kreia/jobs";
function messageFromHttpBody(body, status) {
	const trimmed = body.trim();
	if (!trimmed) return status === 404 ? JOB_MISSING_MESSAGE : JOB_TRANSPORT_MESSAGE;
	if (looksLikeHtml(trimmed)) return JOB_TRANSPORT_MESSAGE;
	try {
		const parsed = JSON.parse(trimmed);
		if (parsed && typeof parsed.error === "string" && parsed.error.trim()) {
			const err = parsed.error.trim();
			if (/introuvable/i.test(err) || err.startsWith("{")) return JOB_MISSING_MESSAGE;
			return err.slice(0, 220);
		}
	} catch {}
	if (/introuvable/i.test(trimmed) || trimmed.startsWith("{")) return JOB_MISSING_MESSAGE;
	if (status === 404) return JOB_MISSING_MESSAGE;
	if (status === 413) return "payload too large";
	return JOB_TRANSPORT_MESSAGE;
}
var JobTransportError = class extends Error {
	phase;
	constructor(message, phase) {
		super(message);
		this.name = "JobTransportError";
		this.phase = phase;
	}
};
function looksLikeHtml(text) {
	const t = text.trim().slice(0, 120).toLowerCase();
	return t.startsWith("<!doctype") || t.startsWith("<html") || t.includes("no-js ie") || t.includes("cloudflare");
}
function parseJobSnapshot(value) {
	if (!value || typeof value !== "object") throw new Error(JOB_TRANSPORT_MESSAGE);
	const rec = value;
	const status = rec.status;
	if (status !== "pending" && status !== "running" && status !== "ok" && status !== "error") throw new Error(JOB_TRANSPORT_MESSAGE);
	const id = typeof rec.id === "string" ? rec.id : "";
	if (!id) throw new Error(JOB_TRANSPORT_MESSAGE);
	const progress = rec.progress && typeof rec.progress === "object" ? rec.progress : void 0;
	return {
		id,
		status,
		result: rec.result,
		error: typeof rec.error === "string" ? rec.error : void 0,
		frameCount: typeof rec.frameCount === "number" ? rec.frameCount : void 0,
		progress
	};
}
function isPostTransportError(err) {
	return err instanceof JobTransportError && err.phase === "post";
}
function jpegPayload(dataUrl) {
	const i = dataUrl.indexOf("base64,");
	return i >= 0 ? dataUrl.slice(i + 7) : dataUrl;
}
/** Client-side helpers around TanStack Start server functions. */
var LOG = "[kreia]";
var TRANSPORT_MESSAGE = "L'analyse n'a pas pu aboutir. Réessayez.";
function logKreia(stage, detail) {
	if (detail === void 0) {
		console.info(LOG, stage);
		return;
	}
	console.info(LOG, stage, detail);
}
function logKreiaError(stage, err) {
	console.error(LOG, stage, err);
}
function errorText(err) {
	if (err instanceof Error) return err.message;
	if (typeof err === "string") return err;
	return "";
}
function isTransportError(err) {
	const lower = errorText(err).toLowerCase();
	if (!lower) return false;
	return lower.includes("failed to fetch") || lower.includes("networkerror") || lower.includes("load failed") || lower.includes("network request failed") || lower.includes("impossible de contacter") || lower.includes("n'a pas pu aboutir") || lower.includes("payload too large") || lower.includes("413") || lower.includes("<!doctype") || lower.includes("<html") || lower.includes("no-js ie") || lower.includes("cloudflare") || (lower.includes("cannot read properties of undefined") || lower.includes("cannot read property")) && lower.includes("ok");
}
function userFacingError(err, fallback) {
	const msg = errorText(err).trim();
	if (!msg) return fallback;
	const lower = msg.toLowerCase();
	if (isTransportError(err)) return TRANSPORT_MESSAGE;
	if (lower.includes("introuvable") || lower.includes("n'est plus disponible")) return "La session d'analyse n'est plus disponible. Relancez l'analyse.";
	if (lower.includes("aborted") || lower.includes("timeout") || lower.includes("timed out")) return "L'analyse a dépassé le délai imparti. Réessayez avec une vidéo plus courte.";
	if (lower.includes("invariant failed") || lower.includes("content-type header") || lower.includes("expected result to be resolved") || lower === "forbidden") return "L'analyse n'a pas pu être terminée. La réponse reçue est invalide. Veuillez réessayer.";
	return msg;
}
function isOkShape(value) {
	return Boolean(value) && typeof value === "object" && typeof value.ok === "boolean";
}
function summarizeRpc(value) {
	if (value == null) return value;
	if (typeof value !== "object") return String(value).slice(0, 220);
	const rec = value;
	return {
		keys: Object.keys(rec).slice(0, 12),
		ok: rec.ok,
		hasResult: "result" in rec,
		hasError: "error" in rec,
		resultOk: rec.result && typeof rec.result === "object" ? rec.result.ok : void 0
	};
}
function readServerResult(value, label) {
	if (value instanceof Error) {
		logKreiaError(`${label} RPC threw`, value);
		throw value;
	}
	if (value && typeof value === "object") {
		const rec = value;
		if (rec.error instanceof Error) {
			logKreiaError(`${label} RPC error field`, rec.error);
			throw rec.error;
		}
		if (typeof rec.error === "string" && rec.error.trim() && rec.result === void 0 && typeof rec.ok !== "boolean") {
			logKreiaError(`${label} RPC string error`, rec.error);
			throw new Error(rec.error);
		}
		if (isOkShape(rec.result)) return rec.result;
		if (isOkShape(rec)) return rec;
	}
	logKreiaError(`${label} empty RPC result`, summarizeRpc(value));
	throw new Error(TRANSPORT_MESSAGE);
}
function failMessage(result, fallback) {
	const text = (result?.error ?? result?.message ?? "").trim();
	if (!text) return fallback;
	const lower = text.toLowerCase();
	if (lower.startsWith("<!doctype") || lower.startsWith("<html") || lower.includes("no-js ie") || lower.includes("cloudflare") || lower.includes("introuvable") || lower.includes("n'est plus disponible") || lower.startsWith("{") && lower.includes("error")) return fallback;
	return text;
}
function fitAnalyzePayload(input) {
	let frames = input.frames.slice();
	let audioWavBase64 = input.audioWavBase64;
	let droppedAudio = false;
	const size = () => frames.reduce((n, f) => n + f.dataUrl.length, 0) + (audioWavBase64?.length ?? 0);
	if (size() > 38e4 && audioWavBase64) {
		audioWavBase64 = null;
		droppedAudio = true;
	}
	const startCount = frames.length;
	while (size() > 38e4 && frames.length > 2) {
		const idx = Math.min(frames.length - 2, Math.max(1, Math.floor(frames.length / 2)));
		frames = frames.filter((_, i) => i !== idx);
	}
	return {
		frames,
		audioWavBase64,
		droppedAudio,
		droppedFrames: startCount - frames.length
	};
}
var JOB_POLL_MS = 1200;
var JOB_WAIT_MS = 72e4;
function sleep(ms) {
	return new Promise((resolve) => setTimeout(resolve, ms));
}
function throwHttp(phase, status, body) {
	throw new JobTransportError(messageFromHttpBody(body, status), phase);
}
async function readSnapshot(res, phase) {
	const text = await res.text();
	if (!res.ok) throwHttp(phase, res.status, text);
	if (looksLikeHtml(text)) throw new JobTransportError(TRANSPORT_MESSAGE, phase);
	if (!text.trim()) throw new JobTransportError(TRANSPORT_MESSAGE, phase);
	let parsed;
	try {
		parsed = JSON.parse(text);
	} catch {
		throw new JobTransportError(TRANSPORT_MESSAGE, phase);
	}
	return parseJobSnapshot(parsed);
}
async function postOp(body) {
	let res;
	try {
		res = await fetch(KREIA_JOBS_PATH, {
			method: "POST",
			headers: {
				"content-type": "application/json",
				accept: "application/json"
			},
			body: JSON.stringify(body)
		});
	} catch (err) {
		throw new JobTransportError(userFacingError(err, TRANSPORT_MESSAGE), "post");
	}
	return readSnapshot(res, "post");
}
async function pollJob(id) {
	let lastErr;
	for (let attempt = 0; attempt < 8; attempt++) try {
		return await postOp({
			op: "poll",
			id
		});
	} catch (err) {
		lastErr = err;
		const msg = err instanceof Error ? err.message : "";
		if (!(/n'est plus disponible|introuvable/i.test(msg) || err instanceof JobTransportError && /session/i.test(err.message)) && attempt > 1) break;
		await sleep(400 * (attempt + 1));
	}
	if (lastErr instanceof JobTransportError) {
		lastErr.phase = "poll";
		throw lastErr;
	}
	throw new JobTransportError(lastErr instanceof Error ? lastErr.message : TRANSPORT_MESSAGE, "poll");
}
function snapshotToResult(snap) {
	if (snap.status === "ok") {
		const result = snap.result;
		if (result && typeof result === "object" && result.ok === true) return result;
		if (result && typeof result === "object" && result.ok === false) {
			const rec = result;
			return {
				ok: false,
				error: typeof rec.error === "string" ? rec.error : TRANSPORT_MESSAGE,
				checkpoint: rec.checkpoint,
				incomplete: rec.incomplete
			};
		}
		return {
			ok: false,
			error: TRANSPORT_MESSAGE
		};
	}
	if (snap.status === "error") {
		const result = snap.result;
		const rec = result && typeof result === "object" ? result : {};
		return {
			ok: false,
			error: snap.error || rec.error || "L'analyse n'a pas pu aboutir. Réessayez.",
			checkpoint: rec.checkpoint,
			incomplete: rec.incomplete
		};
	}
	return null;
}
async function waitForDone(created, startedAt, type, onProgress) {
	if (created.progress) onProgress?.(created.progress);
	const immediate = snapshotToResult(created);
	if (immediate) return immediate;
	logKreia("job:poll-start", {
		id: created.id,
		type
	});
	let lastPollErr;
	while (Date.now() - startedAt < JOB_WAIT_MS) {
		await sleep(JOB_POLL_MS);
		let snap;
		try {
			snap = await pollJob(created.id);
			lastPollErr = void 0;
		} catch (err) {
			lastPollErr = err;
			logKreiaError("job:poll", err);
			continue;
		}
		if (snap.progress) onProgress?.(snap.progress);
		const done = snapshotToResult(snap);
		if (done) {
			if (done.ok) logKreia("job:ok", {
				id: created.id,
				ms: Date.now() - startedAt
			});
			else logKreia("job:error", {
				id: created.id,
				error: done.error
			});
			return done;
		}
	}
	if (lastPollErr instanceof Error && lastPollErr.message.trim()) throw lastPollErr;
	throw new Error("L'analyse a dépassé le délai imparti. Réessayez avec une vidéo plus courte.");
}
async function runAnalyzeChunked(payload, startedAt, onProgress) {
	const created = await postOp({
		op: "create",
		type: "analyze"
	});
	logKreia("[ANALYSIS SESSION] Created", {
		id: created.id,
		frames: payload.frames.length
	});
	let uploaded = 0;
	for (const frame of payload.frames) try {
		await postOp({
			op: "frame",
			id: created.id,
			t: frame.t,
			jpeg: jpegPayload(frame.dataUrl)
		});
		uploaded += 1;
	} catch (err) {
		logKreiaError("job:frame", err);
	}
	if (!uploaded) throw new JobTransportError(TRANSPORT_MESSAGE, "post");
	for (const chunk of payload.audioChunks ?? []) try {
		await postOp({
			op: "audio",
			id: created.id,
			t: chunk.t,
			wav: chunk.wavBase64
		});
	} catch (err) {
		logKreiaError("job:audio-chunk", err);
		if (isPostTransportError(err)) break;
		throw err;
	}
	const meta = {
		durationSeconds: payload.durationSeconds,
		width: payload.width,
		height: payload.height,
		kind: payload.kind,
		userNotes: payload.userNotes,
		checkpoint: payload.checkpoint
	};
	const started = await postOp({
		op: "start",
		id: created.id,
		payload: meta
	});
	logKreia("job:started", {
		id: started.id,
		frames: started.frameCount
	});
	return waitForDone(started, startedAt, "analyze", onProgress);
}
async function runKreiaJob(type, payload, onProgress) {
	const startedAt = Date.now();
	logKreia("job:post", { type });
	if (type === "analyze" && payload && typeof payload === "object" && Array.isArray(payload.frames)) return runAnalyzeChunked(payload, startedAt, onProgress);
	return waitForDone(await postOp({
		op: "run",
		type,
		payload
	}), startedAt, type, onProgress);
}
//#endregion
export { isPostTransportError as a, readServerResult as c, fitAnalyzePayload as i, runKreiaJob as l, Textarea as n, logKreia as o, failMessage as r, logKreiaError as s, Input as t, userFacingError as u };
