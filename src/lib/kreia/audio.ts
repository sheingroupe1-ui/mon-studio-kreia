import type { AudioChunk } from "./types";

const SAMPLE_RATE = 16000;
export const AUDIO_CHUNK_SECONDS = 5;
export const AUDIO_MAX_CHUNKS = 12;
const OVERLAP_SECONDS = 1;

function writeWav(samples: Float32Array, sampleRate: number): ArrayBuffer {
  const n = samples.length;
  const buffer = new ArrayBuffer(44 + n * 2);
  const view = new DataView(buffer);
  const ascii = (offset: number, text: string) => {
    for (let i = 0; i < text.length; i += 1) view.setUint8(offset + i, text.charCodeAt(i));
  };
  ascii(0, "RIFF");
  view.setUint32(4, 36 + n * 2, true);
  ascii(8, "WAVE");
  ascii(12, "fmt ");
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, 1, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * 2, true);
  view.setUint16(32, 2, true);
  view.setUint16(34, 16, true);
  ascii(36, "data");
  view.setUint32(40, n * 2, true);
  let offset = 44;
  for (let i = 0; i < n; i += 1) {
    const s = Math.max(-1, Math.min(1, samples[i] ?? 0));
    view.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7fff, true);
    offset += 2;
  }
  return buffer;
}

function mixMonoRange(audio: AudioBuffer, startSec: number, endSec: number): Float32Array {
  const start = Math.max(0, Math.floor(audio.sampleRate * startSec));
  const end = Math.min(audio.length, Math.floor(audio.sampleRate * endSec));
  const length = Math.max(0, end - start);
  const mono = new Float32Array(length);
  const channels = audio.numberOfChannels;
  for (let c = 0; c < channels; c += 1) {
    const data = audio.getChannelData(c);
    for (let i = 0; i < length; i += 1) {
      mono[i] = (mono[i] ?? 0) + (data[start + i] ?? 0) / channels;
    }
  }
  return mono;
}

function resample(input: Float32Array, fromRate: number, toRate: number): Float32Array {
  if (fromRate === toRate) return input;
  const ratio = fromRate / toRate;
  const outLen = Math.max(1, Math.round(input.length / ratio));
  const out = new Float32Array(outLen);
  for (let i = 0; i < outLen; i += 1) {
    const src = i * ratio;
    const i0 = Math.floor(src);
    const i1 = Math.min(input.length - 1, i0 + 1);
    const t = src - i0;
    out[i] = (input[i0] ?? 0) * (1 - t) + (input[i1] ?? 0) * t;
  }
  return out;
}

function bytesToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  const chunk = 0x8000;
  let binary = "";
  for (let i = 0; i < bytes.length; i += chunk) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunk));
  }
  return btoa(binary);
}

function rms(samples: Float32Array): number {
  if (!samples.length) return 0;
  let sum = 0;
  const step = Math.max(1, Math.floor(samples.length / 4000));
  let n = 0;
  for (let i = 0; i < samples.length; i += step) {
    const v = samples[i] ?? 0;
    sum += v * v;
    n += 1;
  }
  return Math.sqrt(sum / Math.max(1, n));
}

export type AudioExtractResult = {
  chunks: AudioChunk[];
  error?: string;
};

function audioErrorMessage(err: unknown): string {
  if (err instanceof Error) {
    const name = err.name && err.name !== "Error" ? `${err.name}: ` : "";
    return `${name}${err.message}`.slice(0, 220);
  }
  return String(err).slice(0, 220);
}

function concatFloat32(parts: Float32Array[]): Float32Array {
  let n = 0;
  for (const part of parts) n += part.length;
  const out = new Float32Array(n);
  let offset = 0;
  for (const part of parts) {
    out.set(part, offset);
    offset += part.length;
  }
  return out;
}

function encodeWavBase64(samples: Float32Array, fromRate: number): string {
  const at16 = resample(samples, fromRate, SAMPLE_RATE);
  let wav = writeWav(at16, SAMPLE_RATE);
  let encoded = bytesToBase64(wav);
  if (encoded.length > 230_000) {
    const at8 = resample(samples, fromRate, 8_000);
    wav = writeWav(at8, 8_000);
    encoded = bytesToBase64(wav);
  }
  return encoded;
}

function chunksFromSamples(
  samples: Float32Array,
  sampleRate: number,
  durationSeconds: number,
): AudioChunk[] {
  const total = Math.min(
    samples.length / Math.max(1, sampleRate),
    Number.isFinite(durationSeconds) && durationSeconds > 0
      ? durationSeconds
      : samples.length / sampleRate,
  );
  if (total < 0.4) return [];
  const chunkLen = AUDIO_CHUNK_SECONDS;
  const count = Math.min(AUDIO_MAX_CHUNKS, Math.max(1, Math.ceil(total / chunkLen)));
  const chunks: AudioChunk[] = [];
  for (let i = 0; i < count; i += 1) {
    const ownStart = i * chunkLen;
    if (ownStart >= total - 0.2) break;
    const ownEnd = Math.min(total, ownStart + chunkLen);
    const paddedStart = Math.max(0, ownStart - OVERLAP_SECONDS);
    const paddedEnd = Math.min(total, ownEnd + OVERLAP_SECONDS);
    const start = Math.floor(paddedStart * sampleRate);
    const end = Math.min(samples.length, Math.floor(paddedEnd * sampleRate));
    const slice = samples.subarray(start, Math.max(start + 1, end));
    if (!slice.length) continue;
    chunks.push({
      t: paddedStart,
      ownStart,
      ownEnd,
      wavBase64: encodeWavBase64(slice, sampleRate),
    });
  }
  return chunks;
}

