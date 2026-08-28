import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { nextIdeaPhase, resumeIdeaPhase } from "./idea-stages.ts";
import type { IdeaCheckpoint } from "./types.ts";

describe("idea workflow", () => {
  it("resumes at the first incomplete phase", () => {
    const cp: IdeaCheckpoint = {
      version: 1,
      phase: "characters",
      completed: ["understand", "story"],
    };
    assert.equal(resumeIdeaPhase(cp), "characters");
  });

  it("never routes idea phases through video steps", () => {
    assert.equal(nextIdeaPhase("understand"), "story");
    assert.equal(nextIdeaPhase("characters"), "visual");
    assert.equal(nextIdeaPhase("prepare"), "done");
  });
});
