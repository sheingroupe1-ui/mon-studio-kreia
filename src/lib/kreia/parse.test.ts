import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { mergeCharacters, normalizeCharacterIds } from "./engines/cast.ts";
import { extractJson, parseCastResult, parseCharacter, tryExtractJson } from "./parse.ts";
import type { CharacterSheet } from "./types.ts";

function sheet(partial: Partial<CharacterSheet> & { id: string }): CharacterSheet {
  return {
    designation: "Perso",
    name: null,
    nameConfidence: "inferred",
    characterType: "unknown",
    ageApparent: "",
    sex: "",
    appearance: "",
    complexion: "",
    morphology: "",
    hair: "",
    eyes: "",
    clothing: "",
    accessories: "",
    role: "",
    personality: "",
    relationships: "",
    prominence: "secondary",
    lockedTraits: [],
    notes: "",
    ...partial,
  };
}

describe("parseCharacter", () => {
  it("accepts a payload without name, age or gender", () => {
    const c = parseCharacter({ id: "CHARACTER_01", designation: "Femme en rouge" }, 0);
    assert.equal(c.id, "CHARACTER_01");
    assert.equal(c.name, null);
    assert.equal(c.ageApparent, "");
    assert.equal(c.sex, "");
  });

  it("assigns an angel id for an angel character", () => {
    const c = parseCharacter({ designation: "Ange aux ailes blanches", characterType: "angel", wings: "deux ailes" }, 0, "angel");
    assert.equal(c.id, "ANGEL_CHARACTER_01");
    assert.equal(c.characterType, "angel");
    assert.match(c.wings ?? "", /ailes/);
  });

  it("does not throw when the row is null", () => {
    const c = parseCharacter(null, 2);
    assert.match(c.id, /CHARACTER_03/);
    assert.equal(c.designation, "Personnage 3");
  });
});

describe("parseCastResult", () => {
  it("treats missing characters as an empty list, not a crash", () => {
    const parsed = parseCastResult('{"observedSummary":"ciel"}');
    assert.ok(parsed);
    assert.equal(parsed!.characters.length, 0);
    assert.equal(parsed!.observedSummary, "ciel");
  });

  it("recovers characters from a truncated JSON object", () => {
    const parsed = parseCastResult(
      '{"observedSummary":"deux persos","characters":[{"id":"CHARACTER_01","designation":"Marie","name":null}',
    );
    assert.ok(parsed);
    assert.equal(parsed!.characters[0]?.id, "CHARACTER_01");
    assert.equal(parsed!.characters[0]?.name, null);
  });

  it("skips a malformed character row and keeps the others", () => {
    const parsed = parseCastResult(
      JSON.stringify({
        characters: [{ id: "CHARACTER_01", designation: "A" }, "oops", { id: "CHARACTER_02", designation: "B" }],
      }),
    );
    assert.equal(parsed?.characters.length, 3);
    assert.equal(parsed?.characters[0]?.id, "CHARACTER_01");
    assert.equal(parsed?.characters[2]?.id, "CHARACTER_02");
  });

  it("reads characters from a nested data object or a root array", () => {
    const nested = parseCastResult(
      JSON.stringify({ data: { characters: [{ designation: "Ange", characterType: "angel" }] } }),
    );
    assert.equal(nested.characters[0]?.characterType, "angel");
    const arr = parseCastResult(JSON.stringify([{ designation: "Fraise", characterType: "fruit_humanoid" }]));
    assert.equal(arr.characters[0]?.characterType, "fruit_humanoid");
  });

  it("never returns null on garbage text", () => {
    const parsed = parseCastResult("not json at all");
    assert.equal(parsed.characters.length, 0);
    assert.ok(parsed.limitations.length);
  });
});

describe("extractJson", () => {
  it("repairs a truncated object", () => {
    const out = extractJson('{"a":1,"b":{"c":2');
    assert.deepEqual(out, { a: 1, b: { c: 2 } });
  });

  it("returns null via tryExtractJson on empty text", () => {
    assert.equal(tryExtractJson(""), null);
  });
});

describe("mergeCharacters", () => {
  it("does not duplicate the same person seen in two frames", () => {
    const first = [sheet({ id: "CHARACTER_01", designation: "Marie", clothing: "robe bleue" })];
    const second = [sheet({ id: "CHARACTER_01", designation: "Marie", hair: "chignon" })];
    const merged = mergeCharacters(first, second, "human");
    assert.equal(merged.length, 1);
    assert.equal(merged[0]?.clothing, "robe bleue");
    assert.equal(merged[0]?.hair, "chignon");
  });

  it("keeps two similar fruits distinct when clothes differ", () => {
    const a = sheet({
      id: "FRUIT_CHARACTER_01",
      designation: "Fraise",
      species: "fraise",
      clothing: "veste jaune",
      eyes: "grands yeux",
      characterType: "fruit_humanoid",
    });
    const b = sheet({
      id: "FRUIT_CHARACTER_02",
      designation: "Fraise",
      species: "fraise",
      clothing: "manteau bleu",
      eyes: "grands yeux",
      characterType: "fruit_humanoid",
    });
    const merged = mergeCharacters([a], [b], "fruit-humanoid");
    assert.equal(merged.length, 2);
  });

  it("rewrites human ids to fruit ids for fruit-humanoid projects", () => {
    const out = normalizeCharacterIds(
      [sheet({ id: "CHARACTER_01", designation: "Pastèque", characterType: "unknown" })],
      "fruit-humanoid",
    );
    assert.equal(out[0]?.id, "FRUIT_CHARACTER_01");
    assert.equal(out[0]?.characterType, "fruit_humanoid");
  });
});
