import type { CharacterSheet, ProjectKind } from "../types";
import { normalizeCharacterIds } from "./cast.ts";
import { identityFingerprint, stableIdFor } from "./identity.ts";

export function blankCharacter(kind: ProjectKind, index: number): CharacterSheet {
  const type =
    kind === "fruit-humanoid" ? "fruit_humanoid" : kind === "angel" ? "angel" : "unknown_character";
  return {
    id: stableIdFor(index, kind, type),
    designation: `Personnage ${index + 1}`,
    name: null,
    sourceName: null,
    nameConfidence: "proposed",
    characterType: type,
    species: "",
    bodyStructure: "",
    distinctiveFeatures: "",
    wings: "",
    halo: "",
    identityFingerprint: "",
    firstSeen: "",
    lastSeen: "",
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
    prominence: index === 0 ? "principal" : "secondary",
    lockedTraits: [],
    notes: "Ajouté manuellement.",
    userLocked: true,
  };
}

export function mergeCharacterPair(keep: CharacterSheet, drop: CharacterSheet): CharacterSheet {
  const merged: CharacterSheet = {
    ...keep,
    designation: keep.designation || drop.designation,
    name: keep.name || drop.name,
    sourceName: keep.sourceName || drop.sourceName,
    appearance: keep.appearance || drop.appearance,
    complexion: keep.complexion || drop.complexion,
    morphology: keep.morphology || drop.morphology,
    hair: keep.hair || drop.hair,
    eyes: keep.eyes || drop.eyes,
    clothing: keep.clothing || drop.clothing,
    accessories: keep.accessories || drop.accessories,
    species: keep.species || drop.species,
    bodyStructure: keep.bodyStructure || drop.bodyStructure,
    distinctiveFeatures: keep.distinctiveFeatures || drop.distinctiveFeatures,
    wings: keep.wings || drop.wings,
    halo: keep.halo || drop.halo,
    ageApparent: keep.ageApparent || drop.ageApparent,
    role: keep.role || drop.role,
    personality: keep.personality || drop.personality,
    relationships: keep.relationships || drop.relationships,
    firstSeen: keep.firstSeen || drop.firstSeen,
    lastSeen: drop.lastSeen || keep.lastSeen,
    lockedTraits: [...new Set([...(keep.lockedTraits ?? []), ...(drop.lockedTraits ?? [])])],
    notes: [keep.notes, drop.notes].filter(Boolean).join(" · "),
    userLocked: true,
  };
  merged.identityFingerprint = identityFingerprint(merged);
  return merged;
}

export function reindexCharacters(list: CharacterSheet[], kind: ProjectKind): CharacterSheet[] {
  return normalizeCharacterIds(
    list.map((c) => ({ ...c, userLocked: c.userLocked ?? true })),
    kind,
  );
}

function keyOf(c: CharacterSheet): string {
  return [
    (c.name || c.designation || "").toLowerCase().trim(),
    (c.hair || "").toLowerCase().trim(),
    (c.clothing || "").toLowerCase().trim(),
    (c.eyes || "").toLowerCase().trim(),
  ].join("|");
}

export function duplicateWarnings(list: CharacterSheet[]): string[] {
  const warnings: string[] = [];
  for (let i = 0; i < list.length; i++) {
    for (let j = i + 1; j < list.length; j++) {
      const a = list[i]!;
      const b = list[j]!;
      const printA = identityFingerprint(a);
      const printB = identityFingerprint(b);
      if (printA && printB && printA === printB) {
        warnings.push(`${a.id} et ${b.id} semblent être la même personne — fusionnez-les si c’est le cas.`);
        continue;
      }
      if (keyOf(a) && keyOf(a) === keyOf(b)) {
        warnings.push(`${a.id} et ${b.id} ont une apparence très proche.`);
      }
    }
  }
  return warnings;
}
