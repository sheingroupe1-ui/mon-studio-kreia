import { createServerFn } from "@tanstack/react-start";
import type {
  AnalyzeInput,
  GenerateInput,
  ReviseAnalysisInput,
  ReviseProductionInput,
} from "./types";

const NETWORK_MESSAGE = "L'analyse n'a pas pu aboutir. Réessayez.";
const INVALID_AI_MESSAGE =
  "L'analyse n'a pas pu être terminée. La réponse reçue est invalide. Veuillez réessayer.";

type OkErr<T> =
  | ({ ok: true } & T)
  | ({ ok: false; error: string } & { message?: string; code?: string; contentType?: string });

async function withOk<T>(label: string, run: () => Promise<OkErr<T>>): Promise<OkErr<T>> {
  try {
    const out = await run();
    if (!out || typeof out !== "object" || typeof out.ok !== "boolean") {
      console.error(`[kreia:${label}] handler returned non-ok shape`, out);
      return { ok: false, error: NETWORK_MESSAGE };
    }
    return out;
  } catch (err) {
    console.error(`[kreia:${label}] uncaught`, err);
    const msg = err instanceof Error ? err.message : "";
    if (/json|parse|illisible/i.test(msg)) return { ok: false, error: INVALID_AI_MESSAGE };
    if (/abort|timeout|timed out/i.test(msg)) {
      return {
        ok: false,
        error: "L'analyse a dépassé le délai imparti. Réessayez avec une vidéo plus courte.",
      };
    }
    return { ok: false, error: msg.trim() || NETWORK_MESSAGE };
  }
}

export const checkAiAvailable = createServerFn({ method: "GET" }).handler(async () => {
  const { apiKey } = await import("./analyze-core");
  return { available: Boolean(apiKey()) };
});

export const probeVideoUrl = createServerFn({ method: "POST" })
  .validator((input: { url: string }) => input)
  .handler(async ({ data }) => {
    const { probeVideoUrlCore } = await import("./analyze-core");
    return withOk("probe", async () => probeVideoUrlCore(data?.url ?? ""));
  });

export const analyzeVideo = createServerFn({ method: "POST" })
  .validator((input: AnalyzeInput) => input)
  .handler(async ({ data }) => {
    const { runAnalyze } = await import("./analyze-core");
    return withOk("analyze", async () => runAnalyze(data));
  });

export const reviseAnalysis = createServerFn({ method: "POST" })
  .validator((input: ReviseAnalysisInput) => input)
  .handler(async ({ data }) => {
    const { runReviseAnalysis } = await import("./analyze-core");
    return withOk("revise-analysis", async () => runReviseAnalysis(data));
  });

export const generateProduction = createServerFn({ method: "POST" })
  .validator((input: GenerateInput) => input)
  .handler(async ({ data }) => {
    const { runGenerate } = await import("./analyze-core");
    return withOk("generate", async () => runGenerate(data));
  });

export const reviseProduction = createServerFn({ method: "POST" })
  .validator((input: ReviseProductionInput) => input)
  .handler(async ({ data }) => {
    const { runReviseProduction } = await import("./analyze-core");
    return withOk("revise-production", async () => runReviseProduction(data));
  });
