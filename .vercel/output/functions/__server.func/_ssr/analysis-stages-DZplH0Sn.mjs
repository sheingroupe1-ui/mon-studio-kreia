//#region node_modules/.nitro/vite/services/ssr/assets/analysis-stages-DZplH0Sn.js
var ANALYSIS_STEPS = [
	{
		id: "validate",
		label: "Vérification de la vidéo"
	},
	{
		id: "structure",
		label: "Analyse de la structure"
	},
	{
		id: "characters",
		label: "Identification des personnages"
	},
	{
		id: "style",
		label: "Application du style visuel"
	},
	{
		id: "scenes",
		label: "Analyse des scènes"
	},
	{
		id: "narrative",
		label: "Reconstruction narrative"
	},
	{
		id: "prepare",
		label: "Préparation de votre projet"
	}
];
function progressAt(step, extra) {
	const i = Math.min(ANALYSIS_STEPS.length, Math.max(1, step)) - 1;
	const item = ANALYSIS_STEPS[i];
	const progress = {
		step: i + 1,
		total: ANALYSIS_STEPS.length,
		label: item.label
	};
	if (extra?.compact) progress.compact = extra.compact;
	if (typeof extra?.segmentsDone === "number") progress.segmentsDone = extra.segmentsDone;
	if (typeof extra?.segmentsTotal === "number") progress.segmentsTotal = extra.segmentsTotal;
	if (typeof extra?.castBatchesDone === "number") progress.castBatchesDone = extra.castBatchesDone;
	if (typeof extra?.castBatchesTotal === "number") progress.castBatchesTotal = extra.castBatchesTotal;
	if (typeof extra?.productionScenesDone === "number") progress.productionScenesDone = extra.productionScenesDone;
	if (typeof extra?.productionScenesTotal === "number") progress.productionScenesTotal = extra.productionScenesTotal;
	if (extra?.debug) progress.debug = extra.debug;
	return progress;
}
//#endregion
export { progressAt as n, ANALYSIS_STEPS as t };
