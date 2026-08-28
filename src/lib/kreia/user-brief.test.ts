import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { briefCountWarning, emptyBrief, formatUserBrief, isBriefEmpty } from "./user-brief.ts";

describe("user-brief", () => {
  it("treats an empty brief as skippable", () => {
    assert.equal(isBriefEmpty(emptyBrief()), true);
    assert.equal(formatUserBrief(emptyBrief()), "");
  });

  it("formats story and character hints without treating them as closed truth", () => {
    const text = formatUserBrief({
      story: "Une femme découvre un mensonge.",
      characters: [{ id: "1", name: "Sarah", description: "robe rouge" }],
      expectedCount: "2",
      keep: "le bracelet",
      extra: "",
    });
    assert.match(text, /liste NON fermée/);
    assert.match(text, /Sarah/);
    assert.match(text, /bracelet/);
  });

  it("warns when the user count disagrees with detection", () => {
    assert.equal(briefCountWarning("2", 3)?.includes("2"), true);
    assert.equal(briefCountWarning("3", 3), null);
    assert.equal(briefCountWarning("", 2), null);
  });
});
