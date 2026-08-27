import { progressAt, type AnalysisProgress } from "./analysis-stages";
import { buildAnalysisSystemPrompt, buildAnalysisUserPrompt } from "./engines/analysis-prompt";
import { identifyCharacters, type CastResult } from "./engines/cast";
import {
  collapseAnalysisScenes,
  proposeSegments,
  type TimeSegment,
} from "./engines/duration";
import { fallbackStructure } from "./engines/structure";
import {
  attachDialogues,
  fitDialoguesToScenes,
  lockCharactersSourceNames,
} from "./engines/dialogues";
import { fruitHumanoidPromptBlock } from "./engines/fruit-humanoid";
import { angelPromptBlock } from "./engines/angel";
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
  CharacterSheet,
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
    incomplete: false,
  };
}

export async function runAnalysisPipeline(
  data: AnalyzeInput,
  onProgress?: (progress: AnalysisProgress) => void,
): Promise<OkErr<{ analysis: VideoAnalysis; incomplete?: boolean; checkpoint?: AnalysisCheckpoint }>> {
  if (!data) {
    return fail("Aucune vidéo sélectionnée. Veuillez importer une vidéo avant de lancer l'analyse.");
  }

  const report = (step: number, extra?: Partial<AnalysisProgress>) => {
    const progress = progressAt(step, extra);
    console.info("[PIPELINE]", progress.step, progress.label);
    onProgress?.(progress);
  };

  report(1);
  console.info("[VIDEO VALIDATION] Starting");
  console.info("[VIDEO VALIDATION] Source exists:", Array.isArray(data.frames) && data.frames.length > 0);
  console.info("[VIDEO VALIDATION] Source type:", data.kind);
  console.info("[VIDEO VALIDATION] Metadata loading");
  const frames = clampFrames(data.frames ?? []);
  console.info("[VIDEO VALIDATION] Metadata loaded", {
    duration: data.durationSeconds,
    frames: frames.length,
    width: data.width,
    height: data.height,
  });
  console.info("[VIDEO VALIDATION] Duration:", data.durationSeconds);
  if (!frames.length) {
    console.error("[VIDEO VALIDATION ERROR]", {
      exactSubStep: "frames",
      error: "no usable frames",
    });
    return fail("Pas assez d'images extraites de la vidéo. Vérifiez que le fichier n'est pas corrompu.");
  }
  console.info("[VIDEO VALIDATION] Validation complete");
  console.info("[PIPELINE] Moving to step 2");

  report(2);
  const checkpoint: AnalysisCheckpoint = data.checkpoint
    ? { ...emptyCheckpoint(), ...data.checkpoint, incomplete: false }
    : emptyCheckpoint();
  if (!checkpoint.segments?.length) {
    const structure = fallbackStructure(
      data.durationSeconds,
      frames.map((f) => f.t),
    );
    checkpoint.segments = structure.segments;
  }
  console.info("[STRUCTURE] State updated", { segments: checkpoint.segments.length });
  console.info("[PIPELINE] Moving to step 3");
  report(3);

  let transcript: string | null = checkpoint.transcript ?? null;
  let transcriptNote = checkpoint.transcriptNote ?? "";
  try {
    const transcribed = await collectTranscript(data, checkpoint);
    transcript = transcribed.text;
    transcriptNote = transcribed.note;
    checkpoint.transcript = transcript;
    checkpoint.transcriptNote = transcriptNote;
  } catch (err) {
    console.error("[PIPELINE] transcript skipped", err);
    transcriptNote = "Transcription indisponible — l'analyse continue.";
    checkpoint.transcriptNote = transcriptNote;
  }

  if (isLongForm(data.durationSeconds, frames.length)) {
    return runLongForm(data, frames, transcript, transcriptNote, checkpoint, report);
  }
  return runCompact(data, frames, transcript, transcriptNote, checkpoint, report);
}

