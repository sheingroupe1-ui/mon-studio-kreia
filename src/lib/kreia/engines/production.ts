import { collapseAnalysisScenes, expectedSceneCount, inferSourceDuration, packDurations } from "./duration";
import { enforceProductionDialogues, fitDialoguesToScenes, formatLockedDialogue, linesForScene } from "./dialogues";
import { validateIsolatedProduction } from "./guards";
import { sceneRelationshipNotes } from "./relationships";
import { composeCharacterDossier, composeCharacterImagePrompt, enforceProductionIdentity, identityParagraph } from "./identity";
import { fillSceneFormattedPrompt, withFormattedPrompts } from "./prompt-dossier";
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

const SCENE_TOKENS = 3200;

export type ProductionSliceResult = {
  checkpoint: AnalysisCheckpoint;
  done: boolean;
  production?: ProductionPlan;
  progress: AnalysisProgress;
  error?: string;
};

function localCharacters(analysis: VideoAnalysis): ProductionPlan["characters"] {
  return analysis.characters.map((c) => {
    const sheet = composeCharacterDossier(c, analysis);
    return {
      id: c.id,
      bible: identityParagraph(c),
      imagePrompt: composeCharacterImagePrompt(c, analysis),
      formattedSheet: sheet,
    };
  });
}

function compactVideoPrompt(scene: SceneProduction, locked: string | null): string {
  const spoken = locked ? `Répliques FR, un locuteur à la fois : ${locked}` : "Aucun dialogue.";
  return [scene.visualStyle, scene.location, scene.action, scene.camera && `Caméra : ${scene.camera}`, spoken]
    .filter(Boolean)
    .join(". ");
}