async function decodeFileBuffer(file: File): Promise<AudioBuffer> {
  const ctx = new AudioContext();
  try {
    const data = await file.arrayBuffer();
    try {
      return await ctx.decodeAudioData(data.slice(0));
    } catch {
      const asAudio = new File([file], file.name || "clip.mp4", { type: "audio/mp4" });
      const retry = await asAudio.arrayBuffer();
      return await ctx.decodeAudioData(retry.slice(0));
    }
  } finally {
    await ctx.close().catch(() => undefined);
  }
}

async function capturePcmFromVideo(
  src: string,
  durationSeconds: number,
): Promise<{ samples: Float32Array; sampleRate: number } | { error: string }> {
  const video = document.createElement("video");
  video.playsInline = true;
  video.preload = "auto";
  video.crossOrigin = "anonymous";
  video.muted = false;
  video.volume = 1;
  video.src = src;
  try {
    await new Promise<void>((resolve, reject) => {
      const timer = window.setTimeout(() => reject(new Error("video-load-timeout")), 12_000);
      video.onloadedmetadata = () => {
        window.clearTimeout(timer);
        resolve();
      };
      video.onerror = () => {
        window.clearTimeout(timer);
        reject(new Error("video-element-failed"));
      };
    });
    const ctx = new AudioContext({ sampleRate: SAMPLE_RATE });
    await ctx.resume();
    const source = ctx.createMediaElementSource(video);
    const silent = ctx.createGain();
    silent.gain.value = 0;
    const processor = ctx.createScriptProcessor(4096, 1, 1);
    const parts: Float32Array[] = [];
    processor.onaudioprocess = (event) => {
      parts.push(new Float32Array(event.inputBuffer.getChannelData(0)));
    };
    source.connect(processor);
    processor.connect(silent);
    silent.connect(ctx.destination);
    const cap = Math.min(
      AUDIO_MAX_CHUNKS * AUDIO_CHUNK_SECONDS,
      video.duration || durationSeconds,
      durationSeconds || video.duration,
    );
    video.currentTime = 0;
    video.playbackRate = 1;
    await video.play();
    await new Promise<void>((resolve) => {
      const timer = window.setTimeout(resolve, cap * 1000 + 1200);
      const done = () => {
        window.clearTimeout(timer);
        resolve();
      };
      video.onended = done;
      const poll = window.setInterval(() => {
        if (video.currentTime >= cap - 0.05) {
          window.clearInterval(poll);
          done();
        }
      }, 200);
    });
    video.pause();
    processor.disconnect();
    source.disconnect();
    silent.disconnect();
    const sampleRate = ctx.sampleRate;
    await ctx.close().catch(() => undefined);
    const samples = concatFloat32(parts);
    if (rms(samples) <= 0.00005) {
      return { error: `capture-empty (rms=${rms(samples).toFixed(5)} samples=${samples.length})` };
    }
    return { samples, sampleRate };
  } catch (err) {
    return { error: `capture-failed: ${audioErrorMessage(err)}` };
  } finally {
    video.removeAttribute("src");
    video.load();
  }
}

export async function extractAudioChunks(
  file: File | null,
  durationSeconds: number,
  objectUrl?: string,
): Promise<AudioExtractResult> {
  const errors: string[] = [];

  if (file) {
    try {
      const decoded = await decodeFileBuffer(file);
      if (decoded.duration >= 0.4) {
        const mono = mixMonoRange(decoded, 0, decoded.duration);
        const overallRms = rms(mono);
        if (overallRms > 0.0008) {
          const chunks = chunksFromSamples(mono, decoded.sampleRate, durationSeconds || decoded.duration);
          if (chunks.length) return { chunks };
          errors.push(`decode-empty-chunks rms=${overallRms.toFixed(5)}`);
        } else {
          errors.push(`decode-silent rms=${overallRms.toFixed(5)}`);
        }
      } else {
        errors.push(`decode-failed: duration ${decoded.duration.toFixed(2)}s`);
      }
    } catch (err) {
      errors.push(`decode-failed: ${audioErrorMessage(err)}`);
    }
  } else {
    errors.push("no-file");
  }

  if (objectUrl) {
    const captured = await capturePcmFromVideo(objectUrl, durationSeconds);
    if ("samples" in captured) {
      const chunks = chunksFromSamples(captured.samples, captured.sampleRate, durationSeconds);
      if (chunks.length) return { chunks };
      errors.push("capture-no-chunks");
    } else {
      errors.push(captured.error);
    }
  }

  const message = errors.join(" | ") || "no-audio.v16";
  console.error("[AUDIO] extraction failed", message);
  return { chunks: [], error: message };
}

export async function extractAudioWavBase64(file: File): Promise<string | null> {
  const { chunks } = await extractAudioChunks(file, AUDIO_CHUNK_SECONDS);
  return chunks[0]?.wavBase64 ?? null;
}
