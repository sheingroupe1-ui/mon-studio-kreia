import { i as __toESM } from "../_runtime.mjs";
import { n as require_react } from "../_libs/@radix-ui/react-compose-refs+[...].mjs";
import { S as require_jsx_runtime } from "../_libs/@tanstack/react-router+[...].mjs";
import { n as createServerFn, r as getServerFnById, t as TSS_SERVER_FUNCTION } from "./ssr.mjs";
import { i as cn } from "./store-vNv43kSC.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/rpc-DQkZuZAN.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
var Textarea = (0, import_react.forwardRef)(({ className, ...props }, ref) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("textarea", {
	ref,
	className: cn("min-h-28 w-full resize-y rounded-[var(--radius-lg)] bg-[var(--bg-elevated)] px-3.5 py-3 text-sm leading-relaxed text-[var(--fg)] shadow-[inset_0_0_0_1px_color-mix(in_oklab,var(--fg)_14%,transparent)] placeholder:text-[var(--fg-subtle)] transition-[box-shadow] duration-150 focus-visible:outline-none focus-visible:shadow-[inset_0_0_0_1px_var(--accent),0_0_0_3px_color-mix(in_oklab,var(--accent)_25%,transparent)] disabled:opacity-40", className),
	...props
}));
Textarea.displayName = "Textarea";
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
var analyzeVideo = createServerFn({ method: "POST" }).validator((input) => input).handler(createSsrRpc("d7a2a55277debbccd2a6e433903c8474f5ab433e414f59cdc62f39185b188c7a"));
var reviseAnalysis = createServerFn({ method: "POST" }).validator((input) => input).handler(createSsrRpc("d692495fddea21eccdb7e7ba7b37d5471320af0bc9a833e48f3a9cbc3c883458"));
var generateProduction = createServerFn({ method: "POST" }).validator((input) => input).handler(createSsrRpc("2742d6b640efda8a639b4709a114d1e91b44445a48de2dee31b1e13947999e80"));
var reviseProduction = createServerFn({ method: "POST" }).validator((input) => input).handler(createSsrRpc("d3cda9f74722bfabb87c80a99410b35e7e3b7a36d4dee4e8a9908d3d431de242"));
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
	return lower.includes("failed to fetch") || lower.includes("networkerror") || lower.includes("load failed") || lower.includes("network request failed") || lower.includes("impossible de contacter") || lower.includes("n'a pas pu aboutir") || lower.includes("payload too large") || lower.includes("413") || (lower.includes("cannot read properties of undefined") || lower.includes("cannot read property")) && lower.includes("ok");
}
function userFacingError(err, fallback) {
	const msg = errorText(err).trim();
	if (!msg) return fallback;
	const lower = msg.toLowerCase();
	if (isTransportError(err)) return TRANSPORT_MESSAGE;
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
	return (result?.error ?? result?.message ?? "").trim() || fallback;
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
//#endregion
export { generateProduction as a, logKreiaError as c, reviseAnalysis as d, reviseProduction as f, fitAnalyzePayload as i, probeVideoUrl as l, analyzeVideo as n, isTransportError as o, userFacingError as p, failMessage as r, logKreia as s, Textarea as t, readServerResult as u };
