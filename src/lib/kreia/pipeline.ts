import { progressAt, type AnalysisProgress } from "./analysis-stages";
import { buildAnalysisSystemPrompt, buildAnalysisUserPrompt } from "./engines/analysis-prompt";
import { identifyCharacters, listCastBatches, type CastResult } from "./engines/cast";
import {
  closestPromptDuration,
  expectedSceneCount,
  formatClock,
  inferSourceDuration,
  proposeSegments,
  splitOversizedAnalysisScene,
  type TimeSegment,
} from "./engines/duration";
import {
  attachDialogues,
  fitDialoguesToScenes,
  formatLockedDialogue,
  lockCharactersSourceNames,
  matchCharacter,
} from "./engines/dialogues";
import { analyzeStructure, fallbackStructure } from "./engines/structure";
import { duplicateWarnings } from "./engines/cast-edit";
import { briefCountWarning, formatUserBrief } from "./user-brief";
import { styleFromUserChoice } from "./visual-styles";
import { inferCharacterRelationships } from "./engines/relationships";
import { emptyDialoguePassDebug, formatDialoguePassDebug } from "./engines/pass-debug";
import { linesFromSegmentPayload, sliceTranscriptForWindow } from "./engines/transcript-slice";
import { fruitHumanoidPromptBlock } from "./engines/fruit-humanoid";
import { angelPromptBlock } from "./engines/angel";
import { runProductionSlice } from "./engines/production";
import { assignSpeakersForScene, assignSpeakersWithLlm } from "./engines/speaker-assign";
import {
  chat,
  fail,
  formatSttWords,
  keepWordsInOwnWindow,
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

function isLongForm(duration: number, frameTimes: number[] = []): boolean {
  return inferSourceDuration(duration, { frameTimes }) > 10;
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
  const lastSpoken = Math.max(
    0,
    ...(analysis.dialogues?.lines ?? []).map((line) => Number(line.endTime ?? line.startTime ?? 0)),
  );
  const duration = inferSourceDuration(durationSeconds, { lastDialogueTime: lastSpoken });
  let next: VideoAnalysis = {
    ...analysis,
    characters: lockCharactersSourceNames(analysis.characters),
  };
  const before = next.scenes.length;
  const scenes = splitOversizedAnalysisScene(next.scenes, duration || durationSeconds);
  console.info(
    `[PIPELINE] durationFit duration=${duration || durationSeconds} scenes ${before}→${scenes.length}`,
  );
  next = { ...next, scenes, sceneCountEstimate: scenes.length };
  next = attachDialogues(next, transcript ?? next.dialogues?.rawTranscript ?? next.audio.transcriptExcerpt, duration || durationSeconds);
  return fitDialoguesToScenes(next, before, duration || durationSeconds);
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
): Promise<{ text: string | null; note: string; ok: boolean; error?: string }> {
  if (checkpoint.transcript) {
    return { text: checkpoint.transcript, note: checkpoint.transcriptNote ?? "Transcription reprise.", ok: true };
  }
  const chunks = (data.audioChunks ?? []).filter(
    (c) => typeof c.wavBase64 === "string" && c.wavBase64.length > 2048,
  );
  if (chunks.length) {
    const parts: string[] = [];
    let lastError: string | undefined;
    for (let i = 0; i < chunks.length; i += 2) {
      const batch = chunks.slice(i, i + 2);
      const results = await Promise.all(batch.map((chunk) => transcribeWav(chunk.wavBase64)));
      batch.forEach((chunk, idx) => {
        const result = results[idx];
        if (result?.words?.length) {
          const kept = keepWordsInOwnWindow(result.words, chunk);
          const text = formatSttWords(kept);
          if (text) parts.push(text);
          return;
        }
        if (result?.text) {
          parts.push(`[${(chunk.ownStart ?? chunk.t).toFixed(1)}s] ${result.text}`);
          return;
        }
        if (result?.error) lastError = result.error;
      });
    }
    if (parts.length) return { text: parts.join("\n"), note: "Transcription obtenue.", ok: true };
    return {
      text: null,
      note: "La piste audio n'a pas pu être transcrite. Les sous-titres et le contexte visuel restent la seule source.",
      ok: false,
      error: lastError,
    };
  }
  if (data.audioWavBase64 && data.audioWavBase64.length > 2048 && data.audioWavBase64.length <= 280_000) {
    const tr = await transcribeWav(data.audioWavBase64);
    return { text: tr.text, note: tr.note, ok: tr.ok, error: tr.error };
  }
  return { text: null, note: "Aucune piste audio extraite.", ok: false, error: "no-audio" };
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
  | "speakers"
  | "relationships"
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
    const analysis = applyDurationFit(
      analysisFromCheckpoint(checkpoint, data, transcript, transcriptNote),
      data.durationSeconds,
      transcript,
    );
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
      const analysis = applyDurationFit(
        analysisFromCheckpoint(checkpoint, data, transcript, transcriptNote),
        data.durationSeconds,
        transcript,
      );
      markCompleted(checkpoint, "segments");
      markCompleted(checkpoint, "narrative");
      checkpoint.incomplete = false;
      return analysis;
    }
  }
}

