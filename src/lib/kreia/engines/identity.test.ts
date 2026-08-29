import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { composeCharacterImagePrompt, identityParagraph, weaveStyleIntoPrompt } from "./identity.ts";
import type { CharacterSheet, VideoAnalysis, VisualStyleAnalysis } from "../types.ts";

function style(partial: Partial<VisualStyleAnalysis> = {}): VisualStyleAnalysis {
  return {
    renderType: "3D stylized cinematic animation",
    artisticStyle: "premium short-film",
    characterAppearance: "",
    colorPalette: [],
    saturation: "",
    contrast: "",
    colorTemperature: "",
    lighting: "warm cinematic",
    shadows: "",
    textures: "detailed fruit skin",
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
    detailLevel: "high",
    lockedStylePhrase: "stylized 3D cinematic fruit-humanoid animation",
    confidence: "observed",
    ...partial,
  };
}

describe("composeCharacterImagePrompt", () => {
  it("weaves style into the character prompt instead of a separate STYLE block", () => {
    const character: CharacterSheet = {
      id: "FRUIT_CHARACTER_01",
      designation: "Fraise",
      name: null,
      nameConfidence: "inferred",
      characterType: "fruit_humanoid",
      species: "fraise",
      ageApparent: "",
      sex: "",
      appearance: "corps-fraise, yeux expressifs",
      complexion: "rouge vif, graines visibles",
      morphology: "petit corps humanoïde",
      bodyStructure: "tête-fruit, bras et jambes proportionnés",
      hair: "",
      eyes: "grands yeux",
      clothing: "veste jaune et pantalon bleu",
      accessories: "lunettes rondes",
      distinctiveFeatures: "graines apparentes",
      role: "",
      personality: "",
      relationships: "",
      prominence: "principal",
      lockedTraits: ["fraise", "veste jaune"],
      notes: "",
    };
    const analysis = { visualStyle: style() } as VideoAnalysis;
    const prompt = composeCharacterImagePrompt(character, analysis);
    assert.match(prompt, /stylized 3D cinematic/);
    assert.match(prompt, /fraise/i);
    assert.equal(/^\s*STYLE\s*:/m.test(prompt), false);
    assert.match(prompt, /Not a human/i);
  });

  it("does not invent wings for an angel without observed wings", () => {
    const character: CharacterSheet = {
      id: "ANGEL_CHARACTER_01",
      designation: "Ange",
      name: null,
      nameConfidence: "inferred",
      characterType: "angel",
      ageApparent: "jeune adulte",
      sex: "femme",
      appearance: "visage serein",
      complexion: "peau claire",
      morphology: "élancée",
      hair: "cheveux longs blonds",
      eyes: "yeux clairs",
      clothing: "tunique ivoire observée",
      accessories: "",
      wings: "",
      halo: "",
      role: "",
      personality: "",
      relationships: "",
      prominence: "principal",
      lockedTraits: [],
      notes: "",
    };
    const analysis = { visualStyle: style({ lockedStylePhrase: "photoreal cinematic" }) } as VideoAnalysis;
    const prompt = composeCharacterImagePrompt(character, analysis);
    assert.match(prompt, /Do not invent wings/);
    assert.match(prompt, /photoreal cinematic/);
  });

  it("includes observed relationships in the identity paragraph", () => {
    const paragraph = identityParagraph({
      id: "CHARACTER_01",
      designation: "Marie",
      name: "Marie",
      sourceName: "Marie",
      nameConfidence: "observed",
      ageApparent: "",
      sex: "female",
      appearance: "",
      complexion: "",
      morphology: "",
      hair: "",
      eyes: "",
      clothing: "",
      accessories: "",
      role: "",
      personality: "",
      relationships: "Épouse de CHARACTER_02.",
      prominence: "principal",
      lockedTraits: [],
      notes: "",
    });
    assert.match(paragraph, /Épouse de CHARACTER_02/);
  });
});

describe("weaveStyleIntoPrompt", () => {
  it("appends the source style into a scene prompt", () => {
    const analysis = { visualStyle: style() } as VideoAnalysis;
    const out = weaveStyleIntoPrompt("Two fruit-humanoids argue in a kitchen.", analysis);
    assert.match(out, /Two fruit-humanoids/);
    assert.match(out, /stylized 3D cinematic/);
  });
});
