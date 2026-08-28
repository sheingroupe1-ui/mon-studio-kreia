import { progressAt, type AnalysisProgress } from "./analysis-stages";
import { buildAnalysisSystemPrompt, buildAnalysisUserPrompt } from "./engines/analysis-prompt";
import { identifyCharacters, listCastBatches, type CastResult } from "./engines/cast";
import {
  collapseAnalysisScenes,
  closestPromptDuration,
  proposeSegments,
  type TimeSegment,
} from "./engines/duration";
import { analyzeStructure, fallbackStructure } from "./engines/structure";
import { duplicateWarnings } from "./engines/cast-edit";
import { briefCountWarning, formatUserBrief } from "./user-brief";
import { styleFromUserChoice } from "./visual-styles";
import {
  attachDialogues,
  fitDialoguesToScenes,
  lockCharactersSourceNames,
} from "./engines/dialogues";
import { fruitHumanoidPromptBlock } from "./engines/fruit-humanoid";
import { angelPromptBlock } from "./engines/angel";
import { runProductionSlice } from "./engines/production";
import {
  chat,
  fail,
  INVALID_AI_MESSAGE,
  NETWORK_MESSAGE,
  transcribeWav,
  type ChatContent,
  type OkErr,
} from "./llm";
import { extractJson, parseAnalysis, tryExtractJson } from "./parse";
import type {
  AnalysisCheckpoint,
  AnalyzeInput,
  FrameCapture,
  VideoAnalysis,
} from "./types";

const MAX_FRAMES = 12;
const SEGMENT_TOKENS = 1800;
const NARRATIVE_TOKENS = 3200;
const COMPACT_TOKENS = 4500;
const REPAIR_TOKENS = 2800;

function clampFrames(frames: FrameCapture[]): FrameCapture[] {
  return (frames ?? [])
    .filter((f) => typeof f?.dataUrl === "string" && f.dataUrl.startsWith("data:image/") && f.dataUrl.length > 32)
    .slice(0, MAX_FRAMES)
    .map((f) => ({ t: Number.isFinite(f.t) ? f.t : 0, dataUrl: f.dataUrl }));
}

function pickFrames(frames: FrameCapture[], times: number[], max = 3): FrameCapture[] {
  if (!times.length) return frames.slice(0, max);
  const picked: FrameCapture[] = [];
  for (const t of times) {
    const nearest = frames.reduce((a, b) => (Math.abs(b.t - t) < Math.abs(a.t - t) ? b : a));
    if (!picked.some((p) => p.t === nearest.t)) picked.push(nearest);
    if (picked.length >= max) break;
  }
  if (picked.length < 2 && frames.length >= 2) {
    return [frames[0]!, frames[frames.length - 1]!].slice(0, max);
  }
  return picked;
}

function isLongForm(duration: number, frameCount: number): boolean {
  return duration > 22 || frameCount > 6;
}

function images(frames: FrameCapture[]): ChatContent[] {
  return frames.map((frame) => ({
    type: "image_url" as const,
    image_url: { url: frame.dataUrl, detail: "low" as const },
  }));
}

async function parseOrRepair(text: string): Promise<VideoAnalysis> {
  try {
    return parseAnalysis(extractJson(text));
  } catch (err) {
    const repair = await chat({
      messages: [
        {
          role: "system",
          content:
            "Répare ce JSON d'analyse KREIA. Renvoie uniquement un objet JSON valide, même schéma, sans markdown.",
        },
        { role: "user", content: text.slice(0, 24000) },
      ],
      maxTokens: REPAIR_TOKENS,
    });
    if (!repair.ok) throw new Error(repair.error || INVALID_AI_MESSAGE);
    try {
      return parseAnalysis(extractJson(repair.text));
    } catch {
      throw err instanceof Error ? err : new Error(INVALID_AI_MESSAGE);
    }
  }
}

