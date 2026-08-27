import { progressAt, type AnalysisProgress } from "./analysis-stages";
import { extractAudioChunks } from "./audio";
import { capturePlan, extractFrames, loadVideoElement, toAnalysisFrames } from "./frames";
import { isPostTransportError, runKreiaJob } from "./job-client";
import { failMessage, fitAnalyzePayload, logKreia, logKreiaError } from "./rpc";
import { fallbackStructure } from "./engines/structure";
import { createId } from "./ids";
import type {
  AnalysisCheckpoint,
  AudioChunk,
  FrameCapture,
  ProjectKind,
  ReconstructionMode,
  VideoAnalysis,
  VideoMeta,
} from "./types";

export type AnalysisRunInput = {
  meta: VideoMeta;
  objectUrl: string;
  file: File | null;
  kind: ProjectKind;
  mode: ReconstructionMode;
  notes: string;
  resume?: boolean;
  checkpoint?: AnalysisCheckpoint | null;
  onProgress: (progress: AnalysisProgress) => void;
  onFrames: (frames: FrameCapture[]) => void;
  createDraft: (input: {
    kind: ProjectKind;
    mode: ReconstructionMode;
    video: VideoMeta;
    frames: FrameCapture[];
    thumbnailDataUrl?: string;
    userNotes: string;
  }) => Promise<{ id: string }>;
  currentProjectId?: string | null;
};

export type AnalysisRunResult =
  | { ok: true; analysis: VideoAnalysis; projectId: string }
  | {
      ok: false;
      error: string;
      checkpoint?: AnalysisCheckpoint;
      incomplete?: boolean;
    };

let activeSession: string | null = null;

function emptyCheckpoint(): AnalysisCheckpoint {
  return {
    version: 1,
    completed: [],
    segments: [],
    analyzedSegmentCount: 0,
    incomplete: false,
  };
}

