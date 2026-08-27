//#region node_modules/.nitro/vite/services/ssr/assets/kinds-Cq3ES8qX.js
var KIND_REGISTRY = [{
	id: "human",
	label: "Histoire humaine",
	title: "Personnages humains",
	description: "Récits portés par des humains. Anatomie normale, continuité des visages, des vêtements et des rapports.",
	rules: [
		"Anatomie humaine cohérente, sans membres surnuméraires",
		"Visages et morphologies verrouillés par Character ID",
		"Le style visuel détecté reste une contrainte de production"
	]
}, {
	id: "fruit-humanoid",
	label: "Fruit humanoïde",
	title: "Univers Fruit Humanoid",
	description: "Aucun humain. Personnages fruits humanoïdes, proportions et espèces stables d’une scène à l’autre.",
	rules: [
		"Aucun humain, même en arrière-plan",
		"Espèce fruit, visage et vêtements verrouillés",
		"Conservation stricte du style visuel détecté"
	]
}];
var FUTURE_KINDS = [
	"Podcast",
	"Vlog",
	"UGC",
	"Éducatif",
	"Publicité"
];
var MODE_REGISTRY = [
	{
		id: "reconstruction",
		label: "Reconstruction",
		title: "Reproduire la structure",
		description: "Reprend le contenu et l’architecture de la vidéo sous forme de plan de production, sans copier les dialogues mot à mot."
	},
	{
		id: "adaptation",
		label: "Adaptation",
		title: "Garder la mécanique",
		description: "Conserve le moteur narratif, le rythme et le style, mais peut déplacer personnages, lieu ou situation."
	},
	{
		id: "inspiration",
		label: "Inspiration originale",
		title: "Une histoire nouvelle",
		description: "Garde le type de hook, le rythme, la structure et le langage visuel. Invente une histoire distincte."
	}
];
function kindById(id) {
	const found = KIND_REGISTRY.find((k) => k.id === id);
	if (!found) throw new Error(`Type de projet inconnu: ${id}`);
	return found;
}
function modeById(id) {
	const found = MODE_REGISTRY.find((m) => m.id === id);
	if (!found) throw new Error(`Mode inconnu: ${id}`);
	return found;
}
//#endregion
export { modeById as a, kindById as i, KIND_REGISTRY as n, MODE_REGISTRY as r, FUTURE_KINDS as t };