function fallbackScene(analysis: VideoAnalysis, index: number, existing?: SceneProduction): SceneProduction {
  const scene = analysis.scenes[index];
  const n = existing?.number ?? scene?.number ?? index + 1;
  const locked = formatLockedDialogue(linesForScene(analysis.dialogues?.lines ?? [], n));
  const presentIds = [
    ...new Set(
      [
        ...(existing?.characters ?? scene?.characters ?? []),
        ...linesForScene(analysis.dialogues?.lines ?? [], n).map((l) => l.speakerId),
      ].filter((id): id is string => Boolean(id)),
    ),
  ];
  const style = analysis.visualStyle.lockedStylePhrase;
  const merged: SceneProduction = {
    number: n,
    duration: existing?.duration ?? 10,
    characters: presentIds.length ? presentIds : (scene?.characters ?? []),
    location: existing?.location || scene?.setting || "",
    action: existing?.action || scene?.action || "",
    emotion: existing?.emotion || scene?.emotion || "",
    camera: existing?.camera || scene?.camera || "",
    lighting: existing?.lighting || scene?.lighting || "",
    visualStyle: existing?.visualStyle || style,
    audio: existing?.audio || scene?.audio || "",
    dialogue: existing?.dialogue ?? scene?.dialogue ?? (locked || null),
    videoPrompt: existing?.videoPrompt || "",
    continuityNotes: existing?.continuityNotes || "Même identité, mêmes traits, même style, même décor sauf action explicite.",
    formattedPrompt: existing?.formattedPrompt || "",
  };
  if (!merged.videoPrompt) merged.videoPrompt = compactVideoPrompt(merged, locked);
  return merged;
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
  const sceneNo = scene?.number ?? index + 1;
  const owned = linesForScene(analysis.dialogues?.lines ?? [], sceneNo);
  const locked = formatLockedDialogue(owned);
  const presentIds = [
    ...new Set([...(scene?.characters ?? []), ...owned.map((l) => l.speakerId).filter(Boolean)]),
  ] as string[];
  const who = scene ? expandCharacterIds(presentIds.length ? presentIds : scene.characters, analysis.characters) : "";
  const chars = analysis.characters
    .filter((c) => !presentIds.length || presentIds.includes(c.id))
    .map((c) => identityParagraph(c))
    .join("\n");
  const relations = sceneRelationshipNotes(analysis.characters, presentIds);
  const scenePayload = scene
    ? {
        number: scene.number,
        estimatedDuration: scene.estimatedDuration,
        startHint: scene.startHint,
        setting: scene.setting,
        action: scene.action,
        emotion: scene.emotion,
        camera: scene.camera,
        lighting: scene.lighting,
        audio: scene.audio,
        characters: presentIds,
        dialogue: locked,
      }
    : { number: sceneNo };
  return `Mode : ${mode}. Durée source ${durationSeconds.toFixed(1)}s.
${userNotes ? `Notes : ${userNotes}` : ""}
Génère UNIQUEMENT la scène ${index + 1}/${analysis.scenes.length} (pas les autres).
${first ? "Inclus aussi hook, scenario, characters (fiches), visualStyle." : "Ne régénère pas hook/characters — uniquement la scène."}

PERSONNAGES PRÉSENTS DANS CETTE SCÈNE
${chars || "(aucun)"}
${relations ? `\nRELATIONS DANS CETTE SCÈNE\n${relations}` : ""}

SCÈNE ANALYSÉE (fenêtre locale uniquement)
${JSON.stringify(scenePayload, null, 2)}
Personnages présents :
${who}
DIALOGUES DE CETTE SCÈNE UNIQUEMENT — interdiction d'ajouter une réplique d'une autre scène : ${locked ?? "aucun — ne pas inventer"}
STYLE : ${analysis.visualStyle.lockedStylePhrase}

JSON :
${first ? `{
  "hook": { "reconstructed":"", "visualPrompt":"", "duration": 8, "mechanism":"" },
  "scenario": { "logline":"", "synopsis":"", "structure":"", "dialoguesNote":"" },
  "characters": [{ "id":"", "bible":"", "imagePrompt":"" }],
  "visualStyle": { "lockedPhrase":"", "productionNotes":"", "doNot":[] },
  "scene": { "formattedPrompt":"", "number": ${index + 1}, "duration": 8, "characters":[], "location":"", "action":"", "emotion":"", "camera":"", "lighting":"", "visualStyle":"", "audio":"", "dialogue": null, "videoPrompt":"", "continuityNotes":"" }
}` : `{
  "scene": { "formattedPrompt":"", "number": ${index + 1}, "duration": 8, "characters":[], "location":"", "action":"", "emotion":"", "camera":"", "lighting":"", "visualStyle":"", "audio":"", "dialogue": null, "videoPrompt":"", "continuityNotes":"" }
}`}
duration ∈ {6, 8, 10}.
videoPrompt = paragraphe interne court.
formattedPrompt = BLOC COMPLET à copier-coller, gabarit EXACT (titres et emojis conservés) :

🎬 SCÈNE ${sceneNo} — [titre court]
⏱️ DURÉE : {duration} SECONDES
🎨 STYLE D'ANIMATION
[style visuel développé à partir de : ${analysis.visualStyle.lockedStylePhrase}]
👥 PERSONNAGES PRÉSENTS
[un nom par ligne, UNIQUEMENT les personnages de cette scène]
📍 LIEU
[description exploitable]
CONTINUITÉ DU DÉCOR ABSOLUE :
[éléments fixes]
👕 VÊTEMENTS
[par personnage présent]
📖 DESCRIPTION DE LA SCÈNE
[ce qui se passe réellement — n'invente rien]
🎭 ÉMOTIONS ET JEU D'ACTEUR
[un bloc par personnage présent : émotion, regard, expression, posture, gestes]
🎙️ RÉPLIQUES
[répliques EXACTES fournies ci-dessus, ou « Aucun dialogue. »]
📊 TOTAL DIALOGUES : X CARACTÈRES
🎥 DÉCOUPAGE CAMÉRA
[0–… jusqu'à {duration} s, jamais plus]
👄 SYNCHRONISATION LABIALE
🔊 VOLUME ET TON DES VOIX
🎬 BLOC COMPLET FLOW / GROK / VEO 3
Story Rule / Visible Characters Only / Location / Camera / Timeline / Acting / Strict Rules

formattedSheet (uniquement si first) : fiche complète selon le type (humain / fruit humanoïde / ange). Style visuel intégré. Ne pas inventer d'ailes, d'espèce ou de vêtements absents.
Interdit : réplique inventée, personnage absent listé, caméra au-delà de la durée.`;
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
      const iaScene = parsed.scenes[0];
      console.info("[PRODUCE DEBUG]", {
        sceneIndex: index,
        hasFormattedPrompt: Boolean(iaScene?.formattedPrompt),
        formattedPromptLength: iaScene?.formattedPrompt?.length ?? 0,
        formattedPromptStart: (iaScene?.formattedPrompt ?? "").slice(0, 80),
        videoPromptStart: (iaScene?.videoPrompt ?? "").slice(0, 80),
      });
      const sample = [
        `s${index + 1}`,
        `fmtOk=${Boolean(iaScene?.formattedPrompt?.trim())}`,
        `fmtLen=${iaScene?.formattedPrompt?.length ?? 0}`,
        `fmt="${(iaScene?.formattedPrompt ?? "").slice(0, 80)}"`,
        `vid="${(iaScene?.videoPrompt ?? "").slice(0, 80)}"`,
      ].join(" ");
      checkpoint.productionFormattedPromptOk = Boolean(iaScene?.formattedPrompt?.trim());
      checkpoint.productionFormattedPromptSample = [checkpoint.productionFormattedPromptSample, sample]
        .filter(Boolean)
        .join(" · ")
        .slice(0, 700);
      if (first) {
        if (parsed.hook.reconstructed) plan.hook = parsed.hook;
        if (parsed.scenario.logline) plan.scenario = parsed.scenario;
        if (parsed.characters.length) {
          plan.characters = parsed.characters.map((entry) => {
            const sheet = analysis.characters.find((c) => c.id === entry.id);
            const dossier = sheet ? composeCharacterDossier(sheet, analysis) : "";
            return {
              ...entry,
              formattedSheet: entry.formattedSheet?.trim() || dossier,
              imagePrompt: entry.imagePrompt || dossier,
            };
          });
        }
        if (parsed.visualStyle.lockedPhrase) plan.visualStyle = parsed.visualStyle;
      }
      parsedScene = iaScene ?? null;
    } catch {
      parsedScene = null;
      console.info("[PRODUCE DEBUG]", {
        sceneIndex: index,
        hasFormattedPrompt: false,
        formattedPromptLength: 0,
        formattedPromptStart: "",
        videoPromptStart: "",
        parseError: true,
      });
      checkpoint.productionFormattedPromptOk = false;
      checkpoint.productionFormattedPromptSample = `s${index + 1} parseError fmtOk=false`;
    }
  } else {
    console.info("[PRODUCE DEBUG]", {
      sceneIndex: index,
      hasFormattedPrompt: false,
      formattedPromptLength: 0,
      formattedPromptStart: "",
      videoPromptStart: "",
      llmOk: false,
    });
    checkpoint.productionFormattedPromptOk = false;
    checkpoint.productionFormattedPromptSample = `s${index + 1} llm-failed fmtOk=false`;
  }
  parsedScene = fallbackScene(analysis, index, parsedScene ?? undefined);
  parsedScene.number = analysis.scenes[index]?.number ?? index + 1;
  if (parsedScene.duration > 10) parsedScene.duration = 10;
  parsedScene.formattedPrompt = fillSceneFormattedPrompt(analysis, index, parsedScene);
  const scenes = plan.scenes.filter((s) => s.number !== parsedScene!.number);
  scenes.push(parsedScene);
  scenes.sort((a, b) => a.number - b.number);
  plan = { ...plan, scenes };
  return { ok: true, plan };
}

