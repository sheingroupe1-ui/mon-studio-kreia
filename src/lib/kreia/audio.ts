import type { AudioChunk } from "./types";

const SAMPLE_RATE = 16000;
export const AUDIO_CHUNK_SECONDS = 5;
export const AUDIO_MAX_CHUNKS = 12;

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

export async function extractAudioChunks(
  file: File,
  durationSeconds: number,
): Promise<AudioChunk[]> {
  const ctx = new AudioContext();
  try {
    const data = await file.arrayBuffer();
    const decoded = await ctx.decodeAudioData(data.slice(0));
    if (decoded.duration < 0.4) return [];
    const total = Math.min(
      decoded.duration,
      Number.isFinite(durationSeconds) ? durationSeconds : decoded.duration,
    );
    const chunkLen = AUDIO_CHUNK_SECONDS;
    const count = Math.min(AUDIO_MAX_CHUNKS, Math.max(1, Math.ceil(total / chunkLen)));
    const chunks: AudioChunk[] = [];
    for (let i = 0; i < count; i += 1) {
      const start = i * chunkLen;
      if (start >= total - 0.2) break;
      const end = Math.min(total, start + chunkLen);
      const mono = mixMonoRange(decoded, start, end);
      if (rms(mono) < 0.004) continue;
      const resampled = resample(mono, decoded.sampleRate, SAMPLE_RATE);
      const wav = writeWav(resampled, SAMPLE_RATE);
      chunks.push({ t: start, wavBase64: bytesToBase64(wav) });
    }
    return chunks;
  } catch {
    return [];
  } finally {
    await ctx.close().catch(() => undefined);
  }
}

export async function extractAudioWavBase64(file: File): Promise<string | null> {
  const chunks = await extractAudioChunks(file, AUDIO_CHUNK_SECONDS);
  return chunks[0]?.wavBase64 ?? null;
}
