export const MODEL = "grok-4.5";
export const FETCH_TIMEOUT_MS = 90_000;
export const VISION_TIMEOUT_MS = 100_000;

export const INVALID_AI_MESSAGE =
  "L'analyse n'a pas pu être terminée. La réponse reçue est invalide. Veuillez réessayer.";
export const NETWORK_MESSAGE = "L'analyse n'a pas pu aboutir. Réessayez.";

export type ChatContent =
  | { type: "text"; text: string }
  | { type: "image_url"; image_url: { url: string; detail?: "low" | "high" } };

export type ChatMessage = {
  role: "system" | "user" | "assistant";
  content: string | ChatContent[];
};

export type OkErr<T> =
  | ({ ok: true } & T)
  | ({
      ok: false;
      error: string;
      message?: string;
      code?: string;
      contentType?: string;
      checkpoint?: unknown;
      incomplete?: boolean;
    });

export function apiKey(): string | null {
  return process.env.XAI_API_KEY ?? null;
}

export function fail(error: string): { ok: false; error: string } {
  return { ok: false, error };
}

async function timedFetch(url: string, init: RequestInit, timeoutMs: number): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const parent = init.signal;
    if (parent) {
      if (parent.aborted) controller.abort();
      else parent.addEventListener("abort", () => controller.abort(), { once: true });
    }
    const res = await fetch(url, { ...init, signal: controller.signal });
    if (!res) throw new Error("Aucune réponse reçue du serveur.");
    return res;
  } finally {
    clearTimeout(timer);
  }
}

