import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { formatDialoguePassDebug, emptyDialoguePassDebug } from "./pass-debug.ts";

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
    assert.match(text, /speakers attempted=true ok=true matched=4\/5/);
    assert.match(text, /relationships attempted=true ok=false filled=0\/2/);
    assert.match(text, /relationshipsError=timeout/);
  });
});
