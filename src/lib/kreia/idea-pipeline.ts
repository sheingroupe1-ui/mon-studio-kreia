import { applyLinesToScenes, emptyDialogueBible, lockCharactersSourceNames } from "./engines/dialogues";
import { ideaPhaseSystem, ideaPhaseUser } from "./engines/idea-prompt";
import { identityParagraph } from "./engines/identity";
import { chat, fail, NETWORK_MESSAGE, type OkErr } from "./llm";
import { extractJson, parseAnalysis, parseCharacter, parseProduction } from "./parse";
import { ideaPhaseLabel, ideaProgressAt, nextIdeaPhase } from "./idea-stages";
import type { AnalysisProgress } from "./analysis-stages";
import type {
  IdeaCheckpoint,
  IdeateInput,
  IdeaPhase,
  IdeaStory,
  IdeaUnderstanding,
  ProductionPlan,
  VideoAnalysis,
} from "./types";
import { styleFromUserChoice } from "./visual-styles";
import { splitAnalysis, splitProduction } from "./engines/split-plan";

export type IdeaSliceResult = {
  checkpoint: IdeaCheckpoint;
  nextPhase: IdeaPhase | "done";
  progress: AnalysisProgress;
  done: boolean;
  analysis?: VideoAnalysis;
  production?: ProductionPlan;
  error?: string;
};

function emptyCheckpoint(): IdeaCheckpoint {
  return { version: 1, phase: "understand", completed: [] };
}

function isRecord(v: unknown): v is Record<string, unknown> {
  return Boolean(v) && typeof v === "object" && !Array.isArray(v);
}

function str(v: unknown): string {
  return typeof v === "string" ? v.trim() : "";
}

function strArr(v: unknown): string[] {
  return Array.isArray(v) ? v.map((x) => str(x)).filter(Boolean) : [];
}

function parseUnderstanding(raw: unknown): IdeaUnderstanding {
  const o = isRecord(raw) ? raw : {};
  return {
    mainIdea: str(o.mainIdea) || str(o.idea),
    genre: str(o.genre),
    conflict: str(o.conflict),
    events: strArr(o.events),
    mentionedCharacters: strArr(o.mentionedCharacters),
    relations: strArr(o.relations),
    locations: strArr(o.locations),
    emotions: strArr(o.emotions),
    givenFacts: strArr(o.givenFacts),
    missing: strArr(o.missing),
  };
}

function parseStory(raw: unknown): IdeaStory {
  const o = isRecord(raw) ? raw : {};
  return {
    title: str(o.title),
    logline: str(o.logline),
    beginning: str(o.beginning),
    progression: str(o.progression),
    conflict: str(o.conflict),
    twists: strArr(o.twists),
    climax: str(o.climax),
    ending: str(o.ending),
    tone: str(o.tone),
    subject: str(o.subject),
  };
}

async function ideaChat(input: IdeateInput, cp: IdeaCheckpoint, phase: IdeaPhase): Promise<OkErr<{ json: unknown }>> {
  const content: Array<
    { type: "text"; text: string } | { type: "image_url"; image_url: { url: string; detail?: "low" | "high" } }
  > = [{ type: "text", text: ideaPhaseUser(input, cp, phase) }];
  if (phase === "visual" && input.styleImageDataUrl?.startsWith("data:image/")) {
    content.push({
      type: "image_url",
      image_url: { url: input.styleImageDataUrl, detail: "low" },
    });
  }
  const result = await chat({
    messages: [
      { role: "system", content: ideaPhaseSystem(input.kind, phase) },
      { role: "user", content },
    ],
    maxTokens: phase === "scenes" || phase === "dialogues" ? 3500 : 2200,
  });
  if (!result || !result.ok) return fail(result?.error || NETWORK_MESSAGE);
  try {
    return { ok: true, json: extractJson(result.text) };
  } catch {
    return fail(`Réponse illisible pendant : ${ideaPhaseLabel(phase)}.`);
  }
}

function forceScenes(analysis: VideoAnalysis, sceneCount: number): VideoAnalysis {
  const scenes = analysis.scenes.slice(0, sceneCount);
  while (scenes.length < sceneCount) {
    const n = scenes.length + 1;
    scenes.push({
      number: n,
      estimatedDuration: 10,
      startHint: `${(n - 1) * 10}s`,
      characters: analysis.characters[0] ? [analysis.characters[0].id] : [],
      setting: scenes.at(-1)?.setting || "",
      action: "Suite de l'histoire.",
      emotion: "",
      camera: "",
      lighting: "",
      audio: "",
      dialogue: null,
      dialogueSpeaker: null,
      styleNotes: "",
      confidence: "proposed",
      silentReactions: [],
    });
  }
  analysis.scenes = scenes.map((s, i) => ({ ...s, number: i + 1, estimatedDuration: 10 }));
  analysis.sceneCountEstimate = analysis.scenes.length;
  return analysis;
}

