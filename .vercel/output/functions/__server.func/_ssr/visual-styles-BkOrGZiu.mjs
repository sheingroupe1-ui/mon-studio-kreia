//#region node_modules/.nitro/vite/services/ssr/assets/visual-styles-BkOrGZiu.js
var VISUAL_STYLE_REGISTRY = [
	{
		id: "cinematic-real",
		label: "Cinéma réaliste",
		description: "Image live-action, lumière naturelle, caméra de film.",
		renderType: "live-action photoréaliste",
		artisticStyle: "cinéma contemporain",
		lighting: "lumière naturelle cinématographique",
		atmosphere: "réaliste, incarnée",
		textures: "peau et tissus réels",
		materials: "matières photographiques",
		cameraMovement: "caméra fluide et stable",
		pace: "rythme de film",
		lockedStylePhrase: "cinéma réaliste, live-action, éclairage naturel cinématographique, textures photographiques, caméra fluide"
	},
	{
		id: "photoreal",
		label: "Photoréaliste",
		description: "Rendu ultra-net, comme une photo haute définition.",
		renderType: "photoréaliste",
		artisticStyle: "photographie haute définition",
		lighting: "éclairage studio / naturel précis",
		atmosphere: "nette et concrète",
		textures: "détail photographique",
		materials: "surfaces réelles",
		cameraMovement: "plans stables",
		pace: "posé",
		lockedStylePhrase: "photoréaliste, haute définition, éclairage précis, textures de peau et de tissu ultra-détaillées"
	},
	{
		id: "cinematic-3d",
		label: "3D cinématographique",
		description: "Animation 3D premium, éclairage de film.",
		renderType: "3D cinématographique",
		artisticStyle: "animation 3D premium",
		lighting: "éclairage studio cinématographique",
		atmosphere: "spectaculaire et soigné",
		textures: "surfaces 3D détaillées",
		materials: "shaders cinématographiques",
		cameraMovement: "grue et travelling 3D",
		pace: "cinématique",
		lockedStylePhrase: "3D cinématographique, éclairage studio, textures détaillées, caméra de film d'animation"
	},
	{
		id: "stylized-3d",
		label: "3D stylisée",
		description: "Volumes graphiques, couleurs franches, encore en 3D.",
		renderType: "3D stylisée",
		artisticStyle: "stylisation graphique 3D",
		lighting: "éclairage contrasté et graphique",
		atmosphere: "stylisée",
		textures: "surfaces lissées",
		materials: "shaders stylisés",
		cameraMovement: "caméra 3D expressive",
		pace: "dynamique",
		lockedStylePhrase: "3D stylisée, volumes graphiques, couleurs franches, éclairage contrasté"
	},
	{
		id: "pixar",
		label: "Animation 3D famille",
		description: "Look film d'animation grand public, doux et expressif.",
		renderType: "3D animation",
		artisticStyle: "film d'animation familial",
		lighting: "éclairage doux et chaleureux",
		atmosphere: "chaleureuse, expressive",
		textures: "surfaces satinées",
		materials: "shaders animation",
		cameraMovement: "caméra d'animation",
		pace: "vif et lisible",
		lockedStylePhrase: "animation 3D familiale, formes douces, éclairage chaleureux, expressions très lisibles"
	},
	{
		id: "anime",
		label: "Anime",
		description: "2D japonaise, traits nets, éclairage dramatique.",
		renderType: "2D anime",
		artisticStyle: "animation japonaise",
		lighting: "éclairages dramatiques, contre-jours",
		atmosphere: "dramatique",
		textures: "aplats et dégradés 2D",
		materials: "cel-shading",
		cameraMovement: "plans 2D expressifs",
		pace: "découpé",
		lockedStylePhrase: "anime 2D, traits nets, cel-shading, éclairages dramatiques, fond cinématographique"
	},
	{
		id: "cartoon-2d",
		label: "Cartoon 2D",
		description: "Dessin animé plat, contours, couleurs vives.",
		renderType: "2D cartoon",
		artisticStyle: "dessin animé",
		lighting: "éclairage plat et lisible",
		atmosphere: "graphique",
		textures: "aplats de couleur",
		materials: "papier / vectoriel",
		cameraMovement: "plans 2D simples",
		pace: "énergique",
		lockedStylePhrase: "cartoon 2D, contours nets, couleurs vives, éclairage plat, lecture immédiate"
	},
	{
		id: "noir-drama",
		label: "Drame contrasté",
		description: "Ombres profondes, tension, palette sombre.",
		renderType: "live-action dramatique",
		artisticStyle: "drame cinématographique",
		lighting: "clair-obscur, ombres profondes",
		atmosphere: "tendue, grave",
		textures: "grain film",
		materials: "matières réelles contrastées",
		cameraMovement: "plans serrés et lents",
		pace: "retenu",
		lockedStylePhrase: "drame cinématographique, clair-obscur, palette sombre, grain film, tension visuelle"
	},
	{
		id: "source-faithful",
		label: "Fidèle à la vidéo",
		description: "Reprendre le look de la source, sans le réinventer.",
		renderType: "fidèle à la source",
		artisticStyle: "identique à la vidéo de référence",
		lighting: "même éclairage que la source",
		atmosphere: "même atmosphère que la source",
		textures: "mêmes textures que la source",
		materials: "mêmes matières que la source",
		cameraMovement: "même langage de caméra",
		pace: "même rythme visuel",
		lockedStylePhrase: "style visuel identique à la vidéo source, mêmes textures, même éclairage, même rendu"
	},
	{
		id: "custom",
		label: "Personnalisé",
		description: "Décrivez le style exact à injecter dans les prompts.",
		renderType: "style personnalisé",
		artisticStyle: "défini par l'utilisateur",
		lighting: "",
		atmosphere: "",
		textures: "",
		materials: "",
		cameraMovement: "",
		pace: "",
		lockedStylePhrase: ""
	}
];
function visualStyleById(id) {
	return VISUAL_STYLE_REGISTRY.find((s) => s.id === id);
}
function emptyStyle() {
	return {
		renderType: "",
		artisticStyle: "",
		characterAppearance: "",
		colorPalette: [],
		saturation: "",
		contrast: "",
		colorTemperature: "",
		lighting: "",
		shadows: "",
		textures: "",
		materials: "",
		sets: "",
		depthOfField: "",
		composition: "",
		framing: "",
		perspective: "",
		cameraMovement: "",
		pace: "",
		transitions: "",
		atmosphere: "",
		detailLevel: "",
		lockedStylePhrase: "",
		confidence: "proposed"
	};
}
function styleFromUserChoice(id, customText) {
	const preset = visualStyleById(id) ?? visualStyleById("cinematic-real");
	const custom = (customText ?? "").trim();
	const phrase = preset.id === "custom" ? custom || "style cinématographique réaliste, éclairage naturel, textures photographiques" : preset.lockedStylePhrase;
	return {
		...emptyStyle(),
		renderType: preset.renderType,
		artisticStyle: preset.id === "custom" && custom ? custom : preset.artisticStyle,
		lighting: preset.lighting,
		atmosphere: preset.atmosphere,
		textures: preset.textures,
		materials: preset.materials,
		cameraMovement: preset.cameraMovement,
		pace: preset.pace,
		lockedStylePhrase: phrase,
		characterAppearance: "identité des personnages verrouillée, style de rendu choisi par l'utilisateur",
		confidence: "proposed"
	};
}
//#endregion
export { styleFromUserChoice as n, VISUAL_STYLE_REGISTRY as t };
