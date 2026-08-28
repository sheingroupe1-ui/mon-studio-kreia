import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { applySpeakerAssignments } from "./speaker-assign.ts";
import { emptyPerformance } from "./dialogues.ts";
import type { CharacterSheet, DialogueLine } from "../types.ts";

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

function line(id: string, text: string, speakerId = "CHARACTER_01"): DialogueLine {
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
});