export function assembleIdeaAnalysis(input: IdeateInput, cp: IdeaCheckpoint): VideoAnalysis {
  const story = cp.story;
  const parsed = parseAnalysis({
    observedSummary: story?.logline || cp.understanding?.mainIdea || input.idea,
    limitations: [
      "Projet créé à partir d'une idée, sans vidéo source.",
      `${input.durationSeconds}s visés, ${input.sceneCount} scènes de 10s.`,
    ],
    language: "fr",
    sceneCountEstimate: input.sceneCount,
    narrative: {
      subject: story?.subject || cp.understanding?.mainIdea || "",
      story: [story?.beginning, story?.progression, story?.climax, story?.ending].filter(Boolean).join(" "),
      context: cp.understanding?.mainIdea || "",
      initialSituation: story?.beginning || "",
      incitingIncident: story?.conflict || cp.understanding?.conflict || "",
      conflict: story?.conflict || "",
      stakes: "",
      evolution: story?.progression || "",
      climax: story?.climax || "",
      resolution: story?.ending || "",
      conclusion: story?.ending || "",
      cta: null,
      genre: cp.understanding?.genre || "",
      tone: story?.tone || "",
      confidence: "proposed",
    },
    hook: {
      firstSecondsDescription: story?.beginning || "",
      attentionMechanism: "entrée directe dans le conflit",
      revealedInfo: "",
      introducedConflict: story?.conflict || "",
      curiosityCreated: story?.logline || "",
      whyContinue: story?.progression || "",
      confidence: "proposed",
    },
    characters: cp.characters ?? [],
    visualStyle: cp.visualStyle,
    cinematic: cp.cinematic,
    scenes: cp.scenes ?? [],
    audio: {
      dialoguePresent: Boolean(cp.dialogues?.lines.length),
      voiceOverPresent: false,
      musicPresent: false,
      ambiencePresent: true,
      sfxPresent: false,
      silenceUsed: false,
      rhythm: "dialogue rapide",
      transcriptExcerpt: null,
      notes: "Dialogues originaux en français.",
      source: "unavailable",
    },
    dialogues: cp.dialogues ?? emptyDialogueBible(),
  });
  parsed.characters = lockCharactersSourceNames(parsed.characters);
  let analysis = forceScenes(parsed, input.sceneCount);
  analysis.scenes = applyLinesToScenes(analysis.scenes, analysis.dialogues.lines);
  return analysis;
}

function weave(style: VideoAnalysis["visualStyle"]): string {
  return [
    style.lockedStylePhrase,
    style.renderType,
    style.artisticStyle,
    style.lighting,
    style.atmosphere,
    style.textures,
  ]
    .filter((x) => x && String(x).trim())
    .join(", ");
}

