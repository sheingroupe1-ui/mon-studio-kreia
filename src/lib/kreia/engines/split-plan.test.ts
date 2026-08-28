import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { splitAnalysis, splitProduction } from "./split-plan.ts";
import { emptyPerformance } from "./dialogues.ts";
import type { ProductionPlan, VideoAnalysis } from "../types.ts";

function analysisWithDump(): VideoAnalysis {
  const lines = Array.from({ length: 6 }, (_, i) => ({
    id: `D00${i + 1}`,
    sceneNumber: 1,
    order: i + 1,
    speakerId: "CHARACTER_01",
    speakerLabel: "Sarah",
    sourceText: `Réplique ${i + 1} de la minute`,
    displayText: `Réplique ${i + 1} de la minute`,
    timeHint: "",
    startTime: i * 10 + 2,
    endTime: i * 10 + 4,
    emotion: "",
    intention: "",
    confidence: "clear" as const,
    attribution: "certain" as const,
    performance: emptyPerformance(),
  }));
  return {
    observedSummary: "Une histoire d'une minute",
    limitations: [],
    language: "fr",
    sceneCountEstimate: 1,
    narrative: {},
    hook: {},
    characters: [{ id: "CHARACTER_01", name: "Sarah", designation: "Sarah" }],
    visualStyle: { lockedStylePhrase: "photoreal cinematic" },
    cinematic: {},
    scenes: [
      {
        number: 1,
        estimatedDuration: 10,
        startHint: "0s",
        characters: ["CHARACTER_01"],
        setting: "salon",
        action: "toute l'histoire",
        emotion: "tension",
        camera: "plan moyen",
        lighting: "jour",
        audio: "",
        dialogue: lines.map((l) => `Sarah : « ${l.sourceText} »`).join("\n"),
        dialogueSpeaker: "Sarah",
        styleNotes: "",
        confidence: "observed",
        silentReactions: [],
      },
    ],
    audio: { dialoguePresent: true, source: "transcript" },
    dialogues: {
      language: "fr",
      source: "transcript",
      rawTranscript: lines.map((l) => l.sourceText).join(" "),
      lines,
    },
  } as unknown as VideoAnalysis;
}

describe("splitAnalysis", () => {
  it("turns a 60s dump into 6 scenes and spreads the dialogues", () => {
    const out = splitAnalysis(analysisWithDump(), 60);
    assert.equal(out.scenes.length, 6);
    const inFirst = (out.dialogues.lines ?? []).filter((l) => l.sceneNumber === 1);
    assert.ok(inFirst.length < out.dialogues.lines.length);
    assert.ok(out.dialogues.lines.some((l) => l.sceneNumber === 6));
  });
});

describe("splitProduction", () => {
  it("refuses to keep a single 60s prompt", () => {
    const analysis = analysisWithDump();
    const production: ProductionPlan = {
      hook: { reconstructed: "", visualPrompt: "", duration: 10, mechanism: "" },
      scenario: { logline: "", synopsis: "", structure: "", dialoguesNote: "" },
      characters: [],
      visualStyle: { lockedPhrase: "", productionNotes: "", doNot: [] },
      scenes: [
        {
          number: 1,
          duration: 10,
          characters: ["CHARACTER_01"],
          location: "salon",
          action: "toute l'histoire",
          emotion: "",
          camera: "",
          lighting: "",
          visualStyle: "",
          audio: "",
          dialogue: analysis.scenes[0]!.dialogue,
          videoPrompt: "ONE GIANT PROMPT WITH ALL DIALOGUES " + analysis.scenes[0]!.dialogue,
          continuityNotes: "",
        },
      ],
    };
    const out = splitProduction(production, analysis, 60);
    assert.equal(out.scenes.length, 6);
    assert.ok(out.scenes.every((s) => s.duration <= 10));
    const firstPrompt = out.scenes[0]?.videoPrompt ?? "";
    assert.equal(firstPrompt.includes("Réplique 6 de la minute"), false);
    assert.match(firstPrompt, /Réplique 1 de la minute/);
  });
});
