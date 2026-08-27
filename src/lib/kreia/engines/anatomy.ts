export const HUMAN_ANATOMY_CONTROL = `
CONTRÔLE ANATOMIQUE (personnages humains)
Chaque prompt de personnage et de scène humaine doit inclure un verrou anatomique :
- un seul visage par personne, deux yeux, deux oreilles, un nez, une bouche
- deux bras, deux mains, cinq doigts par main
- deux jambes, deux pieds
- proportions humaines cohérentes, pas de membres fusionnés, déformés ou surnuméraires
- pas de visages fusionnés, pas de mains supplémentaires, pas d'yeux supplémentaires
Négatif à intégrer dans les prompts vidéo :
"no extra fingers, no extra limbs, no extra eyes, no fused faces, no deformed anatomy, no extra hands, no extra arms, no extra legs, anatomically correct human body"
`.trim();

export function anatomyPromptBlock(humanMode: boolean): string {
  if (!humanMode) return "";
  return `\n\n${HUMAN_ANATOMY_CONTROL}\n`;
}

export function anatomyNegativeClause(humanMode: boolean): string {
  if (!humanMode) return "";
  return "Anatomically correct adult/child human anatomy as applicable: two arms, two legs, two hands with five fingers each, two eyes, no extra limbs, no fused faces, no deformed anatomy.";
}
