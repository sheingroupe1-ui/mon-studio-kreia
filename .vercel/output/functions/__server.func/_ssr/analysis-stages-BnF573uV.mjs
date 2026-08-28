//#region node_modules/.nitro/vite/services/ssr/assets/analysis-stages-BnF573uV.js
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
		label: "Analyse du style visuel"
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
	return {
		step: i + 1,
		total: ANALYSIS_STEPS.length,
		label: item.label,
		...extra
	};
}
//#endregion
export { progressAt as n, ANALYSIS_STEPS as t };
