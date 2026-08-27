import { identityParagraph, styleWeave } from "./identity";
import type { CharacterSheet, VideoAnalysis } from "../types";

export function characterLockLine(c: CharacterSheet): string {
  return identityParagraph(c);
}

export function buildContinuityBible(analysis: VideoAnalysis): string {
  const style = styleWeave(analysis.visualStyle);

  const characters = analysis.characters
    .map((c) => `- ${characterLockLine(c)}`)
    .join("\n");

  return `
BIBLE DE CONTINUITÉ — identités verrouillées
Le style (${style || "fidèle aux images source"}) doit être TISSÉ dans chaque prompt, jamais recopié comme un bloc séparé.

PERSONNAGES VERROUILLÉS — réutiliser tel quel, ne pas redessiner
${characters || "- aucun personnage identifié"}

RÈGLES
- Réutiliser les Character ID. Ne jamais renommer un ID.
- Un fruit, un ange ou un inconnu est un personnage. unknown_character n'est pas une erreur.
- Ne pas modifier visage, espèce fruit, ailes observées, morphologie, coiffure, yeux, vêtements sans raison narrative explicite.
- Ne pas inventer d'ailes, de halo ou d'espèce absents de la fiche.
- Une scène suivante n'est pas une autre histoire : même univers, mêmes identités.
`.trim();
}

export function expandCharacterIds(
  ids: string[],
  characters: CharacterSheet[],
): string {
  if (!ids.length) return "aucun personnage identifié dans cette scène";
  return ids
    .map((id) => {
      const c = characters.find((x) => x.id === id);
      return c ? characterLockLine(c) : id;
    })
    .join("\n");
}