async function runCompact(
  data: AnalyzeInput,
  frames: FrameCapture[],
  transcript: string | null,
  transcriptNote: string,
  checkpoint: AnalysisCheckpoint,
  report: (step: number, extra?: Partial<AnalysisProgress>) => void,
): Promise<OkErr<{ analysis: VideoAnalysis; incomplete?: boolean; checkpoint?: AnalysisCheckpoint }>> {
  if (!checkpoint.completed.includes("cast")) {
    report(3, { compact: true });
    let cast: CastResult;
    try {
      cast = await identifyCharacters({
        frames,
        kind: data.kind,
        durationSeconds: data.durationSeconds,
        width: data.width,
        height: data.height,
        userNotes: data.userNotes,
      });
    } catch (err) {
      console.error("[CHARACTER PIPELINE ERROR]", err);
      cast = {
        characters: [],
        observedSummary: "",
        limitations: ["Identification partielle — l'analyse continue."],
        language: null,
      };
    }
    checkpoint.completed = ["cast"];
    checkpoint.characters = cast.characters;
    checkpoint.visualStyle = cast.visualStyle;
    checkpoint.cinematic = cast.cinematic;
    checkpoint.observedSummary = cast.observedSummary;
    checkpoint.limitations = cast.limitations;
    checkpoint.language = cast.language;
  }

  report(4, { compact: true });
  const known = checkpoint.characters ?? [];
  const userContent: ChatContent[] = [
    {
      type: "text",
      text: `${buildAnalysisUserPrompt({
        durationSeconds: data.durationSeconds,
        width: data.width,
        height: data.height,
        frameTimes: frames.map((f) => f.t),
        transcript,
        userNotes: data.userNotes,
        kind: data.kind,
      })}

PERSONNAGES DÉJÀ IDENTIFIÉS (réutiliser ces IDs) :
${known.length ? JSON.stringify(known) : "aucun personnage identifié — continuer sans en inventer"}`,
    },
    ...images(frames.slice(0, 4)),
  ];
  const result = await chat({
    messages: [
      { role: "system", content: buildAnalysisSystemPrompt(data.kind) },
      { role: "user", content: userContent },
    ],
    maxTokens: COMPACT_TOKENS,
  });
  if (!result || !result.ok) {
    checkpoint.incomplete = true;
    checkpoint.failedStep = "scenes";
    checkpoint.failedMessage = result?.error || NETWORK_MESSAGE;
    return {
      ok: false,
      error: checkpoint.failedMessage,
      message: checkpoint.failedMessage,
      checkpoint,
      incomplete: true,
    };
  }

  report(5, { compact: true });
  report(6, { compact: true });
  try {
    const parsed = tryExtractJson(result.text);
    if (!parsed || typeof parsed !== "object") throw new Error(INVALID_AI_MESSAGE);
    let analysis = parseAnalysis(parsed);
    if (!analysis.characters.length && known.length) analysis.characters = known;
    if (checkpoint.visualStyle && !analysis.visualStyle.lockedStylePhrase) {
      analysis.visualStyle = checkpoint.visualStyle;
    }
    if (!analysis.audio.notes) analysis.audio.notes = transcriptNote;
    if (transcript && !analysis.audio.transcriptExcerpt) {
      analysis.audio.transcriptExcerpt = transcript.slice(0, 4000);
      analysis.audio.source = "transcript";
    }
    if (!analysis.observedSummary) {
      analysis.observedSummary =
        checkpoint.observedSummary || "Contenu observé à partir des photogrammes.";
    }
    report(7);
    analysis = applyDurationFit(analysis, data.durationSeconds, transcript);
    checkpoint.completed = ["cast", "segments", "narrative"];
    checkpoint.incomplete = false;
    return { ok: true, analysis, checkpoint };
  } catch (err) {
    try {
      let analysis = await parseOrRepair(result.text);
      if (!analysis.characters.length && known.length) analysis.characters = known;
      report(7);
      analysis = applyDurationFit(analysis, data.durationSeconds, transcript);
      if (!analysis.audio.notes) analysis.audio.notes = transcriptNote;
      checkpoint.completed = ["cast", "segments", "narrative"];
      return { ok: true, analysis, checkpoint };
    } catch {
      checkpoint.incomplete = true;
      checkpoint.failedStep = "narrative";
      checkpoint.failedMessage = err instanceof Error ? err.message : INVALID_AI_MESSAGE;
      return {
        ok: false,
        error: checkpoint.failedMessage,
        message:
          "Certains éléments n'ont pas pu être reconstruits. Vous pouvez reprendre l'analyse.",
        checkpoint,
        incomplete: true,
      };
    }
  }
}