export async function runFullVideoAnalysis(input: AnalysisRunInput): Promise<AnalysisRunResult> {
  const session = createId("anl");
  activeSession = session;
  const report = (step: number, extra?: Partial<AnalysisProgress>) => {
    if (activeSession !== session) return;
    input.onProgress(progressAt(step, extra));
  };

  try {
    report(1);
    console.info("[VIDEO VALIDATION] Starting", { session });
    console.info("[VIDEO VALIDATION] Source exists:", Boolean(input.objectUrl && input.meta));
    console.info("[VIDEO VALIDATION] Source type:", input.meta.source);
    if (!input.objectUrl || !input.meta) {
      console.error("[VIDEO VALIDATION ERROR]", {
        exactSubStep: "source",
        error: "missing source",
        session,
      });
      return {
        ok: false,
        error: "Aucune vidéo sélectionnée. Veuillez importer une vidéo avant de lancer l'analyse.",
      };
    }
    if (!Number.isFinite(input.meta.durationSeconds) || input.meta.durationSeconds <= 0) {
      console.error("[VIDEO VALIDATION ERROR]", {
        exactSubStep: "metadata",
        error: "invalid duration",
        session,
      });
      return { ok: false, error: "La durée de la vidéo n'a pas pu être lue. Réimportez le fichier." };
    }

    console.info("[VIDEO VALIDATION] File accessible:", Boolean(input.file || input.objectUrl));
    console.info("[VIDEO VALIDATION] Metadata loading");
    let extracted: FrameCapture[] = [];
    try {
      const video = await loadVideoElement(input.objectUrl);
      console.info("[VIDEO VALIDATION] Metadata loaded");
      console.info("[VIDEO VALIDATION] Duration:", input.meta.durationSeconds);
      extracted = await extractFrames(video, () => undefined);
      video.removeAttribute("src");
      video.load();
    } catch (err) {
      console.error("[VIDEO VALIDATION ERROR]", {
        exactSubStep: "load",
        error: err instanceof Error ? err.message : String(err),
        session,
        sourceType: input.meta.source,
        fileExists: Boolean(input.file),
      });
      return {
        ok: false,
        error:
          err instanceof Error
            ? err.message
            : "Impossible de lire cette vidéo. Vérifiez le fichier et réessayez.",
      };
    }

    input.onFrames(extracted);
    logKreia("analyze:frames", { count: extracted.length, session });
    if (!extracted.length) {
      console.error("[VIDEO VALIDATION ERROR]", {
        exactSubStep: "frames",
        error: "no frames",
        session,
      });
      return { ok: false, error: "Pas assez d'images exploitables dans cette vidéo." };
    }
    console.info("[VIDEO VALIDATION] Validation complete");
    console.info("[PIPELINE] Moving to step 2");

    report(2);
    const checkpoint: AnalysisCheckpoint =
      input.resume && input.checkpoint
        ? { ...emptyCheckpoint(), ...input.checkpoint, incomplete: false }
        : emptyCheckpoint();
    if (!checkpoint.segments?.length) {
      const structure = fallbackStructure(
        input.meta.durationSeconds,
        extracted.map((f) => f.t),
      );
      checkpoint.segments = structure.segments;
      logKreia("analyze:structure", {
        session,
        status: structure.structureStatus,
        segments: structure.segments.length,
      });
    }
    console.info("[PIPELINE] Moving to step 3");
    report(3);

    const planned = capturePlan(input.meta.durationSeconds);
    const analysisFrames = await toAnalysisFrames(extracted, {
      maxFrames: Math.min(4, planned.analysis),
    });
    let audioChunks: AudioChunk[] = [];
    if (input.file && !(input.resume && checkpoint.transcript)) {
      try {
        audioChunks = await extractAudioChunks(input.file, input.meta.durationSeconds);
      } catch (err) {
        logKreiaError("analyze:audio", err);
        audioChunks = [];
      }
    }

    let projectId = input.currentProjectId ?? "";
    if (!input.resume || !projectId) {
      const project = await input.createDraft({
        kind: input.kind,
        mode: input.mode,
        video: input.meta,
        frames: extracted,
        thumbnailDataUrl: extracted[0]?.dataUrl,
        userNotes: input.notes,
      });
      projectId = project.id;
    }

    const send = (frames: FrameCapture[], chunks: AudioChunk[]) => {
      const fitted = fitAnalyzePayload({ frames, audioWavBase64: null });
      return runKreiaJob<{ ok: true; analysis: VideoAnalysis }>(
        "analyze",
        {
          frames: fitted.frames,
          audioChunks: chunks,
          durationSeconds: input.meta.durationSeconds,
          width: input.meta.width,
          height: input.meta.height,
          kind: input.kind,
          userNotes: input.notes,
          checkpoint,
        },
        (p) => {
          if (activeSession !== session) return;
          if (p.step < 3) return;
          input.onProgress(p);
        },
      );
    };

    let result;
    try {
      result = await send(analysisFrames, audioChunks);
    } catch (err) {
      if (!isPostTransportError(err)) throw err;
      logKreiaError("analyze:retry-compact-post", err);
      const compact = await toAnalysisFrames(extracted, {
        maxFrames: 2,
        maxWidth: 256,
        quality: 0.24,
        maxChars: 14_000,
      });
      result = await send(compact, audioChunks.slice(0, 1));
    }

    if (activeSession !== session) {
      return { ok: false, error: "L'analyse a été remplacée par une nouvelle session." };
    }
    if (!result.ok) {
      return {
        ok: false,
        error: failMessage(
          result,
          result.incomplete
            ? "Analyse incomplète."
            : "L'analyse n'a pas pu être terminée. La réponse reçue est invalide. Veuillez réessayer.",
        ),
        checkpoint: result.checkpoint,
        incomplete: result.incomplete,
      };
    }
    if (!result.analysis) {
      return {
        ok: false,
        error: "L'analyse n'a pas pu être terminée. La réponse reçue est invalide. Veuillez réessayer.",
      };
    }
    return { ok: true, analysis: result.analysis, projectId };
  } catch (err) {
    logKreiaError("analyze:orchestrator", err);
    return {
      ok: false,
      error: err instanceof Error && err.message.trim()
        ? err.message
        : "L'analyse a échoué. Aucun contenu n'a été inventé.",
    };
  } finally {
    if (activeSession === session) activeSession = null;
  }
}
