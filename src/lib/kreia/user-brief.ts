export type BriefCharacterHint = {
  id: string;
  name: string;
  description: string;
};

export type UserBrief = {
  story: string;
  characters: BriefCharacterHint[];
  expectedCount: string;
  keep: string;
  extra: string;
};

export function emptyBrief(): UserBrief {
  return { story: "", characters: [], expectedCount: "", keep: "", extra: "" };
}

export function isBriefEmpty(brief: UserBrief | null | undefined): boolean {
  if (!brief) return true;
  return (
    !brief.story.trim() &&
    !brief.keep.trim() &&
    !brief.extra.trim() &&
    !brief.expectedCount.trim() &&
    !brief.characters.some((c) => c.name.trim() || c.description.trim())
  );
}

export function formatUserBrief(brief: UserBrief | null | undefined): string {
  if (!brief || isBriefEmpty(brief)) return "";
  const lines: string[] = [
    "BRIEF UTILISATEUR — contexte complémentaire, à croiser avec la vidéo. Ce n'est pas une vérité absolue.",
  ];
  if (brief.story.trim()) lines.push(`Résumé de l'histoire : ${brief.story.trim()}`);
  const named = brief.characters.filter((c) => c.name.trim() || c.description.trim());
  if (named.length) {
    lines.push("Personnages indiqués par l'utilisateur (indices, liste NON fermée — chercher aussi les autres) :");
    for (const [i, c] of named.entries()) {
      lines.push(`- ${c.name.trim() || `Personnage ${i + 1}`}${c.description.trim() ? ` : ${c.description.trim()}` : ""}`);
    }
  }
  if (brief.expectedCount.trim()) {
    lines.push(`Nombre de personnages remarqués par l'utilisateur : ${brief.expectedCount.trim()}`);
  }
  if (brief.keep.trim()) lines.push(`Éléments à conserver absolument : ${brief.keep.trim()}`);
  if (brief.extra.trim()) lines.push(`Précisions : ${brief.extra.trim()}`);
  return lines.join("\n");
}

export function parseExpectedCount(value: string): number | null {
  const n = Number.parseInt(value.trim(), 10);
  return Number.isFinite(n) && n > 0 ? n : null;
}

export function briefCountWarning(expected: string, found: number): string | null {
  const n = parseExpectedCount(expected);
  if (!n || !found || n === found) return null;
  return `Vous avez indiqué ${n} personnage${n > 1 ? "s" : ""}, mais ${found} personnage${found > 1 ? "s" : ""} semblent apparaître dans la vidéo. Vérifiez l'identification.`;
}