function applyDurationFit(
  analysis: VideoAnalysis,
  durationSeconds: number,
  transcript: string | null,
): VideoAnalysis {
  let next: VideoAnalysis = {
    ...analysis,
    characters: lockCharactersSourceNames(analysis.characters),
  };
  next = attachDialogues(
    next,
    transcript ?? next.dialogues?.rawTranscript ?? next.audio.transcriptExcerpt,
  );
  const before = next.scenes.length;
  const scenes = collapseAnalysisScenes(next.scenes, durationSeconds);
  next = { ...next, scenes, sceneCountEstimate: scenes.length };
  return fitDialoguesToScenes(next, before);
}

function analysisFromCheckpoint(
  checkpoint: AnalysisCheckpoint,
  data: AnalyzeInput,
  transcript: string | null,
  transcriptNote: string,
): VideoAnalysis {
  const characters = checkpoint.characters ?? [];
  const segs = checkpoint.segments ?? [];
  const scenes = segs.map((s, i) => ({
    number: i + 1,
    estimatedDuration: closestPromptDuration(Math.max(0.5, (s.end ?? 0) - (s.start ?? 0))),
    startHint: `${Number(s.start || 0).toFixed(1)}s`,
    characters: Array.isArray(s.characters) && s.characters.length ? s.characters : characters.map((c) => c.id),
    setting: s.setting || "",
    action: s.action || "Suite observée de la vidéo source.",
    emotion: s.emotion || "",
    camera: s.camera || "",
    lighting: s.lighting || "",
    audio: s.audio || "",
    dialogue: s.dialogue ?? null,
    dialogueSpeaker: s.speakerId ?? null,
    styleNotes: "",
    confidence: "inferred" as const,
    silentReactions: s.silentReactions ?? [],
  }));
  let analysis = parseAnalysis({
    observedSummary:
      checkpoint.observedSummary || "Analyse reconstruite à partir des éléments déjà extraits de la vidéo.",
    limitations: [
      ...(checkpoint.limitations ?? []),
      "Certaines scènes ont été reconstituées automatiquement pour ne pas interrompre l'analyse.",
    ],
    language: checkpoint.language,
    characters,
    visualStyle: checkpoint.visualStyle,
    cinematic: checkpoint.cinematic,
    scenes,
    audio: {
      transcriptExcerpt: transcript,
      notes: transcriptNote,
      source: transcript ? "transcript" : "unavailable",
    },
  });
  if (!analysis.audio.notes) analysis.audio.notes = transcriptNote;
  return applyDurationFit(analysis, data.durationSeconds, transcript);
}

async function collectTranscript(
  data: AnalyzeInput,
  checkpoint: AnalysisCheckpoint,
): Promise<{ text: string | null; note: string }> {
  if (checkpoint.transcript) {
    return { text: checkpoint.transcript, note: checkpoint.transcriptNote ?? "Transcription reprise." };
  }
  const chunks = (data.audioChunks ?? []).filter(
    (c) => typeof c.wavBase64 === "string" && c.wavBase64.length > 2048,
  );
  if (chunks.length) {
    const parts: string[] = [];
    for (let i = 0; i < chunks.length; i += 2) {
      const batch = chunks.slice(i, i + 2);
      const results = await Promise.all(batch.map((chunk) => transcribeWav(chunk.wavBase64)));
      batch.forEach((chunk, idx) => {
        const text = results[idx]?.text;
        if (text) parts.push(`[${chunk.t.toFixed(1)}s] ${text}`);
      });
    }
    if (parts.length) return { text: parts.join("\n"), note: "Transcription obtenue." };
    return {
      text: null,
      note: "La piste audio n'a pas pu être transcrite. Les sous-titres et le contexte visuel restent la seule source.",
    };
  }
  if (data.audioWavBase64 && data.audioWavBase64.length > 2048 && data.audioWavBase64.length <= 280_000) {
    const tr = await transcribeWav(data.audioWavBase64);
    return { text: tr.text, note: tr.note };
  }
  return { text: null, note: "Aucune piste audio extraite." };
}

