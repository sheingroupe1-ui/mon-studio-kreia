import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  isPostTransportError,
  jpegPayload,
  JOB_MISSING_MESSAGE,
  JOB_TRANSPORT_MESSAGE,
  JobTransportError,
  looksLikeHtml,
  messageFromHttpBody,
  parseJobSnapshot,
} from "./job-protocol.ts";

describe("parseJobSnapshot", () => {
  it("reads a pending job", () => {
    const got = parseJobSnapshot({
      id: "job_0",
      type: "analyze",
      status: "pending",
      frameCount: 0,
    });
    assert.equal(got.status, "pending");
    assert.equal(got.frameCount, 0);
  });

  it("reads a running job", () => {
    assert.deepEqual(parseJobSnapshot({ id: "job_1", type: "analyze", status: "running" }), {
      id: "job_1",
      status: "running",
      result: undefined,
      error: undefined,
      frameCount: undefined,
      progress: undefined,
    });
  });

  it("reads an ok job with result", () => {
    const got = parseJobSnapshot({
      id: "job_2",
      status: "ok",
      result: { ok: true, analysis: { title: "x" } },
    });
    assert.equal(got.status, "ok");
    assert.equal((got.result as { ok: boolean }).ok, true);
  });

  it("reads an error job", () => {
    const got = parseJobSnapshot({ id: "job_3", status: "error", error: "boom" });
    assert.equal(got.status, "error");
    assert.equal(got.error, "boom");
  });

  it("rejects missing id", () => {
    assert.throws(
      () => parseJobSnapshot({ status: "running" }),
      new RegExp(JOB_TRANSPORT_MESSAGE.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")),
    );
  });

  it("rejects unknown status", () => {
    assert.throws(
      () => parseJobSnapshot({ id: "job_4", status: "queued" }),
      new RegExp(JOB_TRANSPORT_MESSAGE.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")),
    );
  });
});

describe("JobTransportError", () => {
  it("marks post vs poll", () => {
    assert.equal(isPostTransportError(new JobTransportError("x", "post")), true);
    assert.equal(isPostTransportError(new JobTransportError("x", "poll")), false);
    assert.equal(isPostTransportError(new Error("Failed to fetch")), false);
  });
});

describe("looksLikeHtml", () => {
  it("detects Cloudflare error pages", () => {
    assert.equal(
      looksLikeHtml(
        '<!DOCTYPE html> <!--[if lt IE 7]> <html class="no-js ie6 oldie" lang="en-US">',
      ),
      true,
    );
    assert.equal(looksLikeHtml('{"id":"job_1","status":"running"}'), false);
  });
});

describe("jpegPayload", () => {
  it("strips a data URL prefix", () => {
    assert.equal(jpegPayload("data:image/jpeg;base64,abc"), "abc");
    assert.equal(jpegPayload("abc"), "abc");
  });
});

describe("messageFromHttpBody", () => {
  it("does not surface raw JSON 404 bodies", () => {
    assert.equal(
      messageFromHttpBody('{"ok":false,"error":"Introuvable."}', 404),
      JOB_MISSING_MESSAGE,
    );
    assert.equal(messageFromHttpBody("Introuvable.", 404), JOB_MISSING_MESSAGE);
  });

  it("keeps a readable server error", () => {
    assert.equal(
      messageFromHttpBody('{"ok":false,"error":"Trop d\'images."}', 400),
      "Trop d'images.",
    );
  });
});
