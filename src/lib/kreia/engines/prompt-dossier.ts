import { dialogueCharCount, displayCharacterName, formatLockedDialogue, linesForScene } from "./dialogues.ts";
import { styleBlock } from "./identity.ts";
import { sceneRelationshipNotes } from "./relationships.ts";
import type {
  CharacterSheet,
  DialogueLine,
  SceneProduction,
  VideoAnalysis,
} from "../types";

function obs(value: string | undefined | null, fallback = "Non observé dans la source."): string {
  const text = (value ?? "").trim();
  return text || fallback;
}

function presentSheets(analysis: VideoAnalysis, ids: string[]): CharacterSheet[] {
  const wanted = new Set(ids.filter(Boolean));
  if (!wanted.size) return [];
  return analysis.characters.filter((c) => wanted.has(c.id));
}

function actingBlock(
  sheets: CharacterSheet[],
  sceneEmotion: string,
  lines: DialogueLine[],
  silent: VideoAnalysis["scenes"][number]["silentReactions"],
): string {
  if (!sheets.length) return obs(sceneEmotion, "Émotions telles qu'observées dans la source.");
  return sheets
    .map((sheet) => {
      const name = displayCharacterName(sheet);
      const spoken = lines.find((l) => l.speakerId === sheet.id);
      const perf = spoken?.performance;
      const silentHit = silent.find((s) => s.characterId === sheet.id);
      const rows = [
        `émotion : ${obs(perf?.emotionDominant || spoken?.emotion || sceneEmotion)}`,
        `regard : ${obs(perf?.gaze || silentHit?.gaze)}`,
        `expression : ${obs(perf?.facialExpression || silentHit?.expression)}`,
        `posture : ${obs(perf?.posture || silentHit?.posture)}`,
        `gestes : ${obs(perf?.gesture || silentHit?.gesture)}`,
        perf?.tears && `larmes : ${perf.tears}`,
        perf?.tone && `ton : ${perf.tone}`,
        perf?.evolution && `évolution : ${perf.evolution}`,
      ].filter(Boolean);
      return `${name} :\n${rows.map((row) => `- ${row}`).join("\n")}`;
    })
    .join("\n\n");
}

function cameraBeats(duration: number, camera: string, action: string): string {
  const total = duration > 0 ? duration : 10;
  const a = Math.max(1, Math.round(total * 0.4));
  const b = Math.max(a + 1, Math.round(total * 0.7));
  const shot = obs(camera, "Cadrage stable, sans mouvement spectaculaire non observé.");
  return [
    `0–${a} secondes :`,
    shot,
    action && `Action : ${action}`,
    "",
    `${a}–${b} secondes :`,
    "Continuité du même cadrage. Pas de mouvement de caméra inventé.",
    "",
    `${b}–${total} secondes :`,
    "Fin de scène dans le même axe, sauf indication contraire observée.",
  ]
    .filter(Boolean)
    .join("\n");
}

function replicaBlock(lines: DialogueLine[]): { text: string; chars: number } {
  const locked = formatLockedDialogue(lines);
  if (!locked) {
    return { text: "Aucun dialogue.", chars: 0 };
  }
  const grouped = new Map<string, string[]>();
  for (const line of lines) {
    const spoken = (line.displayText || line.sourceText).trim();
    if (!spoken) continue;
    const who = line.speakerLabel.trim() || "Locuteur à vérifier";
    const list = grouped.get(who) ?? [];
    list.push(spoken);
    grouped.set(who, list);
  }
  const text = [...grouped.entries()]
    .map(([who, replicas]) => `${who} :\n${replicas.map((r) => `« ${r} »`).join("\n")}`)
    .join("\n\n");
  return { text, chars: dialogueCharCount(lines) };
}

function flowBlock(args: {
  action: string;
  present: CharacterSheet[];
  location: string;
  camera: string;
  duration: number;
  replicas: string;
  style: string;
}): string {
  const names = args.present.map(displayCharacterName).join(", ") || "aucun personnage supplémentaire";
  return [
    "Story Rule :",
    obs(args.action),
    "",
    "Visible Characters Only :",
    names,
    "",
    "Location :",
    obs(args.location),
    "",
    "Camera :",
    obs(args.camera, "Cadrage observé, sans mouvement inventé."),
    "",
    "Timeline :",
    `Déroulement sur ${args.duration} secondes, sans dépasser 10 secondes.`,
    "",
    "Acting :",
    "Reproduire uniquement les émotions, gestes et regards observés. Ne pas adoucir, ne pas dramatiser.",
    "",
    "Strict Rules :",
    "- Respect absolu des personnages présents uniquement.",
    "- Aucun personnage supplémentaire.",
    "- Aucun changement d'apparence, d'espèce, de visage, de morphologie.",
    "- Aucun changement de vêtements sans justification source.",
    "- Respect absolu du décor : aucun objet ne bouge seul.",
    "- Une seule personne parle à la fois. Aucun dialogue supplémentaire. Aucun chevauchement vocal.",
    "- Répliques en français uniquement. Aucun sous-titre. Aucun texte à l'écran.",
    `- Style visuel : ${args.style}`,
    args.replicas === "Aucun dialogue." ? "- Aucune réplique inventée." : "- Répliques exactes, dans l'ordre, uniquement celles de cette scène.",
  ].join("\n");
}

