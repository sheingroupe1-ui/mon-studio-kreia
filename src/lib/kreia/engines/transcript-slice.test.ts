import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { sliceTranscriptForWindow, linesFromSegmentPayload } from "./transcript-slice.ts";
import type { CharacterSheet } from "../types.ts";

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

describe("sliceTranscriptForWindow", () => {
  it("keeps only timed lines inside the window", () => {
    const transcript = [
      "[00:03] Marie : Tu savais.",
      "[00:12] Jean : Oui.",
      "[00:22] Marie : Pourquoi ?",
    ].join("\n");
    const slice = sliceTranscriptForWindow(transcript, 10, 20, 60);
    assert.match(slice, /Oui/);
    assert.equal(slice.includes("Tu savais"), false);
    assert.equal(slice.includes("Pourquoi"), false);
  });

  it("splits untimed utterances across 60s into six windows", () => {
    const transcript = ["A", "B", "C", "D", "E", "F"].join("\n");
    const first = sliceTranscriptForWindow(transcript, 0, 10, 60);
    const last = sliceTranscriptForWindow(transcript, 50, 60, 60);
    assert.match(first, /A/);
    assert.equal(first.includes("F"), false);
    assert.match(last, /F/);
    assert.equal(last.includes("A"), false);
  });
});

describe("linesFromSegmentPayload", () => {
  it("does not copy the whole transcript into one scene", () => {
    const marie = character("CHARACTER_01", "Marie");
    const lines = linesFromSegmentPayload(
      { dialogues: [{ speaker: "Marie", text: "Tu savais.", startTime: 12 }] },
      {
        sceneNumber: 2,
        start: 10,
        end: 20,
        characters: [marie],
        transcriptSlice: "Marie : Tu savais.",
      },
    );
    assert.equal(lines.length, 1);
    assert.equal(lines[0]?.sceneNumber, 2);
    assert.equal(lines[0]?.sourceText.includes("Tu savais"), true);
    assert.ok((lines[0]?.startTime ?? 0) >= 10);
    assert.ok((lines[0]?.startTime ?? 0) < 20);
  });
});