function emptyCheckpoint(): AnalysisCheckpoint {
  return {
    version: 1,
    completed: [],
    segments: [],
    analyzedSegmentCount: 0,
    analyzedCastBatchCount: 0,
    incomplete: false,
  };
}

export type PipelinePhase =
  | "validate"
  | "structure"
  | "transcript"
  | "cast"
  | "style"
  | "compact"
  | "segment"
  | "narrative"
  | "produce"
  | "done";

export type PipelineSlice = {
  nextPhase: PipelinePhase;
  checkpoint: AnalysisCheckpoint;
  progress: AnalysisProgress;
  analysis?: VideoAnalysis;
  production?: import("./types").ProductionPlan;
  error?: string;
  done: boolean;
  awaitingCastReview?: boolean;
  awaitingDialogueReview?: boolean;
};

function markCompleted(checkpoint: AnalysisCheckpoint, step: AnalysisCheckpoint["completed"][number]) {
  if (!checkpoint.completed.includes(step)) checkpoint.completed = [...checkpoint.completed, step];
}

async function runOneCastBatch(data: AnalyzeInput, frames: FrameCapture[], checkpoint: AnalysisCheckpoint) {
  const batches = listCastBatches(frames);
  const total = Math.max(1, batches.length);
  const doneBatches = checkpoint.analyzedCastBatchCount ?? 0;
  console.info("[PIPELINE] Current checkpoint:", {
    completed: checkpoint.completed,
    segments: checkpoint.segments?.length ?? 0,
    characters: checkpoint.characters?.length ?? 0,
    castBatch: doneBatches + 1,
    castBatches: total,
  });
  console.info("[PIPELINE] Current step: 3 identification");
  console.info("[CHARACTERS] STEP START", { batch: doneBatches + 1, total });
  console.info("[CHARACTERS] Input available:", Boolean(frames.length));
  console.info("[CHARACTERS] Frames count:", frames.length);
  let cast: CastResult;
  try {
    cast = await identifyCharacters({
      frames,
      kind: data.kind,
      durationSeconds: data.durationSeconds,
      width: data.width,
      height: data.height,
      userNotes: [data.userNotes, formatUserBrief(data.userBrief)].filter(Boolean).join("\n"),
      batchIndex: doneBatches,
      knownCharacters: checkpoint.characters ?? [],
    });
    console.info("[CHARACTERS] AI response RECEIVED");
    console.info("[CHARACTERS] Characters detected:", (cast.characters ?? []).map((c) => c.id));
  } catch (err) {
    const error = err instanceof Error ? err : new Error(String(err));
    console.error("[CHARACTERS ERROR]", {
      step: 3,
      subStep: "identifyCharacters",
      errorName: error.name,
      errorMessage: error.message,
      stack: error.stack,
      frames: frames.length,
      batch: doneBatches + 1,
      checkpointBefore: checkpoint.completed,
    });
    cast = {
      characters: checkpoint.characters ?? [],
      observedSummary: checkpoint.observedSummary ?? "",
      limitations: [`Identification partielle : ${error.message}. L'analyse continue.`],
      language: checkpoint.language ?? null,
      done: doneBatches + 1 >= total,
      batchIndex: doneBatches,
      batchCount: total,
    };
  }
  checkpoint.characters = Array.isArray(cast.characters) ? cast.characters : checkpoint.characters ?? [];
  if (cast.cinematic && !checkpoint.cinematic) checkpoint.cinematic = cast.cinematic;
  if (cast.observedSummary && !checkpoint.observedSummary) checkpoint.observedSummary = cast.observedSummary;
  if (cast.language && !checkpoint.language) checkpoint.language = cast.language;
  checkpoint.limitations = [...new Set([...(checkpoint.limitations ?? []), ...(cast.limitations ?? [])])];
  checkpoint.analyzedCastBatchCount = doneBatches + 1;
  if (checkpoint.analyzedCastBatchCount >= total || cast.done) {
    const countWarning = briefCountWarning(
      data.userBrief?.expectedCount ?? "",
      (checkpoint.characters ?? []).length,
    );
    checkpoint.limitations = [
      ...(checkpoint.limitations ?? []),
      ...duplicateWarnings(checkpoint.characters ?? []),
      ...(countWarning ? [countWarning] : []),
    ];
    markCompleted(checkpoint, "cast");
    console.info("[CHARACTERS] STEP COMPLETE", {
      characters: checkpoint.characters?.length ?? 0,
      batches: checkpoint.analyzedCastBatchCount,
    });
    console.info("[PIPELINE] Moving to step 4");
  } else {
    console.info("[CHARACTERS] Batch persisted", {
      batch: checkpoint.analyzedCastBatchCount,
      total,
      characters: checkpoint.characters?.length ?? 0,
    });
  }
}

