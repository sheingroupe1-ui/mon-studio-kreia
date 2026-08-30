import { dialogueCharCount, displayCharacterName, formatLockedDialogue, linesForScene } from "./dialogues.ts";
import { composeCharacterDossier, styleBlock } from "./identity.ts";
import { sceneRelationshipNotes } from "./relationships.ts";
import type {
  CharacterSheet,
  DialogueLine,
  ProductionPlan,
  SceneProduction,
  VideoAnalysis,
} from "../types";

function observed(value: string | undefined | null): string {
  return (value ?? "").trim();
}

function compactStyle(style: string): string {
  const parts = style
    .split(/[,;]/)
    .map((part) => part.trim().replace(/\s+/g, " "))
    .filter(Boolean);
  const seen = new Set<string>();
  const unique: string[] = [];
  for (const part of parts) {
    const key = part.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    unique.push(part);
  }
  return unique.join(", ");
}

function humanizeIds(text: string, analysis: VideoAnalysis): string {
  if (!text) return "";
  let out = text;
  const sheets = [...(analysis.characters ?? [])].sort((a, b) => b.id.length - a.id.length);
  for (const sheet of sheets) {
    const name = displayCharacterName(sheet);
    if (!sheet.id || !name || name === sheet.id) continue;
    out = out.split(sheet.id).join(name);
  }
  return out
    .replace(/\b(?:FRUIT_|ANGEL_)?CHARACTER_\d+\b/g, "")
    .replace(/[ \t]{2,}/g, " ")
    .replace(/ +\n/g, "\n")
    .trim();
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
  const chunks = sheets
    .map((sheet) => {
      const spoken = lines.find((l) => l.speakerId === sheet.id);
      const perf = spoken?.performance;
      const silentHit = silent.find((s) => s.characterId === sheet.id);
      const rows = [
        observed(perf?.emotionDominant || spoken?.emotion) &&
          `émotion : ${observed(perf?.emotionDominant || spoken?.emotion)}`,
        observed(perf?.gaze || silentHit?.gaze) && `regard : ${observed(perf?.gaze || silentHit?.gaze)}`,
        observed(perf?.facialExpression || silentHit?.expression) &&
          `expression : ${observed(perf?.facialExpression || silentHit?.expression)}`,
        observed(perf?.posture || silentHit?.posture) &&
          `posture : ${observed(perf?.posture || silentHit?.posture)}`,
        observed(perf?.gesture || silentHit?.gesture) &&
          `gestes : ${observed(perf?.gesture || silentHit?.gesture)}`,
        observed(perf?.tears) && `larmes : ${observed(perf?.tears)}`,
        observed(perf?.tone) && `ton : ${observed(perf?.tone)}`,
        observed(perf?.evolution) && `évolution : ${observed(perf?.evolution)}`,
      ].filter(Boolean);
      if (!rows.length) return "";
      return `${displayCharacterName(sheet)} :\n${rows.map((row) => `- ${row}`).join("\n")}`;
    })
    .filter(Boolean);
  if (chunks.length) return chunks.join("\n\n");
  const shared = observed(sceneEmotion);
  return shared ? `Ton de la scène : ${shared}.` : "Jeu d'acteur fidèle à la source, sans exagération.";
}

function cameraBeats(duration: number, camera: string, action: string): string {
  const total = duration > 0 ? duration : 10;
  const a = Math.max(1, Math.round(total * 0.4));
  const b = Math.max(a + 1, Math.round(total * 0.7));
  const shot = observed(camera) || "Cadrage stable, sans mouvement spectaculaire non observé.";
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

function replicaBlock(lines: DialogueLine[], analysis: VideoAnalysis): { text: string; chars: number } {
  const locked = formatLockedDialogue(lines);
  if (!locked) {
    return { text: "Aucun dialogue.", chars: 0 };
  }
  const grouped = new Map<string, string[]>();
  for (const line of lines) {
    const spoken = (line.displayText || line.sourceText).trim();
    if (!spoken) continue;
    const sheet = analysis.characters.find((c) => c.id === line.speakerId);
    const who = sheet
      ? displayCharacterName(sheet)
      : humanizeIds(line.speakerLabel, analysis) || "Locuteur à vérifier";
    const list = grouped.get(who) ?? [];
    list.push(spoken);
    grouped.set(who, list);
  }
  const text = [...grouped.entries()]
    .map(([who, replicas]) =>
      `${who} :\n${replicas.map((r) => `(réplique complète) « ${r} »`).join("\n")}`,
    )
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
    observed(args.action) || "Reproduire uniquement l'action observée.",
    "",
    "Visible Characters Only :",
    names,
    "",
    "Location :",
    observed(args.location) || "Décor de la vidéo source.",
    "",
    "Camera :",
    observed(args.camera) || "Cadrage observé, sans mouvement inventé.",
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
    args.replicas === "Aucun dialogue."
      ? "- Aucune réplique inventée."
      : "- Répliques exactes, dans l'ordre, uniquement celles de cette scène.",
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
  const style = compactStyle(extras?.visualStyle || styleBlock(analysis));
  const location = humanizeIds(extras?.location || scene?.setting || "", analysis);
  const action = humanizeIds(extras?.action || scene?.action || "", analysis);
  const emotion = humanizeIds(extras?.emotion || scene?.emotion || "", analysis);
  const camera = humanizeIds(extras?.camera || scene?.camera || "", analysis);
  const lighting = humanizeIds(extras?.lighting || scene?.lighting || "", analysis);
  const clothing = present.length
    ? present
        .map((c) => {
          const wear = observed(c.clothing);
          return wear ? `${displayCharacterName(c)} : ${wear}` : "";
        })
        .filter(Boolean)
        .join("\n") || "Tenues identiques aux fiches personnages."
    : "Tenues identiques aux fiches personnages.";
  const replicas = replicaBlock(owned, analysis);
  const names = present.map(displayCharacterName).filter(Boolean);
  const title = (action || location || names.join(", ") || `Scène ${number}`).slice(0, 90);
  const relations = humanizeIds(sceneRelationshipNotes(analysis.characters, presentIds), analysis);

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
    names.length ? names.join("\n") : "Aucun personnage identifié dans cette fenêtre.",
    relations ? `\nRelations :\n${relations}` : "",
    "",
    "📍 LIEU",
    "",
    location || "Décor de la vidéo source.",
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
    action || "Action telle qu'observée dans cette fenêtre de 10 secondes.",
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
    "Chaque réplique est dite entièrement (réplique complète), sans coupure, sans résumé, sans mot avalé.",
    "Pendant la réplique d'un personnage, les autres gardent la bouche fermée.",
    "Aucun chevauchement vocal. Aucune parole supplémentaire. Aucune improvisation.",
    "",
    "🔊 VOLUME ET TON DES VOIX",
    "",
    observed(scene?.audio || extras?.audio) || "Volume naturel, ton conforme à l'émotion observée.",
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
  return composeSceneDossier(analysis, index, scene);
}

export function withFormattedPrompts(plan: ProductionPlan, analysis: VideoAnalysis): ProductionPlan {
  return {
    ...plan,
    characters: plan.characters.map((entry) => {
      const sheet = analysis.characters.find((c) => c.id === entry.id);
      const dossier = sheet ? composeCharacterDossier(sheet, analysis) : "";
      const existing = entry.formattedSheet?.trim() ?? "";
      return {
        ...entry,
        formattedSheet: existing.length > 40 ? existing : dossier || existing,
      };
    }),
    scenes: plan.scenes.map((scene, i) => ({
      ...scene,
      formattedPrompt: fillSceneFormattedPrompt(analysis, i, scene),
    })),
  };
}
