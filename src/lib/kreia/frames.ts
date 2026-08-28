import type { FrameCapture, VideoMeta } from "./types";

export const MAX_VIDEO_BYTES = 140 * 1024 * 1024;
export const MAX_FRAMES = 12;
const MAX_WIDTH = 640;
const JPEG_QUALITY = 0.52;

export const ANALYSIS_MAX_FRAMES = 4;
export const ANALYSIS_MAX_WIDTH = 384;
export const ANALYSIS_JPEG_QUALITY = 0.32;
export const ANALYSIS_FRAME_CHAR_BUDGET = 22_000;

export function capturePlan(duration: number): { display: number; analysis: number } {
  if (duration <= 8) return { display: 6, analysis: 6 };
  if (duration <= 16) return { display: 10, analysis: 10 };
  return { display: 12, analysis: 12 };
}

function wait(el: HTMLVideoElement, event: string, timeoutMs = 12000) {
  return new Promise<void>((resolve, reject) => {
    const t = window.setTimeout(() => {
      cleanup();
      reject(new Error("Lecture vidéo trop longue à démarrer."));
    }, timeoutMs);
    const onOk = () => {
      cleanup();
      resolve();
    };
    const onErr = () => {
      cleanup();
      reject(new Error("Fichier vidéo incompatible ou corrompu."));
    };
    const cleanup = () => {
      window.clearTimeout(t);
      el.removeEventListener(event, onOk);
      el.removeEventListener("error", onErr);
    };
    el.addEventListener(event, onOk, { once: true });
    el.addEventListener("error", onErr, { once: true });
  });
}

export async function loadVideoElement(
  src: string,
): Promise<HTMLVideoElement> {
  const video = document.createElement("video");
  video.muted = true;
  video.playsInline = true;
  video.preload = "auto";
  video.crossOrigin = "anonymous";
  video.src = src;
  video.load();
  await wait(video, "loadedmetadata");
  if (!Number.isFinite(video.duration) || video.duration < 0.4) {
    throw new Error("Cette vidéo est trop courte pour être analysée.");
  }
  try {
    await video.play();
    video.pause();
  } catch {
    /* autoplay may fail — seeking still works after metadata */
  }
  return video;
}

function frameTimes(duration: number): number[] {
  const { display } = capturePlan(duration);
  const count = Math.max(4, display);
  const start = 0.12;
  const end = Math.max(start + 0.3, duration - 0.18);
  const raw: number[] = [];
  for (let i = 0; i < count; i += 1) {
    raw.push(start + ((end - start) * i) / Math.max(1, count - 1));
  }
  return uniqueTimes(raw, duration, count);
}

function uniqueTimes(values: number[], duration: number, cap: number): number[] {
  const all = values
    .map((t) => Math.min(duration - 0.05, Math.max(0.05, t)))
    .sort((a, b) => a - b);
  const unique: number[] = [];
  const minGap = duration <= 12 ? 0.35 : 0.22;
  for (const t of all) {
    if (!unique.some((u) => Math.abs(u - t) < minGap)) unique.push(t);
  }
  return unique.slice(0, cap);
}

async function seek(video: HTMLVideoElement, t: number) {
  if (Math.abs(video.currentTime - t) < 0.04) return;
  await new Promise<void>((resolve, reject) => {
    const timer = window.setTimeout(() => {
      video.removeEventListener("seeked", onSeeked);
      reject(new Error("Impossible d'extraire les images de cette vidéo."));
    }, 8000);
    const onSeeked = () => {
      window.clearTimeout(timer);
      video.removeEventListener("seeked", onSeeked);
      resolve();
    };
    video.addEventListener("seeked", onSeeked);
    video.currentTime = t;
  });
}

function capture(video: HTMLVideoElement): string {
  const w = video.videoWidth || 640;
  const h = video.videoHeight || 360;
  const scale = Math.min(1, MAX_WIDTH / w);
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(2, Math.round(w * scale));
  canvas.height = Math.max(2, Math.round(h * scale));
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Capture d'image impossible sur cet appareil.");
  ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
  return canvas.toDataURL("image/jpeg", JPEG_QUALITY);
}