async function runCompactStep(
  data: AnalyzeInput,
  frames: FrameCapture[],
  checkpoint: AnalysisCheckpoint,
): Promise<VideoAnalysis> {
  const known = checkpoint.characters ?? [];
  const transcript = checkpoint.transcript ?? null;
  const transcriptNote = checkpoint.transcriptNote ?? "";
  const userContent: ChatContent[] = [
    {
      type: "text",
      text: `${buildAnalysisUserPrompt({
        durationSeconds: data.durationSeconds,
        width: data.width,
        height: data.height,
        frameTimes: frames.map((f) => f.t),
        transcript,
        userNotes: [data.userNotes, formatUserBrief(data.userBrief)].filter(Boolean).join("\n") || undefined,
        kind: data.kind,
      })}

PERSONNAGES DÉJÀ IDENTIFIÉS (réutiliser ces IDs) :
${known.length ? JSON.stringify(known) : "aucun personnage identifié — continuer sans en inventer"}

STYLE VISUEL CHOISI PAR L'UTILISATEUR — OBLIGATOIRE, NE PAS REMPLACER :
${JSON.stringify(checkpoint.visualStyle ?? styleFromUserChoice(data.chosenStyleId, data.chosenStyleText))}`,
    },
    ...images(frames.slice(0, 4)),
  ];
  let result: Awaited<ReturnType<typeof chat>>;
  try {
    result = await chat({
      messages: [
        { role: "system", content: buildAnalysisSystemPrompt(data.kind) },
        { role: "user", content: userContent },
      ],
      maxTokens: COMPACT_TOKENS,
    });
  } catch (err) {
    result = {
      ok: false,
      error: err instanceof Error && err.message.trim() ? err.message : NETWORK_MESSAGE,
    };
  }
  if (!result || !result.ok) {
    const analysis = analysisFromCheckpoint(checkpoint, data, transcript, transcriptNote);
    markCompleted(checkpoint, "segments");
    markCompleted(checkpoint, "narrative");
    checkpoint.incomplete = false;
    checkpoint.limitations = [...(checkpoint.limitations ?? []), result?.error || "Analyse visuelle partielle."];
    return analysis;
  }
  try {
    const parsed = tryExtractJson(result.text);
    if (!parsed || typeof parsed !== "object") throw new Error(INVALID_AI_MESSAGE);
    let analysis = parseAnalysis(parsed);
    if (known.length) analysis.characters = known;
    if (checkpoint.visualStyle) analysis.visualStyle = checkpoint.visualStyle;
    if (!analysis.audio.notes) analysis.audio.notes = transcriptNote;
    if (transcript && !analysis.audio.transcriptExcerpt) {
      analysis.audio.transcriptExcerpt = transcript.slice(0, 4000);
      analysis.audio.source = "transcript";
    }
    if (!analysis.observedSummary) {
      analysis.observedSummary = checkpoint.observedSummary || "Contenu observé à partir des photogrammes.";
    }
    analysis = applyDurationFit(analysis, data.durationSeconds, transcript);
    markCompleted(checkpoint, "segments");
    markCompleted(checkpoint, "narrative");
    checkpoint.incomplete = false;
    return analysis;
  } catch {
    try {
      let analysis = await parseOrRepair(result.text);
      if (known.length) analysis.characters = known;
      if (!analysis.audio.notes) analysis.audio.notes = transcriptNote;
      analysis = applyDurationFit(analysis, data.durationSeconds, transcript);
      markCompleted(checkpoint, "segments");
      markCompleted(checkpoint, "narrative");
      return analysis;
    } catch {
      const analysis = analysisFromCheckpoint(checkpoint, data, transcript, transcriptNote);
      markCompleted(checkpoint, "segments");
      markCompleted(checkpoint, "narrative");
      checkpoint.incomplete = false;
      return analysis;
    }
  }
}

