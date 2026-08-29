import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { applyRelationshipUpdates, sceneRelationshipNotes } from "./relationships.ts";
import type { CharacterSheet } from "../types.ts";

function character(id: string, name: string, relationships = ""): CharacterSheet {
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
    relationships,
    prominence: "principal",
    lockedTraits: [],
    notes: "",
  };
}

describe("applyRelationshipUpdates", () => {
  it("fills relationships without touching identity", () => {
    const marie = character("CHARACTER_01", "Marie");
    const jean = character("CHARACTER_02", "Jean");
    const out = applyRelationshipUpdates([marie, jean], [
      { id: "CHARACTER_01", relationships: "Épouse de CHARACTER_02." },
      { id: "CHARACTER_02", relationships: "Mari de CHARACTER_01." },
    ]);
    assert.equal(out[0]?.relationships, "Épouse de CHARACTER_02.");
    assert.equal(out[1]?.relationships, "Mari de CHARACTER_01.");
    assert.equal(out[0]?.name, "Marie");
  });
});

describe("sceneRelationshipNotes", () => {
  it("only lists present characters", () => {
    const roster = [
      character("CHARACTER_01", "Marie", "Épouse de Jean."),
      character("CHARACTER_02", "Jean", "Mari de Marie."),
      character("CHARACTER_03", "Léa", "Inconnue."),
    ];
    const notes = sceneRelationshipNotes(roster, ["CHARACTER_01", "CHARACTER_02"]);
    assert.match(notes, /Marie/);
    assert.match(notes, /Jean/);
    assert.equal(notes.includes("Léa"), false);
  });
});
