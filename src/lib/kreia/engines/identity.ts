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

export function composeCharacterImagePrompt(
  character: CharacterSheet,
  analysis: VideoAnalysis,
): string {
  const weave = styleWeave(analysis.visualStyle);
  const type = character.characterType;
  const name = character.name || character.designation || character.id;
  const head =
    type === "fruit_humanoid"
      ? `Create a reference portrait of ${name}, a fruit-humanoid character (${character.species || "fruit species as seen in the source"}), body-fruit with humanoid limbs`
      : type === "angel"
        ? `Create a reference portrait of ${name}, an angel character matching the source exactly`
        : `Create a reference portrait of ${name}`;
  const identity = identityParagraph(character);
  const noInvent =
    type === "angel"
      ? "Do not invent wings, halo, white robes, golden glow or religious symbols unless listed above as observed."
      : type === "fruit_humanoid"
        ? "Do not change fruit species, seed pattern, body-fruit proportions, or clothing. Not a human."
        : "Keep face, eyes, hair, skin, body proportions and clothing identical to the locked identity.";
  return [
    `${head}, rendered in the same ${weave || "visual style as the source video"}, highly detailed, consistent proportions, immediately recognizable.`,
    identity,
    noInvent,
    "Medium shot portrait, simple background coherent with the source universe, cinematic lighting matching the reference. Identity lock: do not redesign this character.",
  ]
    .filter(Boolean)
    .join(" ");
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
    return {
      ...entry,
      bible: identityParagraph(sheet),
      imagePrompt: composeCharacterImagePrompt(sheet, analysis),
    };
  });
  const scenes = production.scenes.map((scene) => ({
    ...scene,
    visualStyle: styleWeave(analysis.visualStyle) || scene.visualStyle,
    videoPrompt: weaveStyleIntoPrompt(scene.videoPrompt, analysis),
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
