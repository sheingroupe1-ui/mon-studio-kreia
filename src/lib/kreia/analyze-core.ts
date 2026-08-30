import { buildAnalysisSystemPrompt } from "./engines/analysis-prompt";
import { collapseAnalysisScenes, collapseProductionScenes } from "./engines/duration";
import {
  applyLinesToScenes,
  applyNameSubstitutionsToBible,
  enforceProductionDialogues,
  fitDialoguesToScenes,
  lockCharactersSourceNames,
} from "./engines/dialogues";
import { enforceProductionIdentity } from "./engines/identity";
import {
  buildGenerationSystemPrompt,
  buildGenerationUserPrompt,
  buildReviseAnalysisPrompt,
  buildReviseProductionPrompt,
} from "./engines/reconstruction-prompt";
import {
  apiKey,
  fail,
  chat,
  INVALID_AI_MESSAGE,
  NETWORK_MESSAGE,
  timedFetchPublic,
  type OkErr,
} from "./llm";
import { extractJson, parseAnalysis, parseProduction } from "./parse";
import { withFormattedPrompts } from "./engines/prompt-dossier";
import { runAnalysisPipeline } from "./pipeline";
import type { AnalysisProgress } from "./analysis-stages";
import type {
  AnalyzeInput,
  GenerateInput,
  ReviseAnalysisInput,
  ReviseProductionInput,
  VideoAnalysis,
} from "./types";

export { apiKey, fail, NETWORK_MESSAGE, INVALID_AI_MESSAGE, type OkErr };
export const IMPORT_VIDEO_MESSAGE =
  "Cette vidéo ne peut pas être récupérée directement depuis ce lien. Veuillez importer la vidéo.";

const GENERATE_MAX_TOKENS = 4500;
const REVISE_MAX_TOKENS = 3500;

function isTikTokHost(host: string): boolean {
  return (
    host === "tiktok.com" ||
    host.endsWith(".tiktok.com") ||
    host === "vm.tiktok.com" ||
    host === "vt.tiktok.com"
  );
}

async function probeRemoteVideo(url: string): Promise<{
  ok: boolean;
  contentType?: string;
  code?: string;
  message: string;
}> {
  const headers = { "User-Agent": "KREIA-Studio/1.0" };
  let res: Response | undefined;
  try {
    res = await timedFetchPublic(url, { method: "HEAD", redirect: "follow", headers }, 8000);
  } catch (err) {
    console.warn("[kreia:probe] HEAD failed, trying GET", err);
  }

  if (!res || !res.ok || !(res.headers.get("content-type") ?? "").length) {
    try {
      res = await timedFetchPublic(
        url,
        {
          method: "GET",
          redirect: "follow",
          headers: { ...headers, Range: "bytes=0-1" },
        },
        8000,
      );
    } catch (err) {
      console.error("[kreia:probe] GET failed", err);
      return { ok: false, code: "unreachable", message: IMPORT_VIDEO_MESSAGE };
    }
  }

  if (!res) {
    console.error("[kreia:probe] empty fetch response");
    return { ok: false, code: "unreachable", message: IMPORT_VIDEO_MESSAGE };
  }

  const type = res.headers.get("content-type") ?? "";
  if (!res.ok) {
    return {
      ok: false,
      code: "unreachable",
      message:
        "Cette ressource n'est pas accessible. Importez le fichier vidéo depuis votre appareil.",
    };
  }
  if (!type.includes("video") && !type.includes("mp4") && !type.includes("webm")) {
    return {
      ok: false,
      code: "not-video",
      message:
        "Cette URL ne pointe pas vers un fichier vidéo accessible. Veuillez importer la vidéo.",
    };
  }
  return {
    ok: true,
    contentType: type,
    message: "Fichier vidéo détecté. Tentative de lecture dans le navigateur.",
  };
}

export async function probeVideoUrlCore(url: string): Promise<
  OkErr<{ contentType?: string; code?: string; message: string }>
> {
  const raw = (url ?? "").trim();
  let parsed: URL;
  try {
    parsed = new URL(raw);
  } catch {
    return {
      ok: false,
      error: "Ce lien n'est pas une URL valide.",
      message: "Ce lien n'est pas une URL valide.",
      code: "invalid",
    };
  }

  if (!/^https?:$/.test(parsed.protocol)) {
    return {
      ok: false,
      error: "Seuls les liens http(s) sont acceptés.",
      message: "Seuls les liens http(s) sont acceptés.",
      code: "invalid",
    };
  }

  const host = parsed.hostname.replace(/^www\./, "");
  if (isTikTokHost(host)) {
    console.info("[kreia:probe] tiktok blocked", host);
    return {
      ok: false,
      error: IMPORT_VIDEO_MESSAGE,
      message: IMPORT_VIDEO_MESSAGE,
      code: "tiktok",
    };
  }

  const probed = await probeRemoteVideo(parsed.toString());
  if (!probed.ok) {
    return {
      ok: false,
      error: probed.message,
      message: probed.message,
      code: probed.code,
    };
  }
  return {
    ok: true,
    contentType: probed.contentType,
    message: probed.message,
  };
}