async function runOneSegment(data: AnalyzeInput, frames: FrameCapture[], checkpoint: AnalysisCheckpoint) {
  const fruit = fruitHumanoidPromptBlock(data.kind === "fruit-humanoid");
  const angel = angelPromptBlock(data.kind === "angel");
  const segs: TimeSegment[] = (checkpoint.segments ?? []).map((s) => ({
    index: s.index,
    start: s.start,
    end: s.end,
    frameTimes: s.frameTimes,
  }));
  if (!segs.length) {
    const proposed = proposeSegments(
      data.durationSeconds,
      frames.map((f) => f.t),
    );
    checkpoint.segments = proposed.map((s) => ({
      index: s.index,
      start: s.start,
      end: s.end,
      frameTimes: s.frameTimes,
    }));
    segs.push(...proposed);
  }
  const notes = checkpoint.segmentNotes ?? checkpoint.segments ?? [];
  const i = Math.max(0, checkpoint.analyzedSegmentCount ?? 0);
  const seg = segs[i];
  if (!seg) {
    markCompleted(checkpoint, "segments");
    return;
  }
  const characters = checkpoint.characters ?? [];
  const picked = pickFrames(frames, seg.frameTimes, 2);
  const res = await chat({
    messages: [
      {
        role: "system",
        content: `Tu décris un SEGMENT déjà découpé. Réutilise les Character ID fournis. ${fruit}${angel}
JSON : { "setting":"", "action":"", "emotion":"", "camera":"", "lighting":"", "audio":"", "characters":[], "dialogue": null }`,
      },
      {
        role: "user",
        content: [
          {
            type: "text",
            text: `Segment ${i + 1}/${segs.length}, ${seg.start.toFixed(1)}s–${seg.end.toFixed(1)}s.
Personnages : ${characters.map((c) => c.id).join(", ") || "aucun"}
${data.userNotes ?? ""}`,
          },
          ...images(picked),
        ],
      },
    ],
    maxTokens: SEGMENT_TOKENS,
  });
  const parsed = res.ok ? tryExtractJson(res.text) : null;
  const rec = parsed && typeof parsed === "object" ? (parsed as Record<string, unknown>) : {};
  notes[i] = {
    index: seg.index,
    start: seg.start,
    end: seg.end,
    frameTimes: seg.frameTimes,
    setting: typeof rec.setting === "string" ? rec.setting : "",
    action: typeof rec.action === "string" ? rec.action : "",
    emotion: typeof rec.emotion === "string" ? rec.emotion : "",
    camera: typeof rec.camera === "string" ? rec.camera : "",
    lighting: typeof rec.lighting === "string" ? rec.lighting : "",
    audio: typeof rec.audio === "string" ? rec.audio : "",
    characters: Array.isArray(rec.characters) ? rec.characters.map(String) : [],
    dialogue: typeof rec.dialogue === "string" ? rec.dialogue : null,
    done: true,
  };
  checkpoint.segmentNotes = notes;
  checkpoint.analyzedSegmentCount = i + 1;
  checkpoint.segments = notes;
  if (checkpoint.analyzedSegmentCount >= segs.length) markCompleted(checkpoint, "segments");
}