function framesInWindow(frames: FrameCapture[], start: number, end: number, max = 3): FrameCapture[] {
  const inW = frames.filter((f) => f.t >= start - 0.05 && f.t <= end + 0.05);
  return inW.slice(0, max);
}

async function runOneSegment(data: AnalyzeInput, frames: FrameCapture[], checkpoint: AnalysisCheckpoint) {
  const duration = inferSourceDuration(data.durationSeconds, { frameTimes: frames.map((f) => f.t) });
  let segs: TimeSegment[] = (checkpoint.segments ?? []).map((s) => ({
    index: s.index,
    start: s.start,
    end: s.end,
    frameTimes: s.frameTimes,
  }));
  if (!segs.length || segs.length !== expectedSceneCount(duration || data.durationSeconds)) {
    const proposed = proposeSegments(
      duration || data.durationSeconds,
      frames.map((f) => f.t),
    );
    checkpoint.segments = proposed.map((s) => ({
      index: s.index,
      start: s.start,
      end: s.end,
      frameTimes: s.frameTimes,
    }));
    segs = proposed;
  }
  const notes = checkpoint.segmentNotes ?? checkpoint.segments ?? [];
  const i = Math.max(0, checkpoint.analyzedSegmentCount ?? 0);
  const seg = segs[i];
  if (!seg) {
    markCompleted(checkpoint, "segments");
    return;
  }
  const characters = checkpoint.characters ?? [];
  const picked = framesInWindow(frames, seg.start, seg.end, 2);
  const transcriptSlice = sliceTranscriptForWindow(
    checkpoint.transcript,
    seg.start,
    seg.end,
    duration || data.durationSeconds,
  );
  const fruit = fruitHumanoidPromptBlock(data.kind === "fruit-humanoid");
  const angel = angelPromptBlock(data.kind === "angel");
  let rec: Record<string, unknown> = {};
  try {
    const res = await chat({
      messages: [
        {
          role: "system",
          content: `Tu analyses UNIQUEMENT ce segment (≤ 10 s). Ignore le reste de la vidéo.
Réutilise les Character ID fournis.
${transcriptSlice.trim()
  ? "N'invente pas de répliques hors du transcript de CE segment."
  : "Aucune parole n'a été transcrite pour ce segment. dialogues DOIT être []. N'invente aucune réplique, même si une image suggère qu'on parle."}
JSON : { "setting":"", "action":"", "emotion":"", "camera":"", "lighting":"", "audio":"", "characters":[], "dialogues":[{ "speaker":"", "text":"", "startTime":0 }] }
${fruit}${angel}`,
        },
        {
          role: "user",
          content: [
            {
              type: "text",
              text: `Segment ${i + 1}/${segs.length} — ${formatClock(seg.start)} → ${formatClock(seg.end)}
Personnages connus : ${characters.map((c) => `${c.id} (${c.name || c.designation})`).join(", ") || "aucun"}
TRANSCRIPT DE CE SEGMENT UNIQUEMENT :
${transcriptSlice || "(aucune parole horodatée dans cette fenêtre — ne pas inventer)"}
${data.userNotes ?? ""}`,
            },
            ...images(picked),
          ],
        },
      ],
      maxTokens: SEGMENT_TOKENS,
    });
    const parsed = res.ok ? tryExtractJson(res.text) : null;
    rec = parsed && typeof parsed === "object" ? (parsed as Record<string, unknown>) : {};
    if (!transcriptSlice.trim()) {
      rec.dialogues = [];
      rec.dialogue = "";
    }
  } catch (err) {
    console.error("[SEGMENT] analysis failed, keeping local fallback", err);
  }
  const localChars = Array.isArray(rec.characters) ? rec.characters.map(String) : [];
  const resolvedChars = [
    ...new Set(
      localChars
        .map((raw) => matchCharacter(raw, characters)?.id)
        .filter((id): id is string => Boolean(id)),
    ),
  ];
  const pool =
    resolvedChars.length >= 2
      ? characters.filter((c) => resolvedChars.includes(c.id))
      : characters;
  const dialogues = linesFromSegmentPayload(rec, {
    sceneNumber: i + 1,
    start: seg.start,
    end: seg.end,
    characters: pool,
    transcriptSlice,
  });
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
    characters: resolvedChars.length >= 2 ? resolvedChars : characters.map((c) => c.id),
    dialogue: formatLockedDialogue(dialogues) || (typeof rec.dialogue === "string" ? rec.dialogue : null),
    dialogues,
    status: Object.keys(rec).length ? "ok" : "failed",
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
  const notes = checkpoint.segmentNotes ?? checkpoint.segments ?? [];
  const duration = inferSourceDuration(data.durationSeconds, { frameTimes: frames.map((f) => f.t) });
  const durations = notes.map((n) => closestPromptDuration(Math.max(0.1, n.end - n.start)));
  const scenes = notes.map((n, i) => ({
    number: i + 1,
    estimatedDuration: durations[i] ?? 10,
    startHint: `${formatClock(n.start)} → ${formatClock(n.end)}`,
    characters: n.characters ?? [],
    setting: n.setting ?? "",
    action: n.action ?? "",
    emotion: n.emotion ?? "",
    camera: n.camera ?? "",
    lighting: n.lighting ?? "",
    audio: n.audio ?? "",
    dialogue: formatLockedDialogue(n.dialogues ?? []) || n.dialogue || null,
    dialogueSpeaker: n.dialogues?.[0]?.speakerLabel ?? n.speakerId ?? null,
    styleNotes: "",
    confidence: n.status === "ok" ? ("observed" as const) : ("inferred" as const),
    silentReactions: n.silentReactions ?? [],
  }));
  const lines = notes.flatMap((n, i) =>
    (n.dialogues ?? []).map((line, j) => ({
      ...line,
      sceneNumber: i + 1,
      order: j + 1,
    })),
  );
  let analysis = parseAnalysis({
    observedSummary:
      checkpoint.observedSummary ||
      notes
        .map((n) => n.action)
        .filter(Boolean)
        .join(" "),
    limitations: checkpoint.limitations ?? [],
    language: checkpoint.language,
    sceneCountEstimate: scenes.length,
    characters: checkpoint.characters ?? [],
    visualStyle: checkpoint.visualStyle,
    cinematic: checkpoint.cinematic,
    scenes,
    audio: {
      transcriptExcerpt: transcript,
      notes: transcriptNote,
      source: transcript ? "transcript" : "unavailable",
    },
    dialogues: {
      language: checkpoint.language ?? null,
      source: transcript ? "transcript" : "unavailable",
      rawTranscript: transcript,
      lines,
    },
  });
  if (checkpoint.characters?.length) analysis.characters = lockCharactersSourceNames(checkpoint.characters);
  if (checkpoint.visualStyle) analysis.visualStyle = checkpoint.visualStyle;
  analysis.sceneCountEstimate = scenes.length;
  analysis = fitDialoguesToScenes(analysis, scenes.length, duration || data.durationSeconds);
  markCompleted(checkpoint, "narrative");
  checkpoint.incomplete = false;
  return analysis;
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
  const longForm = isLongForm(data.durationSeconds, frames.map((f) => f.t));
  console.info(
    `[PIPELINE] duration=${data.durationSeconds} frames=${frames.length} isLongForm=${longForm}`,
  );

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
      speakerScenesDone: extra?.speakerScenesDone,
      speakerScenesTotal: extra?.speakerScenesTotal,
      debug: formatDialoguePassDebug(checkpoint.dialogueDebug) || extra?.debug,
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
      const debug = checkpoint.dialogueDebug ?? emptyDialoguePassDebug();
      if (!checkpoint.transcript && !checkpoint.transcriptNote) {
        try {
          const transcribed = await collectTranscript(data, checkpoint);
          checkpoint.transcript = transcribed.text;
          checkpoint.transcriptNote = transcribed.note;
          debug.transcriptOk = Boolean(transcribed.ok && transcribed.text);
          debug.transcriptNote = transcribed.note;
          debug.transcriptError = transcribed.error;
        } catch (err) {
          console.error("[PIPELINE] transcript skipped", err);
          checkpoint.transcriptNote = "Transcription indisponible — l'analyse continue.";
          debug.transcriptOk = false;
          debug.transcriptNote = checkpoint.transcriptNote;
          debug.transcriptError = err instanceof Error ? err.message : String(err);
        }
      } else {
        debug.transcriptOk = Boolean(checkpoint.transcript);
        debug.transcriptNote = checkpoint.transcriptNote;
      }
      checkpoint.dialogueDebug = debug;
      console.info("[PIPELINE] transcript", debug.transcriptOk, debug.transcriptNote, debug.transcriptError);
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
      return finish("speakers", 6, { compact: true, analysis: checkpoint.analysis });
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
      return finish("speakers", 6, { analysis: checkpoint.analysis });
    }
    case "speakers": {
      const debug = checkpoint.dialogueDebug ?? emptyDialoguePassDebug();
      if (!checkpoint.analysis) {
        debug.speakersError = "no-analysis";
        checkpoint.dialogueDebug = debug;
        return finish("relationships", 6);
      }
      const scenes = checkpoint.analysis.scenes ?? [];
      const fromLines = [...new Set((checkpoint.analysis.dialogues?.lines ?? []).map((line) => line.sceneNumber))];
      const sceneNumbers = scenes.length ? scenes.map((scene) => scene.number) : fromLines;
      const total = Math.max(1, sceneNumbers.length);
      const doneCount = checkpoint.analyzedSpeakerSceneCount ?? 0;
      debug.speakerSceneProgress = `${Math.min(doneCount, total)}/${total}`;
      checkpoint.dialogueDebug = debug;
      if (doneCount < sceneNumbers.length) {
        const sceneNumber = sceneNumbers[doneCount]!;
        try {
          checkpoint.analysis = frames.length
            ? await assignSpeakersForScene(checkpoint.analysis, sceneNumber, frames, debug)
            : await assignSpeakersWithLlm(checkpoint.analysis, debug);
        } catch (err) {
          debug.speakersAttempted = true;
          debug.speakersOk = false;
          debug.speakersError = err instanceof Error ? err.message : String(err);
        }
        checkpoint.analyzedSpeakerSceneCount = frames.length ? doneCount + 1 : sceneNumbers.length;
        debug.speakerSceneProgress = `${checkpoint.analyzedSpeakerSceneCount}/${total}`;
        checkpoint.dialogueDebug = debug;
        if ((checkpoint.analyzedSpeakerSceneCount ?? 0) < sceneNumbers.length) {
          return finish("speakers", 6, {
            analysis: checkpoint.analysis,
            speakerScenesDone: checkpoint.analyzedSpeakerSceneCount,
            speakerScenesTotal: total,
          });
        }
      }
      markCompleted(checkpoint, "speakers");
      return finish("relationships", 6, {
        analysis: checkpoint.analysis,
        speakerScenesDone: total,
        speakerScenesTotal: total,
      });
    }
    case "relationships": {
      const debug = checkpoint.dialogueDebug ?? emptyDialoguePassDebug();
      if (checkpoint.analysis) {
        try {
          checkpoint.analysis = await inferCharacterRelationships(checkpoint.analysis, debug);
        } catch (err) {
          debug.relationshipsAttempted = true;
          debug.relationshipsOk = false;
          debug.relationshipsError = err instanceof Error ? err.message : String(err);
        }
        checkpoint.dialogueDebug = debug;
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