export async function extractFrames(
  video: HTMLVideoElement,
  onProgress?: (done: number, total: number) => void,
): Promise<FrameCapture[]> {
  const times = frameTimes(video.duration);
  const frames: FrameCapture[] = [];
  for (let i = 0; i < times.length; i += 1) {
    await seek(video, times[i]!);
    await new Promise((r) => requestAnimationFrame(() => r(null)));
    frames.push({ t: times[i]!, dataUrl: capture(video) });
    onProgress?.(i + 1, times.length);
  }
  return frames;
}

export function pickFrameIndices(length: number, count: number): number[] {
  if (length <= 0) return [];
  if (count <= 1) return [0];
  if (length <= count) return Array.from({ length }, (_, i) => i);
  const set = new Set<number>();
  set.add(0);
  set.add(length - 1);
  for (let i = 1; i < count - 1; i += 1) {
    set.add(Math.round((i * (length - 1)) / (count - 1)));
  }
  return [...set].sort((a, b) => a - b).slice(0, count);
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("Image illisible."));
    img.src = src;
  });
}

export async function recodeDataUrl(
  dataUrl: string,
  opts: { maxWidth: number; quality: number },
): Promise<string> {
  if (!dataUrl.startsWith("data:image/")) return dataUrl;
  const img = await loadImage(dataUrl);
  const scale = Math.min(1, opts.maxWidth / Math.max(1, img.width));
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(2, Math.round(img.width * scale));
  canvas.height = Math.max(2, Math.round(img.height * scale));
  const ctx = canvas.getContext("2d");
  if (!ctx) return dataUrl;
  ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
  return canvas.toDataURL("image/jpeg", opts.quality);
}

export async function toAnalysisFrames(
  frames: FrameCapture[],
  opts?: {
    maxFrames?: number;
    maxWidth?: number;
    quality?: number;
    maxChars?: number;
  },
): Promise<FrameCapture[]> {
  const duration = frames.length ? frames[frames.length - 1]!.t : 0;
  const planned = capturePlan(duration).analysis;
  const maxFrames = opts?.maxFrames ?? Math.max(ANALYSIS_MAX_FRAMES, planned);
  const maxWidth = opts?.maxWidth ?? ANALYSIS_MAX_WIDTH;
  const quality = opts?.quality ?? ANALYSIS_JPEG_QUALITY;
  const maxChars = opts?.maxChars ?? ANALYSIS_FRAME_CHAR_BUDGET;
  const indices = pickFrameIndices(frames.length, maxFrames);
  const out: FrameCapture[] = [];
  for (const i of indices) {
    const f = frames[i]!;
    try {
      let dataUrl = await recodeDataUrl(f.dataUrl, { maxWidth, quality });
      if (dataUrl.length > maxChars) {
        dataUrl = await recodeDataUrl(f.dataUrl, {
          maxWidth: Math.min(maxWidth, 320),
          quality: Math.min(quality, 0.26),
        });
      }
      if (dataUrl.length > maxChars) {
        dataUrl = await recodeDataUrl(f.dataUrl, { maxWidth: 256, quality: 0.22 });
      }
      out.push({ t: f.t, dataUrl });
    } catch {
      out.push(f);
    }
  }
  return out;
}

export function videoMetaFromElement(
  video: HTMLVideoElement,
  fileName: string,
  source: VideoMeta["source"],
  sourceUrl?: string,
): VideoMeta {
  return {
    durationSeconds: video.duration,
    width: video.videoWidth,
    height: video.videoHeight,
    fileName,
    source,
    sourceUrl,
  };
}

export function formatDuration(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds < 0) return "—";
  const s = Math.round(seconds);
  const m = Math.floor(s / 60);
  const r = s % 60;
  return m > 0 ? `${m} min ${String(r).padStart(2, "0")} s` : `${r} s`;
}

export function formatTimecode(seconds: number): string {
  const s = Math.max(0, seconds);
  const m = Math.floor(s / 60);
  const r = s - m * 60;
  return `${String(m).padStart(2, "0")}:${r.toFixed(1).padStart(4, "0")}`;
}
