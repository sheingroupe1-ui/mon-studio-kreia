import { n as TSS_SERVER_FUNCTION, t as createServerFn } from "./ssr.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/ai-mpCkmgQh.js
var createServerRpc = (serverFnMeta, splitImportFn) => {
	const url = "/_serverFn/" + serverFnMeta.id;
	return Object.assign(splitImportFn, {
		url,
		serverFnMeta,
		[TSS_SERVER_FUNCTION]: true
	});
};
var NETWORK_MESSAGE = "L'analyse n'a pas pu aboutir. Réessayez.";
var INVALID_AI_MESSAGE = "L'analyse n'a pas pu être terminée. La réponse reçue est invalide. Veuillez réessayer.";
async function withOk(label, run) {
	try {
		const out = await run();
		if (!out || typeof out !== "object" || typeof out.ok !== "boolean") {
			console.error(`[kreia:${label}] handler returned non-ok shape`, out);
			return {
				ok: false,
				error: NETWORK_MESSAGE
			};
		}
		return out;
	} catch (err) {
		console.error(`[kreia:${label}] uncaught`, err);
		const msg = err instanceof Error ? err.message : "";
		if (/json|parse|illisible/i.test(msg)) return {
			ok: false,
			error: INVALID_AI_MESSAGE
		};
		if (/abort|timeout|timed out/i.test(msg)) return {
			ok: false,
			error: "L'analyse a dépassé le délai imparti. Réessayez avec une vidéo plus courte."
		};
		return {
			ok: false,
			error: msg.trim() || NETWORK_MESSAGE
		};
	}
}
var checkAiAvailable_createServerFn_handler = createServerRpc({
	id: "68e121ddd88b9bb75a31f03876ea2201702cd0929c1824b2eea072181dc5409e",
	name: "checkAiAvailable",
	filename: "src/lib/kreia/ai.ts"
}, (opts) => checkAiAvailable.__executeServer(opts));
var checkAiAvailable = createServerFn({ method: "GET" }).handler(checkAiAvailable_createServerFn_handler, async () => {
	const { apiKey } = await import("./analyze-core-D6so5OJq.mjs").then((n) => n.t);
	return { available: Boolean(apiKey()) };
});
var probeVideoUrl_createServerFn_handler = createServerRpc({
	id: "2c9e0efd825c3cfc42bb33ba0a2c2c38d16b972cd2738d6bcd5a9f235f1794fa",
	name: "probeVideoUrl",
	filename: "src/lib/kreia/ai.ts"
}, (opts) => probeVideoUrl.__executeServer(opts));
var probeVideoUrl = createServerFn({ method: "POST" }).validator((input) => input).handler(probeVideoUrl_createServerFn_handler, async ({ data }) => {
	const { probeVideoUrlCore } = await import("./analyze-core-D6so5OJq.mjs").then((n) => n.t);
	return withOk("probe", async () => probeVideoUrlCore(data?.url ?? ""));
});
var analyzeVideo_createServerFn_handler = createServerRpc({
	id: "d7a2a55277debbccd2a6e433903c8474f5ab433e414f59cdc62f39185b188c7a",
	name: "analyzeVideo",
	filename: "src/lib/kreia/ai.ts"
}, (opts) => analyzeVideo.__executeServer(opts));
var analyzeVideo = createServerFn({ method: "POST" }).validator((input) => input).handler(analyzeVideo_createServerFn_handler, async ({ data }) => {
	const { runAnalyze } = await import("./analyze-core-D6so5OJq.mjs").then((n) => n.t);
	return withOk("analyze", async () => runAnalyze(data));
});
var reviseAnalysis_createServerFn_handler = createServerRpc({
	id: "d692495fddea21eccdb7e7ba7b37d5471320af0bc9a833e48f3a9cbc3c883458",
	name: "reviseAnalysis",
	filename: "src/lib/kreia/ai.ts"
}, (opts) => reviseAnalysis.__executeServer(opts));
var reviseAnalysis = createServerFn({ method: "POST" }).validator((input) => input).handler(reviseAnalysis_createServerFn_handler, async ({ data }) => {
	const { runReviseAnalysis } = await import("./analyze-core-D6so5OJq.mjs").then((n) => n.t);
	return withOk("revise-analysis", async () => runReviseAnalysis(data));
});
var generateProduction_createServerFn_handler = createServerRpc({
	id: "2742d6b640efda8a639b4709a114d1e91b44445a48de2dee31b1e13947999e80",
	name: "generateProduction",
	filename: "src/lib/kreia/ai.ts"
}, (opts) => generateProduction.__executeServer(opts));
var generateProduction = createServerFn({ method: "POST" }).validator((input) => input).handler(generateProduction_createServerFn_handler, async ({ data }) => {
	const { runGenerate } = await import("./analyze-core-D6so5OJq.mjs").then((n) => n.t);
	return withOk("generate", async () => runGenerate(data));
});
var reviseProduction_createServerFn_handler = createServerRpc({
	id: "d3cda9f74722bfabb87c80a99410b35e7e3b7a36d4dee4e8a9908d3d431de242",
	name: "reviseProduction",
	filename: "src/lib/kreia/ai.ts"
}, (opts) => reviseProduction.__executeServer(opts));
var reviseProduction = createServerFn({ method: "POST" }).validator((input) => input).handler(reviseProduction_createServerFn_handler, async ({ data }) => {
	const { runReviseProduction } = await import("./analyze-core-D6so5OJq.mjs").then((n) => n.t);
	return withOk("revise-production", async () => runReviseProduction(data));
});
//#endregion
export { analyzeVideo_createServerFn_handler, checkAiAvailable_createServerFn_handler, generateProduction_createServerFn_handler, probeVideoUrl_createServerFn_handler, reviseAnalysis_createServerFn_handler, reviseProduction_createServerFn_handler };
