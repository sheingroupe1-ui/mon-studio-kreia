import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { validateIsolatedProduction } from "./guards.ts";
import { emptyPerformance } from "./dialogues.ts";
import { parseAnalysis } from "../parse.ts";
import type { ProductionPlan, SceneProduction } from "../types.ts";

const lines = [
  {
    id: "D001",
    sceneNumber: 1,
    order: 1,
    speakerId: "CHARACTER_01",
    speakerLabel: "Marie",
    sourceText: "Tu savais pour elle depuis le début.",
    displayText: "Tu savais pour elle depuis le début.",
    timeHint: "",
    emotion: "",
    intention: "",
    confidence: "clear" as const,
    attribution: "certain" as const,
    performance: emptyPerformance(),
  },
  {
    id: "D002",
    sceneNumber: 6,
    order: 2,
    speakerId: "CHARACTER_02",
    speakerLabel: "Jean",
    sourceText: "Je n'avais pas le choix de te le dire.",
    displayText: "Je n'avais pas le choix de te le dire.",
    timeHint: "",
    emotion: "",
    intention: "",
    confidence: "clear" as const,
    attribution: "certain" as const,
    performance: emptyPerformance(),
  },
];

function stubScene(n: number, prompt: string): SceneProduction {
  return {
    number: n,
    duration: 10,
    characters: [],
    location: "",
    action: "",
    emotion: "",
    camera: "",
    lighting: "",
    visualStyle: "",
    audio: "",
    dialogue: null,
    videoPrompt: prompt,
    continuityNotes: "",
  };
}

function plan(scenes: SceneProduction[]): ProductionPlan {
  return {
    hook: { reconstructed: "", visualPrompt: "", duration: 10, mechanism: "" },
    scenario: { logline: "", synopsis: "", structure: "", dialoguesNote: "" },
    characters: [],
    visualStyle: { lockedPhrase: "", productionNotes: "", doNot: [] },
    scenes,
  };
}

describe("validateIsolatedProduction", () => {
  it("rejects a 60s project with a single scene", () => {
    const analysis = parseAnalysis({ dialogues: { source: "transcript", lines } });
    const err = validateIsolatedProduction(analysis, plan([stubScene(1, "x")]), 60);
    assert.ok(err);
  });

  it("rejects a prompt that contains another scene's replica", () => {
    const analysis = parseAnalysis({ dialogues: { source: "transcript", lines } });
    const scenes = Array.from({ length: 6 }, (_, i) =>
      stubScene(
        i + 1,
        i === 0
          ? "Tu savais pour elle depuis le début. Je n'avais pas le choix de te le dire."
          : "ok",
      ),
    );
    const err = validateIsolatedProduction(analysis, plan(scenes), 60);
    assert.ok(err);
    assert.match(err ?? "", /autre scène/);
  });
});
