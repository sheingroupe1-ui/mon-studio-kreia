export function createId(prefix = "prj"): string {
  const rand =
    typeof crypto !== "undefined" && crypto.randomUUID
      ? crypto.randomUUID().slice(0, 8)
      : Math.random().toString(36).slice(2, 10);
  return `${prefix}_${Date.now().toString(36)}_${rand}`;
}

export function characterId(index: number): string {
  return `CHARACTER_${String(index).padStart(2, "0")}`;
}

export function fruitCharacterId(index: number): string {
  return `FRUIT_CHARACTER_${String(index).padStart(2, "0")}`;
}

export function angelCharacterId(index: number): string {
  return `ANGEL_CHARACTER_${String(index).padStart(2, "0")}`;
}

export function ensureCharacterIds(ids: string[], count: number): string[] {
  const next = [...ids];
  let i = 1;
  while (next.length < count) {
    const id = characterId(i);
    if (!next.includes(id)) next.push(id);
    i += 1;
  }
  return next;
}