async function runNarrativeStep(
  data: AnalyzeInput,
  frames: FrameCapture[],
  checkpoint: AnalysisCheckpoint,
): Promise<VideoAnalysis> {
  const transcript = checkpoint.transcript ?? null;
  const transcriptNote = checkpoint.transcriptNote ?? "";
  const characters = checkpoint.characters ?? [];
  const notes = checkpoint.segmentNotes ?? checkpoint.segments ?? [];
  const visualStyle = checkpoint.visualStyle;
  const cinematic = checkpoint.cinematic;
  const observedSummary = checkpoint.observedSummary ?? "";
  const limitations = checkpoint.limitations ?? [];
  const language = checkpoint.language ?? null;
  const scenesBlob = notes
    .map(
      (n, i) =>
        `Scène ${i + 1} (${n.start.toFixed(1)}–${n.end.toFixed(1)}s) ${n.setting ?? ""} ${n.action ?? ""} dialogue:${n.dialogue ?? "aucun"}`,
    )
    .join("\n");
  const narrative = await chat({
    messages: [
      { role: "system", content: buildAnalysisSystemPrompt(data.kind) },
      {
        role: "user",
        content: `Assemble l'analyse JSON complète à partir des segments et personnages.
${buildAnalysisUserPrompt({
  durationSeconds: data.durationSeconds,
  width: data.width,
  height: data.height,
  frameTimes: frames.map((f) => f.t),
  transcript,
  userNotes: data.userNotes,
  kind: data.kind,
})}
PERSONNAGES : ${JSON.stringify(characters)}
SEGMENTS : ${scenesBlob}
STYLE VISUEL CHOISI (ne pas remplacer) : ${visualStyle ? JSON.stringify(visualStyle) : "cinéma réaliste"}`,
      },
    ],
    maxTokens: NARRATIVE_TOKENS,
  });
  try {
    const raw = narrative.ok ? tryExtractJson(narrative.text) : null;
    let analysis = raw ? parseAnalysis(raw) : parseAnalysis({});
    if (characters.length) analysis.characters = characters;
    if (visualStyle) analysis.visualStyle = visualStyle;
    if (cinematic && !analysis.cinematic.dominantShots.length) analysis.cinematic = cinematic;
    if (!analysis.observedSummary) analysis.observedSummary = observedSummary;
    analysis.limitations = [...new Set([...(analysis.limitations ?? []), ...limitations])];
    if (language) analysis.language = language;
    if (!analysis.audio.notes) analysis.audio.notes = transcriptNote;
    if (transcript && !analysis.audio.transcriptExcerpt) {
      analysis.audio.transcriptExcerpt = transcript.slice(0, 4000);
      analysis.audio.source = "transcript";
    }
    analysis = applyDurationFit(analysis, data.durationSeconds, transcript);
    markCompleted(checkpoint, "narrative");
    checkpoint.incomplete = false;
    return analysis;
  } catch (err) {
    console.error("[PIPELINE] long-form narrative failed — synthesizing from checkpoint", err);
    const analysis = analysisFromCheckpoint(checkpoint, data, transcript, transcriptNote);
    markCompleted(checkpoint, "narrative");
    checkpoint.incomplete = false;
    return analysis;
  }
}