export async function runAnalyze(
  data: AnalyzeInput,
  onProgress?: (progress: AnalysisProgress) => void,
) {
  return runAnalysisPipeline(data, onProgress);
}

export async function runReviseAnalysis(
  data: ReviseAnalysisInput,
): Promise<OkErr<{ analysis: VideoAnalysis }>> {
  const result = await chat({
    messages: [
      { role: "system", content: buildAnalysisSystemPrompt(data.kind) },
      {
        role: "user",
        content: buildReviseAnalysisPrompt(data.analysis, data.instruction),
      },
    ],
    maxTokens: REVISE_MAX_TOKENS,
  });
  if (!result || !result.ok) return fail(result?.error || NETWORK_MESSAGE);
  try {
    const analysis = parseAnalysis(extractJson(result.text));
    analysis.characters = lockCharactersSourceNames(
      analysis.characters.map((c) => {
        const prev = data.analysis.characters.find((p) => p.id === c.id);
        return { ...c, sourceName: prev?.sourceName || c.sourceName || c.name };
      }),
    );
    analysis.dialogues = applyNameSubstitutionsToBible(
      analysis.dialogues?.lines?.length ? analysis.dialogues : data.analysis.dialogues,
      analysis.characters,
    );
    if (Number.isFinite(data.durationSeconds) && data.durationSeconds > 0) {
      const before = analysis.scenes.length;
      analysis.scenes = collapseAnalysisScenes(analysis.scenes, data.durationSeconds);
      analysis.sceneCountEstimate = analysis.scenes.length;
      const fitted = fitDialoguesToScenes(analysis, before);
      analysis.dialogues = fitted.dialogues;
      analysis.scenes = fitted.scenes;
    } else {
      analysis.scenes = applyLinesToScenes(analysis.scenes, analysis.dialogues.lines);
    }
    return { ok: true, analysis };
  } catch {
    return fail("La correction n'a pas pu être appliquée de façon fiable.");
  }
}

export async function runGenerate(
  data: GenerateInput,
): Promise<OkErr<{ production: ReturnType<typeof parseProduction> }>> {
  const result = await chat({
    messages: [
      { role: "system", content: buildGenerationSystemPrompt(data.kind) },
      { role: "user", content: buildGenerationUserPrompt(data) },
    ],
    maxTokens: GENERATE_MAX_TOKENS,
  });
  if (!result || !result.ok) return fail(result?.error || NETWORK_MESSAGE);
  try {
    const production = parseProduction(extractJson(result.text));
    if (!production.visualStyle.lockedPhrase) {
      production.visualStyle.lockedPhrase = data.analysis.visualStyle.lockedStylePhrase;
    }
    production.scenes = collapseProductionScenes(production.scenes, data.durationSeconds);
    const first = production.scenes[0];
    if (first) production.hook.duration = first.duration;
    return {
      ok: true,
      production: withFormattedPrompts(
        enforceProductionIdentity(
          enforceProductionDialogues(production, data.analysis, data.mode, data.kind),
          data.analysis,
        ),
        data.analysis,
      ),
    };
  } catch {
    return fail("Le plan de production n'a pas pu être lu. Réessayez.");
  }
}

export async function runReviseProduction(
  data: ReviseProductionInput,
): Promise<OkErr<{ production: ReturnType<typeof parseProduction> }>> {
  const result = await chat({
    messages: [
      { role: "system", content: buildGenerationSystemPrompt(data.kind) },
      {
        role: "user",
        content: buildReviseProductionPrompt({
          analysis: data.analysis,
          production: data.production,
          instruction: data.instruction,
          focus: data.focus,
        }),
      },
    ],
    maxTokens: REVISE_MAX_TOKENS,
  });
  if (!result || !result.ok) return fail(result?.error || NETWORK_MESSAGE);
  try {
    const production = parseProduction(extractJson(result.text));
    if (Number.isFinite(data.durationSeconds) && data.durationSeconds > 0) {
      production.scenes = collapseProductionScenes(production.scenes, data.durationSeconds);
      const first = production.scenes[0];
      if (first) production.hook.duration = first.duration;
    }
    return {
      ok: true,
      production: withFormattedPrompts(
        enforceProductionIdentity(
          enforceProductionDialogues(production, data.analysis, data.mode, data.kind),
          data.analysis,
        ),
        data.analysis,
      ),
    };
  } catch {
    return fail("La modification n'a pas pu être appliquée de façon fiable.");
  }
}

export type { VideoAnalysis };
