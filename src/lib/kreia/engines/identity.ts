import { angelCharacterId, characterId, fruitCharacterId } from "../ids.ts";
import type {
  CharacterSheet,
  CharacterType,
  ProductionPlan,
  ProjectKind,
  VideoAnalysis,
  VisualStyleAnalysis,
} from "../types";

const TYPE_LABEL: Record<string, string> = {
  human: "humain",
  fruit_humanoid: "fruit humanoïde",
  angel: "ange",
  animated_character: "personnage animé",
  animal_humanoid: "animal humanoïde",
  fantasy_character: "personnage fantastique",
  unknown_character: "personnage",
  unknown: "personnage",
};

export function labelCharacterType(type: CharacterType | undefined): string {
  return TYPE_LABEL[type ?? "unknown"] ?? "personnage";
}

export function defaultTypeForKind(kind: ProjectKind): CharacterType {
  if (kind === "fruit-humanoid") return "fruit_humanoid";
  if (kind === "angel") return "unknown_character";
  return "unknown";
}

export function stableIdFor(
  index: number,
  kind: ProjectKind,
  type?: CharacterType,
): string {
  if (type === "fruit_humanoid" || (kind === "fruit-humanoid" && (!type || type === "unknown" || type === "unknown_character"))) {
    return fruitCharacterId(index + 1);
  }
  if (type === "angel") return angelCharacterId(index + 1);
  return characterId(index + 1);
}

export function remapIdForType(id: string, type: CharacterType, kind: ProjectKind): string {
  if (!id) return stableIdFor(0, kind, type);
  if ((type === "fruit_humanoid" || kind === "fruit-humanoid") && /^CHARACTER_\d+$/.test(id)) {
    return id.replace(/^CHARACTER_/, "FRUIT_CHARACTER_");
  }
  if (type === "angel" && /^CHARACTER_\d+$/.test(id) && kind === "angel") {
    return id.replace(/^CHARACTER_/, "ANGEL_CHARACTER_");
  }
  return id;
}

export function styleWeave(style: VisualStyleAnalysis | undefined): string {
  if (!style) return "";
  const bits = [
    style.lockedStylePhrase,
    style.renderType,
    style.artisticStyle,
    style.textures && `textures ${style.textures}`,
    style.materials && `matériaux ${style.materials}`,
    style.detailLevel && `détail ${style.detailLevel}`,
    style.lighting && `éclairage ${style.lighting}`,
  ].filter(Boolean);
  const unique = [...new Set(bits)];
  return unique.join(", ");
}

export function identityFingerprint(c: CharacterSheet): string {
  if (c.identityFingerprint?.trim()) return c.identityFingerprint.trim();
  return [
    c.characterType || "unknown",
    c.species,
    c.bodyStructure || c.morphology,
    c.complexion,
    c.eyes,
    c.hair,
    c.clothing,
    c.accessories,
    c.wings,
    c.distinctiveFeatures,
  ]
    .filter((x) => x && String(x).trim())
    .join(" · ");
}

function obs(value: string | undefined | null, fallback = "Non observé dans la source."): string {
  const text = (value ?? "").trim();
  return text || fallback;
}

export function styleBlock(analysis: VideoAnalysis): string {
  const weave = styleWeave(analysis.visualStyle);
  const extras = [
    analysis.visualStyle.atmosphere,
    analysis.visualStyle.colorTemperature && `température ${analysis.visualStyle.colorTemperature}`,
    analysis.visualStyle.depthOfField && `profondeur de champ ${analysis.visualStyle.depthOfField}`,
    analysis.visualStyle.detailLevel && `niveau de détail ${analysis.visualStyle.detailLevel}`,
  ].filter(Boolean);
  const line = [...new Set([weave, ...extras].filter(Boolean))].join(", ");
  return line || "Style visuel de la vidéo source, qualité cinéma, éclairage cohérent, textures détaillées.";
}