export function assembleIdeaProduction(analysis: VideoAnalysis): ProductionPlan {
  const style = weave(analysis.visualStyle);
  const characters = analysis.characters.map((c) => {
    const id = identityParagraph(c);
    return {
      id: c.id,
      bible: `${c.name || c.designation || c.id} — ${c.role}. ${c.personality} ${c.relationships}`.trim(),
      imagePrompt: `Reference portrait of ${c.name || c.id}. ${id}. ${style}. Single character, coherent anatomy, no extra limbs.`,
    };
  });
  const scenes = analysis.scenes.map((s) => {
    const present = s.characters
      .map((id) => analysis.characters.find((c) => c.id === id))
      .filter(Boolean)
      .map((c) => identityParagraph(c!))
      .join(" | ");
    const spoken = s.dialogue
      ? `${s.dialogueSpeaker || "Personnage"} dit en français : « ${s.dialogue} ». Un seul locuteur, les autres bouche fermée, lip-sync précis.`
      : "Pas de dialogue parlé.";
    return {
      number: s.number,
      duration: 10 as const,
      characters: s.characters,
      location: s.setting,
      action: s.action,
      emotion: s.emotion,
      camera: s.camera,
      lighting: s.lighting,
      visualStyle: style,
      audio: s.audio,
      dialogue: s.dialogue,
      videoPrompt: `${style}. ${s.setting}. ${present}. Action : ${s.action}. Émotion : ${s.emotion}. Caméra : ${s.camera}. ${spoken} Continuité du plan précédent. Anatomie cohérente.`,
      continuityNotes: "Même identité, mêmes traits, même style d'une scène à l'autre.",
    };
  });
  const first = scenes[0];
  return {
    hook: {
      reconstructed: analysis.hook.firstSecondsDescription || analysis.narrative.initialSituation,
      visualPrompt: first?.videoPrompt || style,
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
    characters,
    visualStyle: {
      lockedPhrase: analysis.visualStyle.lockedStylePhrase,
      productionNotes: style,
      doNot: ["changer un visage", "ajouter des membres", "mélanger les identités", "parler une autre langue que le français"],
    },
    scenes,
  };
}

export async function runIdeaSlice(args: {
  data: IdeateInput;
  checkpoint?: IdeaCheckpoint;
  phase: IdeaPhase;
}): Promise<IdeaSliceResult> {
  const { data } = args;
  const cp: IdeaCheckpoint = args.checkpoint
    ? { ...args.checkpoint, completed: [...args.checkpoint.completed] }
    : emptyCheckpoint();
  const phase = args.phase;
  const progress = ideaProgressAt(phase);

  try {
    if (phase === "understand") {
      const out = await ideaChat(data, cp, phase);
      if (!out.ok) throw new Error(out.error);
      cp.understanding = parseUnderstanding(out.json);
    } else if (phase === "story") {
      const out = await ideaChat(data, cp, phase);
      if (!out.ok) throw new Error(out.error);
      cp.story = parseStory(out.json);
    } else if (phase === "characters") {
      const out = await ideaChat(data, cp, phase);
      if (!out.ok) throw new Error(out.error);
      const parsed = parseAnalysis(out.json);
      cp.characters = lockCharactersSourceNames(
        parsed.characters.length
          ? parsed.characters
          : isRecord(out.json) && Array.isArray(out.json.characters)
            ? out.json.characters.map((c, i) => parseCharacter(c, i, data.kind))
            : [],
      );
      if (!cp.characters.length) {
        cp.characters = [
          parseCharacter(
            {
              id: data.kind === "fruit-humanoid" ? "FRUIT_CHARACTER_01" : "CHARACTER_01",
              name: null,
              designation: "Personnage principal",
              characterType: data.kind === "fruit-humanoid" ? "fruit_humanoid" : data.kind === "angel" ? "angel" : "human",
              appearance: "",
              role: "Protagoniste",
              prominence: "principal",
            },
            0,
            data.kind,
          ),
        ];
      }
    } else if (phase === "visual") {
      if (data.chosenStyleId) {
        cp.visualStyle = styleFromUserChoice(data.chosenStyleId, data.chosenStyleText);
        cp.cinematic = {
          dominantShots: ["plan rapproché", "plan moyen"],
          cameraAngles: ["hauteur des yeux"],
          movements: ["caméra fluide"],
          lightingStyle: cp.visualStyle.lighting,
          rhythm: "cinématographique",
        };
      } else {
        const out = await ideaChat(data, cp, phase);
        if (!out.ok) throw new Error(out.error);
        const parsed = parseAnalysis(out.json);
        cp.visualStyle = parsed.visualStyle.lockedStylePhrase
          ? parsed.visualStyle
          : styleFromUserChoice("cinematic-real");
        cp.cinematic = parsed.cinematic;
      }
    } else if (phase === "scenes") {
      const out = await ideaChat(data, cp, phase);
      if (!out.ok) throw new Error(out.error);
      const parsed = parseAnalysis(out.json);
      cp.scenes = forceScenes(
        { ...parsed, characters: cp.characters ?? parsed.characters },
        data.sceneCount,
      ).scenes;
    } else if (phase === "dialogues") {
      const out = await ideaChat(data, cp, phase);
      if (!out.ok) throw new Error(out.error);
      const parsed = parseAnalysis(out.json);
      cp.dialogues = parsed.dialogues?.lines?.length ? parsed.dialogues : emptyDialogueBible();
      if (cp.dialogues.language !== "fr") cp.dialogues.language = "fr";
    } else {
      const analysis = splitAnalysis(assembleIdeaAnalysis(data, cp), data.durationSeconds);
      let production = splitProduction(assembleIdeaProduction(analysis), analysis, data.durationSeconds);
      try {
        production = parseProduction(production);
      } catch {
        /* already shaped */
      }
      cp.analysis = analysis;
      cp.production = production;
      cp.completed = Array.from(new Set([...cp.completed, phase]));
      cp.phase = "prepare";
      return {
        checkpoint: cp,
        nextPhase: "done",
        progress: ideaProgressAt("prepare"),
        done: true,
        analysis,
        production,
      };
    }

    if (!cp.completed.includes(phase)) cp.completed.push(phase);
    const next = nextIdeaPhase(phase);
    cp.phase = next === "done" ? "prepare" : next;
    return {
      checkpoint: cp,
      nextPhase: next,
      progress: next === "done" ? ideaProgressAt("prepare") : ideaProgressAt(next),
      done: false,
    };
  } catch (err) {
    const message = err instanceof Error && err.message.trim() ? err.message : NETWORK_MESSAGE;
    cp.failedPhase = phase;
    cp.failedMessage = message;
    return {
      checkpoint: cp,
      nextPhase: phase,
      progress,
      done: true,
      error: `Impossible de terminer : ${ideaPhaseLabel(phase)}. ${message}`,
    };
  }
}
