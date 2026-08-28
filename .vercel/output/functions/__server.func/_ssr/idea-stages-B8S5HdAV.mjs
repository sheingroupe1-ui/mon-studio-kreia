//#region node_modules/.nitro/vite/services/ssr/assets/idea-stages-B8S5HdAV.js
var IDEA_STEPS = [
	{
		id: "understand",
		label: "KREIA comprend votre idée"
	},
	{
		id: "story",
		label: "KREIA construit votre histoire"
	},
	{
		id: "characters",
		label: "KREIA construit vos personnages"
	},
	{
		id: "visual",
		label: "KREIA prépare l'univers visuel"
	},
	{
		id: "scenes",
		label: "KREIA découpe votre histoire en scènes"
	},
	{
		id: "dialogues",
		label: "KREIA prépare les dialogues"
	},
	{
		id: "prepare",
		label: "KREIA prépare votre projet"
	}
];
var IDEA_PHASE_ORDER = [
	"understand",
	"story",
	"characters",
	"visual",
	"scenes",
	"dialogues",
	"prepare"
];
function ideaProgressAt(phase, extra) {
	const i = IDEA_PHASE_ORDER.indexOf(phase);
	const idx = i < 0 ? 0 : i;
	const item = IDEA_STEPS[idx];
	return {
		step: idx + 1,
		total: IDEA_STEPS.length,
		label: item.label,
		...extra
	};
}
function nextIdeaPhase(phase) {
	const i = IDEA_PHASE_ORDER.indexOf(phase);
	if (i < 0 || i >= IDEA_PHASE_ORDER.length - 1) return "done";
	return IDEA_PHASE_ORDER[i + 1];
}
function ideaPhaseLabel(phase) {
	const i = IDEA_PHASE_ORDER.indexOf(phase);
	return IDEA_STEPS[i < 0 ? 0 : i].label;
}
function resumeIdeaPhase(cp) {
	if (!cp) return "understand";
	for (const phase of IDEA_PHASE_ORDER) if (!cp.completed?.includes(phase)) return phase;
	return "prepare";
}
//#endregion
export { nextIdeaPhase as a, ideaProgressAt as i, IDEA_STEPS as n, resumeIdeaPhase as o, ideaPhaseLabel as r, IDEA_PHASE_ORDER as t };
