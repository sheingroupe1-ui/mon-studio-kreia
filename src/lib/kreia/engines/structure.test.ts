import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { fallbackStructure } from "./structure.ts";

describe("fallbackStructure", () => {
  it("covers a 10s video with a single main segment", () => {
    const out = fallbackStructure(10, [0.2, 5, 9.6]);
    assert.equal(out.structureStatus, "fallback");
    assert.equal(out.segments.length, 1);
    assert.equal(out.segments[0]?.start, 0);
    assert.equal(out.segments[0]?.end, 10);
  });

  it("never throws on invalid duration or empty frames", () => {
    const out = fallbackStructure(Number.NaN, []);
    assert.ok(out.segments.length >= 1);
    assert.equal(out.segments[0]?.start, 0);
  });

  it("splits a longer video into several segments", () => {
    const out = fallbackStructure(40, [1, 10, 20, 30, 39]);
    assert.ok(out.segments.length >= 2);
    assert.equal(out.segments[0]?.start, 0);
    assert.equal(out.segments.at(-1)?.end, 40);
  });
});
