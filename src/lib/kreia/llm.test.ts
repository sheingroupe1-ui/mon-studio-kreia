import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { formatSttWords, keepWordsInOwnWindow } from "./llm.ts";

describe("keepWordsInOwnWindow", () => {
  it("drops overlap words before ownStart and after ownEnd", () => {
    const chunk = { t: 4, ownStart: 5, ownEnd: 10 };
    const kept = keepWordsInOwnWindow(
      [
        { text: "laisse-moi", start: 0.2 },
        { text: "réfléchir", start: 0.8 },
        { text: "Mon", start: 1.2 },
        { text: "fils", start: 1.5 },
        { text: "avec", start: 6.4 },
      ],
      chunk,
    );
    assert.deepEqual(
      kept.map((w) => w.text),
      ["Mon", "fils"],
    );
    assert.equal(kept[0]?.start, 5.2);
  });

  it("formats kept words with absolute timestamps", () => {
    const kept = keepWordsInOwnWindow(
      [
        { text: "Regarde", start: 1 },
        { text: "un", start: 1.2 },
        { text: "peu", start: 1.4 },
      ],
      { t: 0, ownStart: 0, ownEnd: 5 },
    );
    const text = formatSttWords(kept);
    assert.match(text, /\[1\.0s\]/);
    assert.match(text, /Regarde un peu/);
  });
});