export async function runPipelineSlice(args: {
  data: AnalyzeInput;
  checkpoint?: AnalysisCheckpoint;
  phase: PipelinePhase;
}): Promise<PipelineSlice> {
  const data = args.data;
  const checkpoint: AnalysisCheckpoint = args.checkpoint
    ? { ...emptyCheckpoint(), ...args.checkpoint, incomplete: false }
    : emptyCheckpoint();
  const frames = clampFrames(data.frames ?? []);
  const longForm = isLongForm(data.durationSeconds, frames.length);

  const finish = (
    nextPhase: PipelinePhase,
    step: number,
    extra?: Partial<AnalysisProgress> & {
      analysis?: VideoAnalysis;
      production?: import("./types").ProductionPlan;
      error?: string;
      done?: boolean;
      awaitingCastReview?: boolean;
      awaitingDialogueReview?: boolean;
    },
  ): PipelineSlice => ({
    nextPhase,
    checkpoint,
    progress: progressAt(step, {
      compact: extra?.compact,
      segmentsDone: extra?.segmentsDone,
      segmentsTotal: extra?.segmentsTotal,
      castBatchesDone: extra?.castBatchesDone,
      castBatchesTotal: extra?.castBatchesTotal,
      productionScenesDone: extra?.productionScenesDone,
      productionScenesTotal: extra?.productionScenesTotal,
    }),
    analysis: extra?.analysis,
    production: extra?.production,
    error: extra?.error,
    done: Boolean(extra?.done),
    awaitingCastReview: extra?.awaitingCastReview,
    awaitingDialogueReview: extra?.awaitingDialogueReview,
  });

  switch (args.phase) {
    case "validate": {
      console.info("[VIDEO VALIDATION] Starting");
      if (data.userBrief) checkpoint.userBrief = data.userBrief;
      if (!frames.length) {
        return finish("done", 1, {
          error: "Pas assez d'images extraites de la vidéo. Vérifiez que le fichier n'est pas corrompu.",
          done: true,
        });
      }
      console.info("[VIDEO VALIDATION] Validation complete", { frames: frames.length });
      return finish("structure", 1);
    }
    case "structure": {
      console.info("[STRUCTURE] Starting analysis");
      if (!checkpoint.completed.includes("structure")) {
        try {
          const structure = await analyzeStructure({
            durationSeconds: data.durationSeconds,
            frameTimes: frames.map((f) => f.t),
            width: data.width,
            height: data.height,
          });
          checkpoint.segments = structure.segments;
          if (structure.structureStatus === "fallback") {
            checkpoint.limitations = [
              ...(checkpoint.limitations ?? []),
              "Structure simplifiée à partir de la durée source.",
            ];
          }
        } catch (err) {
          console.error("[STRUCTURE ERROR]", err);
          const structure = fallbackStructure(
            data.durationSeconds,
            frames.map((f) => f.t),
          );
          checkpoint.segments = structure.segments;
        }
        markCompleted(checkpoint, "structure");
      }
      console.info("[STRUCTURE] Moving to step 3", { segments: checkpoint.segments?.length ?? 0 });
      return finish("transcript", 2);
    }
    case "transcript": {
      if (!checkpoint.transcript && !checkpoint.transcriptNote) {
        try {
          const transcribed = await collectTranscript(data, checkpoint);
          checkpoint.transcript = transcribed.text;
          checkpoint.transcriptNote = transcribed.note;
        } catch (err) {
          console.error("[PIPELINE] transcript skipped", err);
          checkpoint.transcriptNote = "Transcription indisponible — l'analyse continue.";
        }
      }
      console.info("[PIPELINE] Moving to step 3");
      return finish("cast", 3);
    }
    case "cast": {
      if (!checkpoint.completed.includes("cast")) {
        await runOneCastBatch(data, frames, checkpoint);
      }
      const total = Math.max(1, listCastBatches(frames).length);
      const doneCount = checkpoint.analyzedCastBatchCount ?? 0;
      if (!checkpoint.completed.includes("cast")) {
        return finish("cast", 3, {
          castBatchesDone: doneCount,
          castBatchesTotal: total,
        });
      }
      return finish("style", 4, {
        castBatchesDone: doneCount,
        castBatchesTotal: total,
      });
    }
    case "style": {
      checkpoint.visualStyle = styleFromUserChoice(data.chosenStyleId, data.chosenStyleText);
      console.info("[STYLE] Applied user choice", {
        id: data.chosenStyleId,
        phrase: checkpoint.visualStyle.lockedStylePhrase,
      });
      if (!checkpoint.castValidated) {
        console.info("[CHARACTERS] Awaiting user validation", {
          count: checkpoint.characters?.length ?? 0,
        });
        return finish(longForm ? "segment" : "compact", 3, { awaitingCastReview: true, done: true });
      }
      return finish(longForm ? "segment" : "compact", 4, { compact: !longForm });
    }
    case "compact": {
      console.info("[PIPELINE] compact START (scènes + narration)");
      if (!checkpoint.visualStyle?.lockedStylePhrase) {
        checkpoint.visualStyle = styleFromUserChoice(data.chosenStyleId, data.chosenStyleText);
      }
      if (!checkpoint.analysis) {
        checkpoint.analysis = await runCompactStep(data, frames, checkpoint);
      }
      console.info("[PIPELINE] compact COMPLETE");
      if (!checkpoint.dialoguesValidated) {
        return finish("produce", 6, {
          compact: true,
          analysis: checkpoint.analysis,
          awaitingDialogueReview: true,
          done: true,
        });
      }
      return finish("produce", 7, { compact: true, analysis: checkpoint.analysis });
    }
    case "segment": {
      await runOneSegment(data, frames, checkpoint);
      const total = checkpoint.segments?.length ?? 1;
      const doneCount = checkpoint.analyzedSegmentCount ?? 0;
      if (checkpoint.completed.includes("segments")) {
        return finish("narrative", 6, { segmentsDone: doneCount, segmentsTotal: total });
      }
      return finish("segment", 5, { segmentsDone: doneCount, segmentsTotal: total });
    }
    case "narrative": {
      if (!checkpoint.analysis) {
        checkpoint.analysis = await runNarrativeStep(data, frames, checkpoint);
      }
      if (!checkpoint.dialoguesValidated) {
        return finish("produce", 6, {
          analysis: checkpoint.analysis,
          awaitingDialogueReview: true,
          done: true,
        });
      }
      return finish("produce", 7, { analysis: checkpoint.analysis });
    }
    case "produce": {
      const analysis = checkpoint.analysis;
      if (!analysis) {
        return finish("done", 7, { done: true, error: "Analyse absente pour générer les prompts." });
      }
      const slice = await runProductionSlice({
        analysis,
        kind: data.kind,
        mode: data.mode ?? "reconstruction",
        userNotes: data.userNotes,
        durationSeconds: data.durationSeconds,
        checkpoint,
      });
      checkpoint.production = slice.checkpoint.production;
      checkpoint.analyzedProductionSceneCount = slice.checkpoint.analyzedProductionSceneCount;
      checkpoint.completed = slice.checkpoint.completed;
      if (slice.error) {
        return finish("done", 7, { done: true, error: slice.error, analysis });
      }
      if (slice.done && slice.production) {
        return finish("done", 7, {
          done: true,
          analysis,
          production: slice.production,
        });
      }
      return finish("produce", 7, {
        analysis,
        productionScenesDone: slice.progress.productionScenesDone,
        productionScenesTotal: slice.progress.productionScenesTotal,
      });
    }
    default:
      return finish("done", 7, { done: true, error: NETWORK_MESSAGE });
  }
}

