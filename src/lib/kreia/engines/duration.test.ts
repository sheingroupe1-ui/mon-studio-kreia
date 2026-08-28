import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  chooseSceneCount,
  collapseAnalysisScenes,
  collapseProductionScenes,
  defaultIdeaDuration,
  expectedSceneCount,
  ideaSceneCount,
  inferSourceDuration,
  packDurations,
  proposeSegments,
  splitOversizedAnalysisScene,
  totalPackedDuration,
} from "./duration.ts";
import type { SceneAnalysis, SceneProduction } from "../types.ts";

function stubScene(i: number): SceneAnalysis {
  return {
    number: i + 1,
    estimatedDuration: 6,
    startHint: `${i * 6}s`,
    characters: ["CHARACTER_01"],
    setting: `Lieu ${i + 1}`,
    action: `Action ${i + 1}`,
    emotion: "neutre",
    camera: "plan moyen",
    lighting: "jour",
    audio: "ambiance",
    dialogue: null,
    dialogueSpeaker: null,
    styleNotes: "",
    confidence: "observed",
    silentReactions: [],
  };
}

describe("chooseSceneCount", () => {
  it("forces a single scene for a 10s source even if 4 scenes were proposed", () => {
    assert.equal(chooseSceneCount(10, 4), 1);
  });

  it("maps 60s to exactly 6 scenes", () => {
    assert.equal(expectedSceneCount(60), 6);
    assert.equal(chooseSceneCount(60, 1), 6);
    assert.equal(chooseSceneCount(65, 1), 7);
  });

  it("uses the last frame time when declared duration is missing", () => {
    assert.equal(inferSourceDuration(0, { frameTimes: [1, 12, 58] }), 58);
    assert.equal(expectedSceneCount(inferSourceDuration(10, { frameTimes: [58] })), 6);
  });

  it("caps a 24s source at 3 scenes of 10s", () => {
    const n = chooseSceneCount(24, 12);
    assert.equal(n, 3);
  });
});

describe("packDurations", () => {
  it("packs a 10s video as one 10s prompt, not 4×6s", () => {
    const d = packDurations(10, chooseSceneCount(10, 4));
    assert.deepEqual(d, [10]);
    assert.equal(totalPackedDuration(d), 10);
  });

  it("stays close to a 24s source", () => {
    const n = chooseSceneCount(24, 3);
    const d = packDurations(24, n);
    const sum = totalPackedDuration(d);
    assert.ok(Math.abs(sum - 24) <= 4, `sum=${sum}`);
    assert.ok(sum < 36);
  });

  it("keeps a 59s source near one minute, never 4× the length", () => {
    const n = chooseSceneCount(59, 20);
    const d = packDurations(59, n);
    const sum = totalPackedDuration(d);
    assert.ok(n <= 10);
    assert.ok(n >= 6);
    assert.ok(sum <= 70, `sum=${sum} n=${n}`);
    assert.ok(sum >= 48);
  });
});

describe("collapseAnalysisScenes", () => {
  it("merges four 6s shots from a 10s video into one scene", () => {
    const out = collapseAnalysisScenes(
      [stubScene(0), stubScene(1), stubScene(2), stubScene(3)],
      10,
    );
    assert.equal(out.length, 1);
    assert.equal(out[0]?.estimatedDuration, 10);
    assert.match(out[0]?.action ?? "", /Action 1/);
  });

  it("concatenates dialogues instead of keeping only the first line", () => {
    const a = stubScene(0);
    const b = stubScene(1);
    a.dialogue = "Tu m'avais pourtant promis de ne jamais partir.";
    a.dialogueSpeaker = "Marie";
    b.dialogue = "Je n'avais pas le choix.";
    b.dialogueSpeaker = "Jean";
    const out = collapseAnalysisScenes([a, b], 10);
    assert.equal(out.length, 1);
    assert.match(out[0]?.dialogue ?? "", /promis de ne jamais partir/);
    assert.match(out[0]?.dialogue ?? "", /pas le choix/);
  });

  it("expands a single 60s analysis into 6 scenes", () => {
    const out = collapseAnalysisScenes([stubScene(0)], 60);
    assert.equal(out.length, 6);
    assert.ok(out.every((s) => s.estimatedDuration <= 10));
  });

  it("splits one scene with many replicas across a 60s source", () => {
    const scene = stubScene(0);
    scene.dialogue = [
      "Marie : Tu savais pour elle.",
      "Jean : Oui.",
      "Marie : Depuis combien de temps ?",
      "Jean : Des mois.",
      "Marie : Pourquoi ?",
      "Jean : Je n'avais pas le choix.",
    ].join("\n");
    const out = splitOversizedAnalysisScene([scene], 60);
    assert.equal(out.length, 6);
    const spoken = out.map((s) => s.dialogue).filter(Boolean);
    assert.ok(spoken.length >= 2);
    assert.equal(spoken.join("\n").includes("Tu savais pour elle"), true);
    assert.equal(out.filter((s) => s.dialogue === scene.dialogue).length < out.length, true);
  });
});

describe("collapseProductionScenes", () => {
  it("does not emit 24s of prompts for a 10s source", () => {
    const stubs: SceneProduction[] = [0, 1, 2, 3].map((i) => ({
      number: i + 1,
      duration: 6,
      characters: ["CHARACTER_01"],
      location: "set",
      action: `Beat ${i + 1}`,
      emotion: "",
      camera: "",
      lighting: "",
      visualStyle: "",
      audio: "",
      dialogue: null,
      videoPrompt: `prompt ${i}`,
      continuityNotes: "",
    }));
    const out = collapseProductionScenes(stubs, 10);
    assert.equal(out.length, 1);
    assert.equal(out[0]?.duration, 10);
    assert.equal(totalPackedDuration(out.map((s) => s.duration)), 10);
  });

  it("refuses to finalize a 60s video as a single prompt", () => {
    const stubs: SceneProduction[] = [
      {
        number: 1,
        duration: 10,
        characters: ["CHARACTER_01"],
        location: "set",
        action: "Toute l'histoire",
        emotion: "",
        camera: "",
        lighting: "",
        visualStyle: "",
        audio: "",
        dialogue: "Sarah : tout. Marc : tout.",
        videoPrompt: "one giant prompt",
        continuityNotes: "",
      },
    ];
    const out = collapseProductionScenes(stubs, 60);
    assert.equal(out.length, 6);
    assert.ok(out.every((s) => s.duration <= 10));
  });
});

describe("proposeSegments", () => {
  it("yields a single segment for a short clip", () => {
    const segs = proposeSegments(10, [0.2, 2, 5, 9]);
    assert.equal(segs.length, 1);
    assert.equal(segs[0]?.start, 0);
    assert.equal(segs[0]?.end, 10);
  });

  it("splits a 60s video into 6 windows of 10s", () => {
    const segs = proposeSegments(60, [1, 12, 25, 38, 49, 58]);
    assert.equal(segs.length, 6);
    assert.equal(segs[0]?.start, 0);
    assert.equal(segs[0]?.end, 10);
    assert.equal(segs[5]?.start, 50);
    assert.equal(segs[5]?.end, 60);
  });
});

describe("idea scenes", () => {
  it("maps one minute to six 10-second scenes", () => {
    assert.equal(ideaSceneCount(60), 6);
    assert.equal(ideaSceneCount(30), 3);
  });

  it("picks a default duration from idea length", () => {
    assert.equal(defaultIdeaDuration("trahison familiale"), 30);
  });
});