export function composeSceneDossier(
  analysis: VideoAnalysis,
  index: number,
  extras?: Partial<SceneProduction>,
): string {
  const scene = analysis.scenes[index];
  const number = extras?.number ?? scene?.number ?? index + 1;
  const duration = extras?.duration ?? scene?.estimatedDuration ?? 10;
  const owned = linesForScene(analysis.dialogues?.lines ?? [], number);
  const presentIds = [
    ...new Set(
      [
        ...(extras?.characters ?? scene?.characters ?? []),
        ...owned.map((line) => line.speakerId).filter(Boolean),
      ].filter((id): id is string => Boolean(id)),
    ),
  ];
  const present = presentSheets(analysis, presentIds);
  const style = extras?.visualStyle || styleBlock(analysis);
  const location = extras?.location || scene?.setting || "";
  const action = extras?.action || scene?.action || "";
  const emotion = extras?.emotion || scene?.emotion || "";
  const camera = extras?.camera || scene?.camera || "";
  const lighting = extras?.lighting || scene?.lighting || "";
  const clothing = present.length
    ? present.map((c) => `${displayCharacterName(c)} : ${obs(c.clothing, "tenue observée dans la source")}`).join("\n")
    : "Non observé.";
  const replicas = replicaBlock(owned);
  const title = (action || location || `Scène ${number}`).slice(0, 80);
  const relations = sceneRelationshipNotes(analysis.characters, presentIds);

  return [
    `🎬 SCÈNE ${number} — ${title}`,
    "",
    `⏱️ DURÉE : ${duration} SECONDES`,
    "",
    "🎨 STYLE D'ANIMATION",
    "",
    style,
    "",
    "👥 PERSONNAGES PRÉSENTS",
    "",
    present.length ? present.map((c) => displayCharacterName(c)).join("\n") : "Aucun personnage identifié dans cette fenêtre.",
    relations ? `\nRelations : ${relations}` : "",
    "",
    "📍 LIEU",
    "",
    obs(location),
    lighting && `Lumière : ${lighting}`,
    "",
    "CONTINUITÉ DU DÉCOR ABSOLUE :",
    "Les meubles, objets et éléments de décor décrits restent à leur place sauf action physique explicite observée.",
    "",
    "👕 VÊTEMENTS",
    "",
    clothing,
    "",
    "📖 DESCRIPTION DE LA SCÈNE",
    "",
    obs(action),
    "",
    "🎭 ÉMOTIONS ET JEU D'ACTEUR",
    "",
    actingBlock(present, emotion, owned, scene?.silentReactions ?? []),
    "",
    "🎙️ RÉPLIQUES",
    "",
    replicas.text,
    "",
    `📊 TOTAL DIALOGUES : ${replicas.chars} CARACTÈRES`,
    "",
    "🎥 DÉCOUPAGE CAMÉRA",
    "",
    cameraBeats(duration, camera, action),
    "",
    "👄 SYNCHRONISATION LABIALE",
    "",
    "Une seule personne parle à la fois.",
    "Pendant la réplique d'un personnage, les autres gardent la bouche fermée.",
    "Aucun chevauchement vocal. Aucune parole supplémentaire. Aucune improvisation.",
    "",
    "🔊 VOLUME ET TON DES VOIX",
    "",
    obs(scene?.audio || extras?.audio, "Volume naturel, ton conforme à l'émotion observée."),
    "",
    "🎬 BLOC COMPLET FLOW / GROK / VEO 3",
    "",
    flowBlock({
      action,
      present,
      location,
      camera,
      duration,
      replicas: replicas.text,
      style,
    }),
  ]
    .filter((line) => line !== "")
    .join("\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

export function looksLikeSceneDossier(text: string | undefined | null): boolean {
  const value = (text ?? "").trim();
  if (value.length < 40) return false;
  return /SCÈNE/.test(value) && /DURÉE/.test(value);
}

export function fillSceneFormattedPrompt(
  analysis: VideoAnalysis,
  index: number,
  scene: SceneProduction,
): string {
  if (looksLikeSceneDossier(scene.formattedPrompt)) return scene.formattedPrompt!.trim();
  return composeSceneDossier(analysis, index, scene);
}
