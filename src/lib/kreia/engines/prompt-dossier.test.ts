import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { composeSceneDossier } from "./prompt-dossier.ts";
import type { CharacterSheet, SceneAnalysis, VideoAnalysis, VisualStyleAnalysis } from "../types.ts";

function sheet(partial: Partial<CharacterSheet> & Pick<CharacterSheet, "id" | "designation">): CharacterSheet {
  return {
    name: partial.name ?? partial.designation,
    nameConfidence: "observed",
    ageApparent: "",
    sex: "",
    appearance: "",
    complexion: "",
    morphology: "",
    hair: "",
    eyes: "",
    clothing: "",
    accessories: "",
    role: "",
    personality: "",
    relationships: "",
    prominence: "principal",
    lockedTraits: [],
    notes: "",
    ...partial,
  };
}

describe("composeSceneDossier", () => {
  it("lists only characters present in the scene and only that scene's replicas", () => {
    const analysis = {
      characters: [
        sheet({ id: "CHARACTER_01", designation: "Marie", clothing: "robe bleue" }),
        sheet({ id: "CHARACTER_02", designation: "Paul", clothing: "chemise" }),
        sheet({ id: "CHARACTER_03", designation: "Jean" }),
      ],
      visualStyle: { lockedStylePhrase: "animation 3D cinématographique" } as VisualStyleAnalysis,
      scenes: [
        {
          number: 1,
          estimatedDuration: 10,
          startHint: "00:00 → 00:10",
          characters: ["CHARACTER_01", "CHARACTER_02"],
          setting: "Cuisine familiale, table en bois, lumière du matin",
          action: "Marie confronte Paul",
          emotion: "tension",
          camera: "plan moyen",
          lighting: "lumière naturelle",
          audio: "",
          dialogue: null,
          dialogueSpeaker: null,
          styleNotes: "",
          confidence: "observed",
          silentReactions: [],
        } satisfies SceneAnalysis,
      ],
      dialogues: {
        language: "fr",
        source: "transcript",
        rawTranscript: "",
        lines: [
          {
            id: "D001",
            sceneNumber: 1,
            order: 1,
            speakerId: "CHARACTER_01",
            speakerLabel: "Marie",
            sourceText: "Tu savais.",
            displayText: "Tu savais.",
            timeHint: "00:02",
            emotion: "",
            intention: "",
            confidence: "clear",
            attribution: "certain",
            performance: {
              emotionStart: "",
              emotionDominant: "colère",
              intensity: 7,
              facialExpression: "mâchoire serrée",
              gaze: "fixé sur Paul",
              gesture: "",
              posture: "",
              tone: "",
              tears: "",
              evolution: "",
            },
          },
          {
            id: "D002",
            sceneNumber: 2,
            order: 1,
            speakerId: "CHARACTER_03",
            speakerLabel: "Jean",
            sourceText: "Laissez-moi.",
            displayText: "Laissez-moi.",
            timeHint: "00:12",
            emotion: "",
            intention: "",
            confidence: "clear",
            attribution: "certain",
            performance: {
              emotionStart: "",
              emotionDominant: "",
              intensity: 0,
              facialExpression: "",
              gaze: "",
              gesture: "",
              posture: "",
              tone: "",
              tears: "",
              evolution: "",
            },
          },
        ],
      },
    } as unknown as VideoAnalysis;

    const prompt = composeSceneDossier(analysis, 0, { duration: 10 });
    assert.match(prompt, /SCÈNE 1/);
    assert.match(prompt, /DURÉE : 10 SECONDES/);
    assert.match(prompt, /Marie/);
    assert.match(prompt, /Paul/);
    assert.equal(prompt.includes("Jean"), false);
    assert.match(prompt, /Tu savais/);
    assert.equal(prompt.includes("Laissez-moi"), false);
    assert.match(prompt, /TOTAL DIALOGUES :/);
    assert.match(prompt, /Aucun chevauchement vocal/);
    assert.match(prompt, /Story Rule/);
  });

  it("writes Aucun dialogue when the window has no replica", () => {
    const analysis = {
      characters: [sheet({ id: "CHARACTER_01", designation: "Marie" })],
      visualStyle: { lockedStylePhrase: "cinéma" } as VisualStyleAnalysis,
      scenes: [
        {
          number: 1,
          estimatedDuration: 8,
          startHint: "",
          characters: ["CHARACTER_01"],
          setting: "Couloir",
          action: "Marie marche en silence",
          emotion: "inquiétude",
          camera: "",
          lighting: "",
          audio: "",
          dialogue: null,
          dialogueSpeaker: null,
          styleNotes: "",
          confidence: "observed",
          silentReactions: [],
        } satisfies SceneAnalysis,
      ],
      dialogues: { language: "fr", source: "unavailable", rawTranscript: null, lines: [] },
    } as unknown as VideoAnalysis;
    const prompt = composeSceneDossier(analysis, 0);
    assert.match(prompt, /Aucun dialogue/);
    assert.match(prompt, /TOTAL DIALOGUES : 0 CARACTÈRES/);
  });
});
