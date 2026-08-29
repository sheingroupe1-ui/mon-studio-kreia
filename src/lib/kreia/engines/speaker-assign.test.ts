import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { applySpeakerAssignments, candidateIdsForScene, parseSceneTimeWindow, pickFramesForScene } from "./speaker-assign.ts";
import { emptyPerformance } from "./dialogues.ts";
import type { CharacterSheet, DialogueLine, FrameCapture } from "../types.ts";

function character(id: string, name: string): CharacterSheet {
  return {
    id,
    designation: name,
    name,
    sourceName: name,
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
  };
}

function line(id: string, text: string, speakerId: string | null = "CHARACTER_01"): DialogueLine {
  return {
    id,
    sceneNumber: 1,
    order: Number(id.slice(1)),
    speakerId,
    speakerLabel: "Marie",
    sourceText: text,
    displayText: text,
    timeHint: "",
    emotion: "",
    intention: "",
    confidence: "clear",
    attribution: "certain",
    performance: emptyPerformance(),
  };
}

describe("applySpeakerAssignments", () => {
  it("reassigns each replica without changing the words", () => {
    const marie = character("CHARACTER_01", "Marie");
    const jean = character("CHARACTER_02", "Jean");
    const out = applySpeakerAssignments(
      [line("D001", "Tu savais pour elle."), line("D002", "Oui.")],
      [
        { id: "D001", speakerId: "CHARACTER_01" },
        { id: "D002", speakerId: "CHARACTER_02" },
      ],
      [marie, jean],
    );
    assert.equal(out[0]?.speakerId, "CHARACTER_01");
    assert.equal(out[1]?.speakerId, "CHARACTER_02");
    assert.equal(out[1]?.speakerLabel, "Jean");
    assert.equal(out[0]?.sourceText, "Tu savais pour elle.");
    assert.equal(out[1]?.sourceText, "Oui.");
  });

  it("maps a narrator label without attaching it to a character", () => {
    const marie = character("CHARACTER_01", "Marie");
    const out = applySpeakerAssignments(
      [line("D001", "Ils ne se parlèrent plus.")],
      [{ id: "D001", speakerLabel: "Narrateur" }],
      [marie],
    );
    assert.equal(out[0]?.speakerId, "NARRATOR");
    assert.equal(out[0]?.sourceText, "Ils ne se parlèrent plus.");
  });

  it("rejects a speaker who is not in the scene", () => {
    const marie = character("CHARACTER_01", "Marie");
    const jean = character("CHARACTER_02", "Jean");
    const lea = character("CHARACTER_03", "Léa");
    const replica = line("D001", "Papa, arrête.", null);
    const out = applySpeakerAssignments(
      [replica],
      [{ id: "D001", speakerId: "CHARACTER_03" }],
      [marie, jean, lea],
      new Map([[1, ["CHARACTER_01", "CHARACTER_02"]]]),
    );
    assert.equal(out[0]?.speakerId, null);
    assert.equal(out[0]?.sourceText, "Papa, arrête.");
  });

  it("accepts a candidate who is present in the scene", () => {
    const marie = character("CHARACTER_01", "Marie");
    const jean = character("CHARACTER_02", "Jean");
    const lea = character("CHARACTER_03", "Léa");
    const replica = line("D001", "Léa, tais-toi.", null);
    const out = applySpeakerAssignments(
      [replica],
      [{ id: "D001", speakerId: "CHARACTER_02" }],
      [marie, jean, lea],
      new Map([[1, ["CHARACTER_01", "CHARACTER_02", "CHARACTER_03"]]]),
    );
    assert.equal(out[0]?.speakerId, "CHARACTER_02");
    assert.equal(out[0]?.speakerLabel, "Jean");
  });
});

describe("pickFramesForScene", () => {
  it("picks frames inside the scene window", () => {
    const jpeg = "data:image/jpeg;base64," + "A".repeat(40);
    const frames: FrameCapture[] = [
      { t: 1, dataUrl: jpeg },
      { t: 5, dataUrl: jpeg },
      { t: 12, dataUrl: jpeg },
    ];
    const picked = pickFramesForScene(
      frames,
      {
        number: 1,
        estimatedDuration: 10,
        startHint: "0 → 10",
        characters: ["CHARACTER_01"],
        setting: "",
        action: "",
        emotion: "",
        camera: "",
        lighting: "",
        audio: "",
        dialogue: null,
        dialogueSpeaker: null,
        styleNotes: "",
        confidence: "observed",
        silentReactions: [],
      },
      [],
    );
    assert.equal(picked.length, 2);
    assert.equal(picked[0]?.t, 1);
    assert.equal(picked[1]?.t, 5);
  });

  it("parses MM:SS clocks used by the pipeline startHint", () => {
    const window = parseSceneTimeWindow(
      {
        number: 2,
        estimatedDuration: 10,
        startHint: "00:10 → 00:20",
        characters: [],
        setting: "",
        action: "",
        emotion: "",
        camera: "",
        lighting: "",
        audio: "",
        dialogue: null,
        dialogueSpeaker: null,
        styleNotes: "",
        confidence: "observed",
        silentReactions: [],
      },
      [],
    );
    assert.equal(window.start, 10);
    assert.equal(window.end, 20);
  });
});

describe("candidateIdsForScene", () => {
  it("does not keep a one-character dump when several people speak", () => {
    const marie = character("CHARACTER_01", "Marie");
    const jean = character("CHARACTER_02", "Jean");
    const lea = character("CHARACTER_03", "Léa");
    const ids = candidateIdsForScene(
      {
        number: 1,
        estimatedDuration: 10,
        startHint: "00:00 → 00:10",
        characters: ["CHARACTER_01"],
        setting: "",
        action: "",
        emotion: "",
        camera: "",
        lighting: "",
        audio: "",
        dialogue: null,
        dialogueSpeaker: null,
        styleNotes: "",
        confidence: "observed",
        silentReactions: [],
      },
      [marie, jean, lea],
      [line("D001", "Tu savais.", null), line("D002", "Oui.", null)],
    );
    assert.deepEqual(ids.sort(), ["CHARACTER_01", "CHARACTER_02", "CHARACTER_03"]);
  });
});