export function identityParagraph(c: CharacterSheet): string {
  const type = labelCharacterType(c.characterType);
  const name = c.name || c.designation || c.id;
  const bits = [
    `${name} (${c.id}), ${type}`,
    c.species && `espèce / nature : ${c.species}`,
    c.bodyStructure && `structure : ${c.bodyStructure}`,
    c.morphology && `morphologie : ${c.morphology}`,
    c.appearance && `apparence : ${c.appearance}`,
    c.complexion && `teint / surface : ${c.complexion}`,
    c.hair && `coiffure : ${c.hair}`,
    c.eyes && `yeux : ${c.eyes}`,
    c.clothing && `vêtements : ${c.clothing}`,
    c.accessories && `accessoires : ${c.accessories}`,
    c.wings && `ailes (observées) : ${c.wings}`,
    c.halo && `halo (observé) : ${c.halo}`,
    c.distinctiveFeatures && `traits distinctifs : ${c.distinctiveFeatures}`,
    c.relationships && `relations : ${c.relationships}`,
    c.lockedTraits.length ? `verrouillé : ${c.lockedTraits.join(", ")}` : "",
  ].filter(Boolean);
  return bits.join(". ");
}

export function composeCharacterDossier(character: CharacterSheet, analysis: VideoAnalysis): string {
  const name = (character.name || character.designation || character.id).trim();
  const type = character.characterType;
  const style = styleBlock(analysis);
  const fruit = type === "fruit_humanoid";
  const angel = type === "angel";
  const header = fruit
    ? `${name} — ${obs(character.species, "fruit humanoïde")} HUMANOÏDE`
    : angel
      ? `${name} — ANGE HUMANOÏDE CÉLESTE`
      : `NOM : ${name}`;

  const bans = fruit
    ? [
        `Interdit de transformer ${name} en humain.`,
        `Interdit d'en faire un humain avec ${obs(character.species, "un fruit")} posé sur la tête ou porté comme accessoire.`,
        "Interdit de changer d'espèce, de couleur de fruit, de texture ou de morphologie.",
        "Interdit d'ajouter des membres, visages ou costumes absents de la fiche.",
      ].join("\n")
    : angel
      ? [
          character.wings?.trim()
            ? "Conserver les ailes exactement telles qu'observées."
            : "Ne pas inventer d'ailes, de halo, de robe blanche ou de lueur dorée absents de la source.",
          "Interdit de transformer l'ange en humain ordinaire.",
          "Interdit de changer visage, teint, yeux, cheveux, morphologie.",
          "Ne pas inventer de pouvoirs surnaturels non observés.",
        ].join("\n")
      : [
          "Interdit de changer visage, teint, yeux, coiffure, morphologie, âge apparent.",
          "Interdit d'ajouter des personnages, accessoires ou vêtements non observés.",
          "Les changements de tenue ne sont autorisés que s'ils sont justifiés par la scène source.",
        ].join("\n");

  const continuity = fruit
    ? "RÈGLE DE CONTINUITÉ ABSOLUE :\nLe personnage reste exactement le même dans toutes les scènes. Ne jamais modifier son espèce, son fruit, sa couleur, sa texture, son visage, ses yeux, sa bouche, sa morphologie, ses proportions."
    : angel
      ? "RÈGLE DE CONTINUITÉ ABSOLUE :\nLe visage, le teint, les yeux, les cheveux, la morphologie, les ailes observées et les caractéristiques physiques restent identiques."
      : "RÈGLE DE CONTINUITÉ :\nLe visage, le teint, les yeux, les traits, la coiffure, la morphologie et les caractéristiques physiques restent strictement identiques.";

  return [
    header,
    "",
    "Identité :",
    `Nom : ${name}`,
    `Sexe : ${obs(character.sex)}`,
    `Espèce : ${obs(character.species, fruit ? "fruit humanoïde" : angel ? "ange humanoïde" : "humain")}`,
    `Âge apparent : ${obs(character.ageApparent)}`,
    "",
    "APPARENCE PHYSIQUE VERROUILLÉE :",
    obs(character.appearance),
    character.bodyStructure ? `Structure / proportions : ${character.bodyStructure}` : "",
    character.morphology ? `Morphologie : ${character.morphology}` : "",
    character.complexion
      ? fruit
        ? `Couleur et texture du fruit : ${character.complexion}`
        : `Teint : ${character.complexion}`
      : "",
    character.distinctiveFeatures ? `Particularités physiques : ${character.distinctiveFeatures}` : "",
    fruit
      ? "Ce personnage EST un fruit humanoïde : le fruit constitue son corps et son identité visuelle. Ce n'est pas un humain déguisé, ni un humain portant un fruit."
      : "",
    "",
    "VISAGE ET EXPRESSIONS :",
    character.eyes ? `Yeux : ${character.eyes}` : "",
    !fruit && character.hair ? `Coiffure : ${character.hair}` : "",
    "",
    fruit
      ? ""
      : ["CORPS :", `Silhouette / morphologie : ${obs(character.morphology)}`, character.bodyStructure ? `Proportions : ${character.bodyStructure}` : ""]
          .filter(Boolean)
          .join("\n"),
    "",
    "VÊTEMENTS :",
    obs(character.clothing, "Aucun vêtement distinct observé."),
    character.accessories ? `ACCESSOIRES : ${character.accessories}` : "",
    "",
    angel
      ? [
          "AILES :",
          obs(character.wings, "Aucune aile visible dans la source — ne pas en inventer."),
          character.halo ? `AURA / HALO (observé uniquement) : ${character.halo}` : "",
        ]
          .filter(Boolean)
          .join("\n")
      : "",
    "",
    "PERSONNALITÉ :",
    obs(character.personality, "Comportement tel qu'observé à l'écran."),
    character.role ? `SITUATION / RÔLE : ${character.role}` : "",
    character.relationships ? `Relations : ${character.relationships}` : "",
    "",
    "STYLE VISUEL :",
    style,
    "",
    continuity,
    "",
    "INTERDICTIONS :",
    bans,
  ]
    .filter((block) => Boolean(block))
    .join("\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

export function composeCharacterImagePrompt(
  character: CharacterSheet,
  analysis: VideoAnalysis,
): string {
  return composeCharacterDossier(character, analysis);
}

export function weaveStyleIntoPrompt(prompt: string, analysis: VideoAnalysis): string {
  const weave = styleWeave(analysis.visualStyle);
  if (!weave) return prompt;
  const base = prompt.trim();
  if (!base) return weave;
  if (base.toLowerCase().includes(weave.toLowerCase().slice(0, 24))) return base;
  return `${base} Rendered in the same ${weave} as the source video, matching textures, materials, proportions and cinematic quality of the reference.`;
}

export function enforceProductionIdentity(
  production: ProductionPlan,
  analysis: VideoAnalysis,
): ProductionPlan {
  const sheets = analysis.characters;
  const characters = production.characters.map((entry) => {
    const sheet = sheets.find((c) => c.id === entry.id);
    if (!sheet) {
      return { ...entry, imagePrompt: weaveStyleIntoPrompt(entry.imagePrompt, analysis) };
    }
    const dossier = composeCharacterDossier(sheet, analysis);
    return { ...entry, bible: identityParagraph(sheet), imagePrompt: dossier, formattedSheet: dossier };
  });
  const scenes = production.scenes.map((scene) => ({
    ...scene,
    visualStyle: styleBlock(analysis) || scene.visualStyle,
  }));
  return {
    ...production,
    characters,
    scenes,
    hook: {
      ...production.hook,
      visualPrompt: weaveStyleIntoPrompt(production.hook.visualPrompt, analysis),
    },
  };
}