function sourceDuration(input: GenerateInput): number {
  const lastDialogue = Math.max(
    0,
    ...(input.analysis.dialogues?.lines ?? []).map((l) => Number(l.endTime ?? l.startTime ?? 0)),
  );
  const lastHint = (input.analysis.scenes ?? [])
    .map((s) => s.startHint)
    .join(" ");
  const hintTimes = [...lastHint.matchAll(/(\d{1,2}):(\d{2})/g)].map((m) => Number(m[1]) * 60 + Number(m[2]));
  return inferSourceDuration(input.durationSeconds, {
    lastDialogueTime: lastDialogue,
    segmentEnds: hintTimes,
  });
}

export async function runProductionSlice(input: GenerateInput): Promise<ProductionSliceResult> {
  const duration = Math.max(input.durationSeconds || 0, sourceDuration(input));
  const expected = expectedSceneCount(duration);
  const fittedInput = { ...input, durationSeconds: duration };
  let analysis = input.analysis;
  const before = analysis.scenes?.length ?? 0;
  analysis = {
    ...analysis,
    scenes: collapseAnalysisScenes(analysis.scenes ?? [], duration),
    sceneCountEstimate: expected,
  };
  analysis = fitDialoguesToScenes(analysis, before, duration);
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
    productionFormattedPromptOk: input.checkpoint?.productionFormattedPromptOk,
    productionFormattedPromptSample: input.checkpoint?.productionFormattedPromptSample,
    dialogueDebug: input.checkpoint?.dialogueDebug,
  };
  const total = expected;
  const index = Math.max(0, checkpoint.analyzedProductionSceneCount ?? 0);
  if (index >= total) {
    const production = sealPlan(checkpoint.production ?? emptyPlan(analysis), analysis, fittedInput);
    return {
      checkpoint: { ...checkpoint, production, analyzedProductionSceneCount: total },
      done: true,
      production,
      progress: progressAt(7, { productionScenesDone: total, productionScenesTotal: total }),
    };
  }

  const out = await runOneProductionScene({ ...fittedInput, analysis }, checkpoint, index);
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
    checkpoint.production = sealPlan(out.plan, analysis, fittedInput);
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
      debug: checkpoint.productionFormattedPromptSample,
    }),
  };
}

