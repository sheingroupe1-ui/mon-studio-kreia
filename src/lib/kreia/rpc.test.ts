import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  failMessage,
  fitAnalyzePayload,
  isTransportError,
  MAX_ANALYZE_CHARS,
  readServerResult,
  TRANSPORT_MESSAGE,
  userFacingError,
} from "./rpc.ts";

describe("readServerResult", () => {
  it("returns an already-unwrapped handler value", () => {
    const value = { ok: true as const, analysis: { title: "x" } };
    assert.equal(readServerResult(value, "t"), value);
  });

  it("unwraps the TanStack Start envelope { result, error }", () => {
    const inner = { ok: false as const, error: "boom" };
    const got = readServerResult({ result: inner, error: undefined }, "t");
    assert.deepEqual(got, inner);
  });

  it("throws a French transport message when the RPC value is undefined", () => {
    assert.throws(
      () => readServerResult(undefined, "analyzeVideo"),
      new RegExp(TRANSPORT_MESSAGE.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")),
    );
  });

  it("throws a French transport message when the RPC value is null", () => {
    assert.throws(
      () => readServerResult(null, "analyzeVideo"),
      new RegExp(TRANSPORT_MESSAGE.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")),
    );
  });

  it("throws a French transport message for JSON without ok", () => {
    assert.throws(
      () => readServerResult({ status: 413 } as unknown, "analyzeVideo"),
      new RegExp(TRANSPORT_MESSAGE.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")),
    );
  });

  it("rethrows envelope Error", () => {
    assert.throws(
      () => readServerResult({ result: undefined, error: new Error("payload too large") }, "t"),
      /payload too large/,
    );
  });

  it("throws string error from a non-ok envelope", () => {
    assert.throws(
      () => readServerResult({ error: "Forbidden" }, "t"),
      /Forbidden/,
    );
  });
});

describe("userFacingError", () => {
  it("maps the historic .ok crash to a transport message", () => {
    assert.equal(
      userFacingError(
        new Error("Cannot read properties of undefined (reading 'ok')"),
        "fallback",
      ),
      TRANSPORT_MESSAGE,
    );
  });

  it("maps Cloudflare HTML to a transport message", () => {
    assert.equal(
      userFacingError(
        new Error(
          '<!DOCTYPE html> <!--[if lt IE 7]> <html class="no-js ie6 oldie" lang="en-US">',
        ),
        "x",
      ),
      TRANSPORT_MESSAGE,
    );
  });

  it("maps TanStack transport invariants to an invalid-response message", () => {
    assert.match(
      userFacingError(
        new Error("Invariant failed: expected content-type header to be set"),
        "x",
      ),
      /réponse reçue est invalide/,
    );
  });

  it("detects transport errors", () => {
    assert.equal(isTransportError(new Error("Failed to fetch")), true);
    assert.equal(isTransportError(new Error("payload too large")), true);
    assert.equal(isTransportError(new Error("JSON illisible")), false);
  });
});

describe("failMessage", () => {
  it("prefers error then message", () => {
    assert.equal(failMessage({ error: "e" }, "f"), "e");
    assert.equal(failMessage({ message: "m" }, "f"), "m");
    assert.equal(failMessage({}, "f"), "f");
  });

  it("hides HTML error bodies", () => {
    assert.equal(
      failMessage({ error: "<!DOCTYPE html> <!--[if lt IE 7]>" }, "safe"),
      "safe",
    );
  });
});

describe("fitAnalyzePayload", () => {
  it("drops audio before frames when over budget", () => {
    const frames = [
      { t: 0, dataUrl: "a".repeat(120_000) },
      { t: 1, dataUrl: "b".repeat(120_000) },
      { t: 2, dataUrl: "c".repeat(120_000) },
      { t: 3, dataUrl: "d".repeat(120_000) },
    ];
    const fitted = fitAnalyzePayload({
      frames,
      audioWavBase64: "x".repeat(200_000),
    });
    assert.equal(fitted.droppedAudio, true);
    assert.equal(fitted.audioWavBase64, null);
    assert.ok(fitted.frames.length >= 2);
    const size = fitted.frames.reduce((n, f) => n + f.dataUrl.length, 0);
    assert.ok(size <= MAX_ANALYZE_CHARS);
  });

  it("keeps a small payload intact", () => {
    const frames = [
      { t: 0, dataUrl: "data:image/jpeg;base64,aaa" },
      { t: 1, dataUrl: "data:image/jpeg;base64,bbb" },
    ];
    const fitted = fitAnalyzePayload({ frames, audioWavBase64: "wav" });
    assert.equal(fitted.droppedAudio, false);
    assert.equal(fitted.droppedFrames, 0);
    assert.equal(fitted.audioWavBase64, "wav");
    assert.equal(fitted.frames.length, 2);
  });
});