export async function runAnalysisPipeline(
  data: AnalyzeInput,
  onProgress?: (progress: AnalysisProgress) => void,
): Promise<OkErr<{ analysis: VideoAnalysis; incomplete?: boolean; checkpoint?: AnalysisCheckpoint }>> {
  if (!data) {
    return fail("Aucune vidéo sélectionnée. Veuillez importer une vidéo avant de lancer l'analyse.");
  }
  let phase: PipelinePhase = "validate";
  let checkpoint: AnalysisCheckpoint = data.checkpoint
    ? { ...emptyCheckpoint(), ...data.checkpoint, incomplete: false }
    : emptyCheckpoint();
  const frames = clampFrames(data.frames ?? []);
  const payload: AnalyzeInput = { ...data, frames };

  while (phase !== "done") {
    const slice = await runPipelineSlice({ data: payload, checkpoint, phase });
    checkpoint = slice.checkpoint;
    onProgress?.(slice.progress);
    if (slice.done && slice.analysis) {
      return { ok: true, analysis: slice.analysis, checkpoint };
    }
    if (slice.done && slice.error) {
      return { ok: false, error: slice.error, checkpoint, incomplete: true };
    }
    if (slice.nextPhase === phase && phase !== "segment") {
      return fail(slice.error || NETWORK_MESSAGE);
    }
    phase = slice.nextPhase;
  }
  return fail(NETWORK_MESSAGE);
}