async function runLongForm(
  data: AnalyzeInput,
  frames: FrameCapture[],
  transcript: string | null,
  transcriptNote: string,
  checkpoint: AnalysisCheckpoint,
  report: (step: number, extra?: Partial<AnalysisProgress>) => void,
): Promise<OkErr<{ analysis: VideoAnalysis; incomplete?: boolean; checkpoint?: AnalysisCheckpoint }>> {
  const fruit = fruitHumanoidPromptBlock(data.kind === "fruit-humanoid");
  const angel = angelPromptBlock(data.kind === "angel");
  const segs: TimeSegment[] =
    checkpoint.segments?.length
      ? checkpoint.segments.map((s) => ({
          index: s.index,
          start: s.start,
          end: s.end,
          frameTimes: s.frameTimes,
        }))
      : proposeSegments(
          data.durationSeconds,
          frames.map((f) => f.t),
        );

  let characters: CharacterSheet[] = checkpoint.characters ?? [];
  let visualStyle = checkpoint.visualStyle;
  let cinematic = checkpoint.cinematic;
  let observedSummary = checkpoint.observedSummary ?? "";
  let limitations = checkpoint.limitations ?? [];
  let language = checkpoint.language ?? null;

  if (!checkpoint.completed.includes("cast")) {
    report(3);
    let cast: CastResult;
    try {
      cast = await identifyCharacters({
        frames,
        kind: data.kind,
        durationSeconds: data.durationSeconds,
        width: data.width,
        height: data.height,
        userNotes: data.userNotes,
      });
    } catch (err) {
      console.error("[CHARACTER PIPELINE ERROR]", err);
      cast = {
        characters: [],
        observedSummary: "",
        limitations: ["Identification partielle — l'analyse continue."],
        language: null,
      };
    }
    characters = cast.characters ?? [];
    visualStyle = cast.visualStyle;
    cinematic = cast.cinematic;
    observedSummary = cast.observedSummary;
    limitations = cast.limitations;
    language = cast.language;
    checkpoint.completed = ["cast"];
    checkpoint.characters = characters;
    checkpoint.visualStyle = visualStyle;
    checkpoint.cinematic = cinematic;
    checkpoint.observedSummary = observedSummary;
    checkpoint.limitations = limitations;
    checkpoint.language = language;
    checkpoint.segments = segs.map((s) => ({
      index: s.index,
      start: s.start,
      end: s.end,
      frameTimes: s.frameTimes,
    }));
  }

  report(4);
  report(5);
  const notes = checkpoint.segmentNotes ?? checkpoint.segments ?? [];
  const analyzed = Math.max(0, checkpoint.analyzedSegmentCount ?? 0);
  for (let i = analyzed; i < segs.length; i += 1) {
    const seg = segs[i]!;
    report(5, { segmentsDone: i, segmentsTotal: segs.length });
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
  }

  report(6);
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
STYLE : ${visualStyle ? JSON.stringify(visualStyle) : "fidèle aux images"}`,
      },
    ],
    maxTokens: NARRATIVE_TOKENS,
  });

  try {
    const raw = narrative.ok ? tryExtractJson(narrative.text) : null;
    let analysis = raw ? parseAnalysis(raw) : parseAnalysis({});
    if (!analysis.characters.length) analysis.characters = characters;
    if (visualStyle && !analysis.visualStyle.lockedStylePhrase) analysis.visualStyle = visualStyle;
    if (cinematic && !analysis.cinematic.dominantShots.length) analysis.cinematic = cinematic;
    if (!analysis.observedSummary) analysis.observedSummary = observedSummary;
    analysis.limitations = [...new Set([...(analysis.limitations ?? []), ...limitations])];
    if (language) analysis.language = language;
    if (!analysis.audio.notes) analysis.audio.notes = transcriptNote;
    if (transcript && !analysis.audio.transcriptExcerpt) {
      analysis.audio.transcriptExcerpt = transcript.slice(0, 4000);
      analysis.audio.source = "transcript";
    }
    report(7);
    analysis = applyDurationFit(analysis, data.durationSeconds, transcript);
    checkpoint.completed = ["cast", "segments", "narrative"];
    checkpoint.incomplete = false;
    return { ok: true, analysis, checkpoint };
  } catch (err) {
    checkpoint.incomplete = true;
    checkpoint.failedStep = "narrative";
    checkpoint.failedMessage = err instanceof Error ? err.message : INVALID_AI_MESSAGE;
    return {
      ok: false,
      error: checkpoint.failedMessage,
      message: "Certains éléments n'ont pas pu être reconstruits. Vous pouvez reprendre l'analyse.",
      checkpoint,
      incomplete: true,
    };
  }
}