export async function chat(args: {
  messages: ChatMessage[];
  maxTokens: number;
  timeoutMs?: number;
  jsonMode?: boolean;
}): Promise<{ ok: true; text: string } | { ok: false; error: string }> {
  const key = apiKey();
  if (!key) {
    return fail("Les fonctions d'analyse IA ne sont pas disponibles dans cet environnement.");
  }

  const jsonMode = args.jsonMode !== false;
  const timeoutMs = args.timeoutMs ?? FETCH_TIMEOUT_MS;
  const hasImages = args.messages.some(
    (m) => Array.isArray(m.content) && m.content.some((p) => p.type === "image_url"),
  );

  const attempt = async (useJsonMode: boolean) => {
    const body: Record<string, unknown> = {
      model: MODEL,
      messages: args.messages,
      temperature: 0.35,
      max_tokens: args.maxTokens,
    };
    if (useJsonMode) body.response_format = { type: "json_object" };

    const res = await timedFetch(
      "https://api.x.ai/v1/chat/completions",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${key}`,
        },
        body: JSON.stringify(body),
      },
      hasImages ? Math.max(timeoutMs, VISION_TIMEOUT_MS) : timeoutMs,
    );
    return res;
  };

  let res: Response | undefined;
  try {
    res = await attempt(jsonMode);
  } catch (err) {
    const aborted = err instanceof Error && err.name === "AbortError";
    console.error("[kreia:chat] fetch failed", err);
    return fail(
      aborted
        ? `Timeout IA après ${hasImages ? Math.max(timeoutMs, VISION_TIMEOUT_MS) : timeoutMs} ms (vision=${hasImages}).`
        : `Réseau IA: ${err instanceof Error ? err.message : NETWORK_MESSAGE}`,
    );
  }

  if (!res) {
    console.error("[kreia:chat] empty fetch response");
    return fail(NETWORK_MESSAGE);
  }

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    console.error("[kreia:chat] http", res.status, body.slice(0, 400));
    const lower = body.toLowerCase();
    if (jsonMode && (res.status === 400 || lower.includes("response_format"))) {
      try {
        res = await attempt(false);
      } catch (err) {
        console.error("[kreia:chat] retry without json_object failed", err);
        return fail(`Erreur du modèle (${res.status}). ${body.slice(0, 180)}`);
      }
    }
    if (!res || !res.ok) {
      const status = res?.status ?? 0;
      return fail(`Erreur du modèle (${status}). ${body.slice(0, 180)}`);
    }
  }

  let json: unknown;
  try {
    json = await res.json();
  } catch (err) {
    console.error("[kreia:chat] invalid json", err);
    return fail(INVALID_AI_MESSAGE);
  }

  const text = contentFromCompletion(json);
  if (!text.trim()) {
    const keys =
      json && typeof json === "object" ? Object.keys(json as object).join(",") : typeof json;
    console.error("[kreia:chat] empty model content", { keys, preview: JSON.stringify(json).slice(0, 280) });
    return fail(INVALID_AI_MESSAGE);
  }
  return { ok: true, text };
}

function contentFromCompletion(json: unknown): string {
  if (!json) return "";
  if (typeof json === "string") return json;
  if (typeof json !== "object") return "";
  const rec = json as Record<string, unknown>;
  const fromMessage = (msg: unknown): string => {
    if (!msg) return "";
    if (typeof msg === "string") return msg;
    if (typeof msg !== "object") return "";
    const m = msg as Record<string, unknown>;
    if (typeof m.content === "string") return m.content;
    if (Array.isArray(m.content)) {
      return m.content
        .map((part) => {
          if (typeof part === "string") return part;
          if (part && typeof part === "object" && "text" in part) {
            return String((part as { text?: unknown }).text ?? "");
          }
          return "";
        })
        .join("");
    }
    if (typeof m.text === "string") return m.text;
    return "";
  };
  const choices = Array.isArray(rec.choices) ? rec.choices : [];
  for (const choice of choices) {
    if (!choice || typeof choice !== "object") continue;
    const c = choice as Record<string, unknown>;
    const text = fromMessage(c.message) || fromMessage(c.delta) || (typeof c.text === "string" ? c.text : "");
    if (text.trim()) return text;
  }
  if (typeof rec.output === "string") return rec.output;
  if (typeof rec.content === "string") return rec.content;
  if (typeof rec.text === "string") return rec.text;
  return fromMessage(rec.message);
}

export type SttWord = { text?: string; start?: number; speaker?: string | number };

export async function transcribeWav(
  audioWavBase64: string,
): Promise<{ text: string | null; note: string; ok: boolean; error?: string; words?: SttWord[] }> {
  const key = apiKey();
  if (!key) return { text: null, note: "Transcription indisponible.", ok: false, error: "no-api-key" };

  const bytes = Buffer.from(audioWavBase64, "base64");
  if (bytes.length < 2048) {
    return { text: null, note: "Piste audio trop courte pour être transcrite.", ok: false, error: "audio-too-short" };
  }

  const form = new FormData();
  form.append("model", "grok-stt");
  form.append("diarize", "true");
  form.append("file", new Blob([new Uint8Array(bytes)], { type: "audio/wav" }), "clip.wav");

  try {
    const res = await timedFetch(
      "https://api.x.ai/v1/stt",
      { method: "POST", headers: { Authorization: `Bearer ${key}` }, body: form },
      60_000,
    );
    if (!res.ok) {
      const detail = (await res.text().catch(() => "")).slice(0, 220);
      const error = `stt ${res.status}${detail ? `: ${detail}` : ""}`;
      console.info("[STT] failed", error);
      return {
        text: null,
        note: "La piste audio n'a pas pu être transcrite. L'analyse se base sur les images.",
        ok: false,
        error,
      };
    }
    const json = (await res.json()) as {
      text?: string;
      transcript?: string;
      words?: SttWord[];
    };
    const words = Array.isArray(json.words) ? json.words : [];
    const fromWords = formatSttWords(words);
    const text = (fromWords || json.text || json.transcript || "").trim();
    if (text) return { text, note: "Transcription obtenue.", ok: true, words };
    return {
      text: null,
      note: "La piste audio n'a pas pu être transcrite. L'analyse se base sur les images.",
      ok: false,
      error: "empty-transcript",
      words,
    };
  } catch (err) {
    const error = err instanceof Error ? err.message : String(err);
    console.info("[STT] error", error);
    return {
      text: null,
      note: "La piste audio n'a pas pu être transcrite. L'analyse se base sur les images.",
      ok: false,
      error,
    };
  }
}

export function formatSttWords(words?: SttWord[]): string {
  if (!Array.isArray(words) || !words.length) return "";
  const lines: string[] = [];
  let current: { t: number; speaker: string; texts: string[] } | null = null;
  const flush = () => {
    if (!current?.texts.length) return;
    const who = current.speaker ? `${current.speaker} : ` : "";
    lines.push(`[${current.t.toFixed(1)}s] ${who}${current.texts.join(" ")}`.trim());
  };
  for (const word of words) {
    const spoken = String(word.text ?? "").trim();
    if (!spoken) continue;
    const speaker = word.speaker == null || word.speaker === "" ? "" : String(word.speaker);
    const startTime: number = typeof word.start === "number" ? word.start : current ? current.t : 0;
    if (!current || speaker !== current.speaker) {
      flush();
      current = { t: startTime, speaker, texts: [spoken] };
    } else {
      current.texts.push(spoken);
    }
  }
  flush();
  return lines.join("\n");
}

export function keepWordsInOwnWindow(
  words: SttWord[] | undefined,
  chunk: { t: number; ownStart?: number; ownEnd?: number },
  chunkSeconds = 5,
): SttWord[] {
  const ownStart = chunk.ownStart ?? chunk.t;
  const ownEnd = chunk.ownEnd ?? chunk.t + chunkSeconds;
  return (words ?? [])
    .map((word) => {
      const relative = typeof word.start === "number" ? word.start : 0;
      return { ...word, start: chunk.t + relative };
    })
    .filter((word) => {
      const abs = word.start ?? chunk.t;
      return abs >= ownStart - 0.05 && abs < ownEnd + 0.05;
    });
}

export async function timedFetchPublic(
  url: string,
  init: RequestInit,
  timeoutMs: number,
): Promise<Response> {
  return timedFetch(url, init, timeoutMs);
}
