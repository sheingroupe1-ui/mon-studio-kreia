import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { styleFromUserChoice, VISUAL_STYLE_REGISTRY } from "./visual-styles.ts";

describe("styleFromUserChoice", () => {
  it("locks the cinematic preset phrase", () => {
    const style = styleFromUserChoice("cinematic-real");
    assert.equal(style.confidence, "proposed");
    assert.match(style.lockedStylePhrase, /cinéma réaliste/i);
    assert.equal(style.renderType, "live-action photoréaliste");
  });

  it("uses custom text as the locked phrase", () => {
    const style = styleFromUserChoice("custom", "grain 16 mm, lumière de couloir");
    assert.match(style.lockedStylePhrase, /grain 16 mm/);
  });

  it("exposes a custom option among presets", () => {
    assert.ok(VISUAL_STYLE_REGISTRY.some((s) => s.id === "custom"));
  });
});
