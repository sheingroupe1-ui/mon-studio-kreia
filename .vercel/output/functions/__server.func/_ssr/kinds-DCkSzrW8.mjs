//#region node_modules/.nitro/vite/services/ssr/assets/kinds-DCkSzrW8.js
var KIND_REGISTRY = [
	{
		id: "human",
		label: "Histoire humaine",
		title: "Personnages humains",
		description: "Récits portés par des humains. Anatomie normale, continuité des visages, des vêtements et des rapports.",
		rules: [
			"Anatomie humaine cohérente, sans membres surnuméraires",
			"Visages et morphologies verrouillés par Character ID",
			"Le style visuel détecté reste une contrainte de production"
		]
	},
	{
		id: "fruit-humanoid",
		label: "Fruit humanoïde",
		title: "Univers Fruit Humanoid",
		description: "Aucun humain. Personnages fruits humanoïdes, proportions et espèces stables d’une scène à l’autre.",
		rules: [
			"Aucun humain, même en arrière-plan",
			"Espèce fruit, visage et vêtements verrouillés",
			"Conservation stricte du style visuel détecté"
		]
	},
	{
		id: "angel",
		label: "Anges",
		title: "Personnages célestes",
		description: "Anges et êtres célestes tels qu’ils apparaissent dans la vidéo. Ailes, halo ou lumière uniquement s’ils sont vraiment visibles.",
		rules: [
			"Un ange est un personnage, pas un décor",
			"Ne jamais inventer ailes, halo ou attributs religieux absents de la source",
			"Continuité stricte du visage, des ailes observées et des vêtements"
		]
	}
];
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
		description: "Reprend fidèlement l’histoire, les événements et les dialogues source, mot à mot."
	},
	{
		id: "adaptation",
		label: "Adaptation",
		title: "Garder la mécanique",
		description: "Conserve le moteur narratif, le rythme, le style et les paroles source. Seuls le lieu ou les prénoms peuvent changer."
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