function sealPlan(plan: ProductionPlan, analysis: VideoAnalysis, input: GenerateInput): ProductionPlan {
  const duration = sourceDuration(input);
  const expected = expectedSceneCount(duration);
  const durations = packDurations(duration);
  const scenes: SceneProduction[] = Array.from({ length: expected }, (_, i) => {
    const existing = plan.scenes.find((s) => s.number === i + 1) ?? plan.scenes[i];
    const built = fallbackScene(analysis, i);
    return {
      ...built,
      location: existing?.location || built.location,
      action: existing?.action || built.action,
      emotion: existing?.emotion || built.emotion,
      camera: existing?.camera || built.camera,
      lighting: existing?.lighting || built.lighting,
      visualStyle: existing?.visualStyle || built.visualStyle,
      audio: existing?.audio || built.audio,
      characters: existing?.characters?.length ? existing.characters : built.characters,
      number: i + 1,
      duration: durations[i] ?? 10,
      dialogue: existing?.dialogue ?? built.dialogue,
      continuityNotes: existing?.continuityNotes || built.continuityNotes,
      videoPrompt: existing?.videoPrompt || built.videoPrompt,
      formattedPrompt: existing?.formattedPrompt || built.formattedPrompt || "",
    };
  });
  let production = { ...plan, scenes };
  const first = production.scenes[0];
  if (first) production.hook.duration = first.duration;
  production = enforceProductionIdentity(
    enforceProductionDialogues(production, analysis, input.mode, input.kind),
    analysis,
  );
  const isolated = validateIsolatedProduction(analysis, production, duration);
  if (isolated) {
    console.error("[GUARDS]", isolated);
    production = enforceProductionDialogues(production, analysis, input.mode, input.kind);
  }
  production = withFormattedPrompts(production, analysis);
  return production;
}