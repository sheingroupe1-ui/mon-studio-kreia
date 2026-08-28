import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { CAST_BATCH_SIZE, listCastBatches, pickOverview } from "./cast.ts";
import type { FrameCapture } from "../types.ts";

function frame(t: number): FrameCapture {
  return { t, dataUrl: `data:image/jpeg;base64,${"A".repeat(40)}` };
}

describe("cast batches", () => {
  it("uses every captured frame instead of 6 temporal samples", () => {
    const frames = Array.from({ length: 12 }, (_, i) => frame(i));
    const overview = pickOverview(frames);
    assert.equal(overview.length, 12);
  });

  it("splits into lots of 3 so one HTTP poll never runs multiple AI calls", () => {
    const frames = Array.from({ length: 12 }, (_, i) => frame(i));
    const batches = listCastBatches(frames);
    assert.equal(CAST_BATCH_SIZE, 3);
    assert.equal(batches.length, 4);
    assert.ok(batches.every((b) => b.length <= 3));
  });
});
