export const ANGEL_RULES = `
UNIVERS ANGES — règles obligatoires
- Un ange est un PERSONNAGE identifiable (visage, corps, vêtements), jamais un simple effet de lumière.
- Reconstruire UNIQUEMENT ce qui est visible : ailes, nombre d'ailes, forme, couleur, texture des plumes, halo, lueur — seulement s'ils apparaissent dans la référence.
- Interdit d'inventer : ailes, halo, tunique blanche, lumière dorée, pouvoirs, attributs religieux, si absents de la vidéo.
- Les anges peuvent coexister avec des humains. IDs stables : ANGEL_CHARACTER_01… pour les anges, CHARACTER_01… pour les humains.
- Continuité : même visage, mêmes ailes (si présentes), mêmes vêtements, mêmes proportions d'une scène à l'autre.
- Ne pas transformer un ange en humain, ni un humain en ange, sauf si la source le montre.
`.trim();

export function angelPromptBlock(enabled: boolean): string {
  if (!enabled) return "";
  return `\n\n${ANGEL_RULES}\n`;
}
