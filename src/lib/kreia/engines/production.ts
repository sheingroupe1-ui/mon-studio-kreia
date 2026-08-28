import { collapseProductionScenes } from "./duration";
import { enforceProductionDialogues, formatLockedDialogue } from "./dialogues";
import { composeCharacterImagePrompt, enforceProductionIdentity, identityParagraph } from "./identity";
import { expandCharacterIds } from "./continuity";
import { chat, fail, NETWORK_MESSAGE, type OkErr } from "../llm";
import { extractJson, parseProduction } from "../parse";
import { progressAt, type AnalysisProgress } from "../analysis-stages";
import { buildGenerationSystemPrompt } from "./reconstruction-prompt";
import type {
  AnalysisCheckpoint,
  GenerateInput,
  ProductionPlan,
  SceneProduction,
  VideoAnalysis,
} from "../types";

const SCENE_TOKENS = 1800;

export type ProductionSliceResult = {
  checkpoint: AnalysisCheckpoint;
  done: boolean;
  production?: ProductionPlan;
  progress: AnalysisProgress;
  error?: string;
};

function localCharacters(analysis: VideoAnalysis): ProductionPlan["characters"] {
  return analysis.characters.map((c) => ({
    id: c.id,
    bible: identityParagraph(c),
    imagePrompt: composeCharacterImagePrompt(c, analysis),
  }));
}

function fallbackScene(analysis: VideoAnalysis, index: number): SceneProduction {
  const scene = analysis.scenes[index];
  const n = scene?.number ?? index + 1;
  const locked = formatLockedDialogue(
    (analysis.dialogues?.lines ?? []).filter((l) => l.sceneNumber === n),
  );
  const who = scene ? expandCharacterIds(scene.characters, analysis.characters) : "";
  const style = analysis.visualStyle.lockedStylePhrase;
  const spoken = locked
    ? `Spoken French dialogue, one speaker at a time, others mouths closed: ${locked}`
    : "No spoken dialogue.";
  return {
    number: n,
    duration: 10,
    characters: scene?.characters ?? [],
    location: scene?.setting ?? "",
    action: scene?.action ?? "",
    emotion: scene?.emotion ?? "",
    camera: scene?.camera ?? "",
    lighting: scene?.lighting ?? "",
    visualStyle: style,
    audio: scene?.audio ?? "",
    dialogue: scene?.dialogue ?? (locked || null),
    videoPrompt: `${style}. ${scene?.setting ?? ""}. ${who}. Action: ${scene?.action ?? ""}. Camera: ${scene?.camera ?? ""}. ${spoken} Continuity with the previous shot. Coherent anatomy.`,
    continuityNotes: "Même identité, mêmes traits, même style.",
  };
}

function emptyPlan(analysis: VideoAnalysis): ProductionPlan {
  return {
    hook: {
      reconstructed: analysis.hook.firstSecondsDescription || analysis.narrative.initialSituation,
      visualPrompt: analysis.visualStyle.lockedStylePhrase,
      duration: 10,
      mechanism: analysis.hook.attentionMechanism,
    },
    scenario: {
      logline: analysis.narrative.subject,
      synopsis: analysis.narrative.story,
      structure: [analysis.narrative.initialSituation, analysis.narrative.conflict, analysis.narrative.climax, analysis.narrative.conclusion]
        .filter(Boolean)
        .join(" → "),
      dialoguesNote: "Dialogues en français uniquement, un locuteur à la fois.",
    },
    characters: localCharacters(analysis),
    visualStyle: {
      lockedPhrase: analysis.visualStyle.lockedStylePhrase,
      productionNotes: analysis.visualStyle.artisticStyle,
      doNot: ["changer un visage", "ajouter des membres", "parler une autre langue que le français"],
    },
    scenes: [],
  };
}

function sceneUserPrompt(input: GenerateInput, index: number, first: boolean): string {
  const { analysis, mode, durationSeconds, userNotes } = input;
  const scene = analysis.scenes[index];
  const locked = formatLockedDialogue(
    (analysis.dialogues?.lines ?? []).filter((l) => l.sceneNumber === (scene?.number ?? index + 1)),
  );
  const who = scene ? expandCharacterIds(scene.characters, analysis.characters) : "";
  const chars = analysis.characters.map((c) => identityParagraph(c)).join("\n");
  return `Mode : ${mode}. Durée source ${durationSeconds.toFixed(1)}s.
${userNotes ? `Notes : ${userNotes}` : ""}
Génère UNIQUEMENT la scène ${index + 1}/${analysis.scenes.length} (pas les autres).
${first ? "Inclus aussi hook, scenario, characters (fiches), visualStyle." : "Ne régénère pas hook/characters — uniquement la scène."}

PERSONNAGES
${chars || "(aucun)"}

SCÈNE ANALYSÉE
${JSON.stringify(scene ?? { number: index + 1 }, null, 2)}
Personnages présents :
${who}
DIALOGUE VERROUILLÉ : ${locked ?? "aucun — ne pas inventer"}
STYLE : ${analysis.visualStyle.lockedStylePhrase}

JSON :
${first ? `{
  "hook": { "reconstructed":"", "visualPrompt":"", "duration": 8, "mechanism":"" },
  "scenario": { "logline":"", "synopsis":"", "structure":"", "dialoguesNote":"" },
  "characters": [{ "id":"", "bible":"", "imagePrompt":"" }],
  "visualStyle": { "lockedPhrase":"", "productionNotes":"", "doNot":[] },
  "scene": { "number": ${index + 1}, "duration": 8, "characters":[], "location":"", "action":"", "emotion":"", "camera":"", "lighting":"", "visualStyle":"", "audio":"", "dialogue": null, "videoPrompt":"", "continuityNotes":"" }
}` : `{
  "scene": { "number": ${index + 1}, "duration": 8, "characters":[], "location":"", "action":"", "emotion":"", "camera":"", "lighting":"", "visualStyle":"", "audio":"", "dialogue": null, "videoPrompt":"", "continuityNotes":"" }
}`}
duration ∈ {6, 8, 10}. Réplique parlée en FRANÇAIS dans videoPrompt si un dialogue est verrouillé.`;
}

