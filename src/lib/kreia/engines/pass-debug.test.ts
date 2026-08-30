import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { formatDialoguePassDebug, emptyDialoguePassDebug, formatProductionPromptDebug } from "./pass-debug.ts";

describe("formatDialoguePassDebug", () => {
  it("renders speaker and relationship flags", () => {
    const debug = emptyDialoguePassDebug();
    debug.speakersAttempted = true;
    debug.speakersOk = true;
    debug.speakersMatched = "4/5";
    debug.relationshipsAttempted = true;
    debug.relationshipsOk = false;
    debug.relationshipsError = "timeout";
    debug.relationshipsFilled = "0/2";
    const text = formatDialoguePassDebug(debug);
    assert.match(text, /transcriptOk=/);
    assert.match(text, /transcriptError=/);
    assert.match(text, /speakersAttempted=true/);
    assert.match(text, /speakersOk=true/);
    assert.match(text, /speakersMatched=4\/5/);
    assert.match(text, /speakerSceneProgress=/);
    assert.match(text, /relationshipsAttempted=true/);
    assert.match(text, /relationshipsOk=false/);
    assert.match(text, /relationshipsFilled=0\/2/);
    assert.match(text, /relationshipsError=timeout/);
  });
});

describe("formatProductionPromptDebug", () => {
  it("renders formattedPrompt flags from the checkpoint", () => {
    const text = formatProductionPromptDebug({
      productionFormattedPromptOk: true,
      productionFormattedPromptSample: 's1 fmtOk=true fmt="🎬 SCÈNE 1"',
    });
    assert.match(text, /productionFormattedPromptOk=true/);
    assert.match(text, /🎬 SCÈNE 1/);
  });
});
