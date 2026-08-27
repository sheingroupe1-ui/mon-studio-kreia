export const FRUIT_HUMANOID_RULES = `
UNIVERS FRUIT HUMANOID — règles obligatoires
- Aucun humain, aucun visage humain, aucune silhouette humaine, même floue, même en arrière-plan.
- Tous les personnages sont des fruits humanoïdes (corps-fruit, membres, visage stylisé propre à l'espèce).
- L'espèce fruit de chaque Character ID est verrouillée (ex. FRUIT_CHARACTER_01 = pastèque, FRUIT_CHARACTER_02 = ananas). Ne pas changer d'espèce entre les scènes.
- Une fois un personnage identifié, le réutiliser dans tous les segments. Interdit de recréer un nouveau personnage uniquement parce que l'angle de caméra change.
- Proportions, visage, vêtements et accessoires restent identiques d'une scène à l'autre, sauf changement narratif explicite.
- Continuité des environnements : même univers, même niveau de stylisation.
- Le style visuel détecté (3D, cartoon, cinématographique, etc.) est une contrainte, pas une suggestion.
- Interdire toute apparition accidentelle d'humain dans les prompts (ajouter une clause négative claire).
`.trim();

export function fruitHumanoidPromptBlock(enabled: boolean): string {
  if (!enabled) return "";
  return `\n\n${FRUIT_HUMANOID_RULES}\n`;
}