export async function runOneProductionScene(
  input: GenerateInput,
  checkpoint: AnalysisCheckpoint,
  index: number,
): Promise<OkErr<{ plan: ProductionPlan }>> {
  const analysis = input.analysis;
  const first = index === 0;
  const result = await chat({
    messages: [
      { role: "system", content: `${buildGenerationSystemPrompt(input.kind)}\nUne SEULE scène par réponse.` },
      { role: "user", content: sceneUserPrompt(input, index, first) },
    ],
    maxTokens: SCENE_TOKENS,
  });

  let plan = checkpoint.production ?? emptyPlan(analysis);
  if (!plan.characters.length) plan.characters = localCharacters(analysis);

  let parsedScene: SceneProduction | null = null;
  if (result && result.ok) {
    try {
      const json = extractJson(result.text) as Record<string, unknown>;
      const wrapped = json.scene
        ? { ...json, scenes: [json.scene] }
        : json.scenes
          ? json
          : { scenes: [json] };
      const parsed = parseProduction(wrapped);
      if (first) {
        if (parsed.hook.reconstructed) plan.hook = parsed.hook;
        if (parsed.scenario.logline) plan.scenario = parsed.scenario;
        if (parsed.characters.length) plan.characters = parsed.characters;
        if (parsed.visualStyle.lockedPhrase) plan.visualStyle = parsed.visualStyle;
      }
      parsedScene = parsed.scenes[0] ?? null;
    } catch {
      parsedScene = null;
    }
  }
  if (!parsedScene) parsedScene = fallbackScene(analysis, index);
  parsedScene.number = analysis.scenes[index]?.number ?? index + 1;
  const scenes = plan.scenes.filter((s) => s.number !== parsedScene!.number);
  scenes.push(parsedScene);
  scenes.sort((a, b) => a.number - b.number);
  plan = { ...plan, scenes };
  return { ok: true, plan };
}

export async function runProductionSlice(input: GenerateInput): Promise<ProductionSliceResult> {
  const analysis = input.analysis;
  const checkpoint: AnalysisCheckpoint = {
    version: 1,
    completed: input.checkpoint?.completed ?? [],
    analyzedSegmentCount: input.checkpoint?.analyzedSegmentCount ?? 0,
    analyzedCastBatchCount: input.checkpoint?.analyzedCastBatchCount ?? 0,
    analyzedProductionSceneCount: input.checkpoint?.analyzedProductionSceneCount ?? 0,
    incomplete: false,
    production: input.checkpoint?.production,
    analysis,
    dialoguesValidated: true,
    castValidated: input.checkpoint?.castValidated,
    characters: input.checkpoint?.characters ?? analysis.characters,
    visualStyle: input.checkpoint?.visualStyle ?? analysis.visualStyle,
  };
  const total = Math.max(1, analysis.scenes.length);
  const index = Math.max(0, checkpoint.analyzedProductionSceneCount ?? 0);
  if (index >= total) {
    const production = sealPlan(checkpoint.production ?? emptyPlan(analysis), analysis, input);
    return {
      checkpoint: { ...checkpoint, production, analyzedProductionSceneCount: total },
      done: true,
      production,
      progress: progressAt(7, { productionScenesDone: total, productionScenesTotal: total }),
    };
  }

  const out = await runOneProductionScene(input, checkpoint, index);
  if (!out.ok) {
    return {
      checkpoint,
      done: true,
      error: out.error || NETWORK_MESSAGE,
      progress: progressAt(7, { productionScenesDone: index, productionScenesTotal: total }),
    };
  }
  checkpoint.production = out.plan;
  checkpoint.analyzedProductionSceneCount = index + 1;
  const done = checkpoint.analyzedProductionSceneCount >= total;
  if (done) {
    checkpoint.production = sealPlan(out.plan, analysis, input);
    if (!checkpoint.completed.includes("produce")) {
      checkpoint.completed = [...checkpoint.completed, "produce"];
    }
  }
  return {
    checkpoint,
    done,
    production: done ? checkpoint.production : undefined,
    progress: progressAt(7, {
      productionScenesDone: checkpoint.analyzedProductionSceneCount,
      productionScenesTotal: total,
    }),
  };
}

function sealPlan(plan: ProductionPlan, analysis: VideoAnalysis, input: GenerateInput): ProductionPlan {
  let production = plan;
  production.scenes = collapseProductionScenes(production.scenes, input.durationSeconds);
  const first = production.scenes[0];
  if (first) production.hook.duration = first.duration;
  production = enforceProductionIdentity(
    enforceProductionDialogues(production, analysis, input.mode, input.kind),
    analysis,
  );
  return production;
}