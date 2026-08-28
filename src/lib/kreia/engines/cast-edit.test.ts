import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { blankCharacter, mergeCharacterPair } from "./cast-edit.ts";

describe("cast-edit", () => {
  it("merges two appearances into one character", () => {
    const a = blankCharacter("human", 0);
    a.name = "Sarah";
    a.hair = "noir";
    const b = blankCharacter("human", 1);
    b.name = "Sarah";
    b.clothing = "manteau rouge";
    const merged = mergeCharacterPair(a, b);
    assert.equal(merged.name, "Sarah");
    assert.match(merged.clothing, /manteau/);
    assert.equal(merged.userLocked, true);
  });
});
