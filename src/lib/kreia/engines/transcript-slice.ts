import type { CharacterSheet, DialogueLine } from "../types.ts";
import {
  autoAssignSpeakers,
  explodeMixedDialogue,
  lineFromUtterance,
  parseDialogueLine,
  utterancesFromTranscript,
} from "./dialogues.ts";

const CLOCK = /(?:\[)?(\d{1,2}):(\d{2})(?::(\d{2}))?(?:\])?/;
const SECONDS = /(?:\[)?(\d+(?:\.\d+)?)s(?:\])?/i;

export function parseLineTime(text: string): number | null {
  const clock = text.match(CLOCK);
  if (clock) {
    const h = clock[3] != null ? Number(clock[1]) : 0;
    const m = clock[3] != null ? Number(clock[2]) : Number(clock[1]);
    const s = clock[3] != null ? Number(clock[3]) : Number(clock[2]);
    return h * 3600 + m * 60 + s;
  }
  const sec = text.match(SECONDS);
  if (sec) return Number(sec[1]);
  return null;
}

export function sliceTranscriptForWindow(
  transcript: string | null | undefined,
  start: number,
  end: number,
  duration: number,
): string {
  const raw = (transcript ?? "").trim();
  if (!raw) return "";
  const blocks = raw.split(/\n+/).map((line) => line.trim()).filter(Boolean);
  const timed = blocks.map((line) => ({ line, t: parseLineTime(line) }));
  if (timed.some((item) => item.t != null)) {
    return timed
      .filter((item) => item.t == null || (item.t >= start && item.t < end) || (item.t === end && end === duration))
      .map((item) => item.line.replace(CLOCK, "").replace(SECONDS, "").trim())
      .filter(Boolean)
      .join("\n");
  }
  const parts = raw.split(/\n+/).map((s) => s.trim()).filter(Boolean);
  const units = parts.length >= 2 ? parts : utterancesFromTranscript(raw);
  if (!units.length) return "";
  const total = duration > 0 ? duration : Math.max(end, 1);
  return units
    .filter((_, i) => {
      const t = ((i + 0.5) / units.length) * total;
      return t >= start && t < end + 0.001;
    })
    .join("\n");
}

export function linesFromSegmentPayload(
  rec: Record<string, unknown>,
  args: {
    sceneNumber: number;
    start: number;
    end: number;
    characters: CharacterSheet[];
    transcriptSlice: string;
  },
): DialogueLine[] {
  const jsonList = Array.isArray(rec.dialogues) ? rec.dialogues : [];
  const fromJson = jsonList.flatMap((raw, i) => {
        try {
          const line = parseDialogueLine(raw, i);
          return [
            {
              ...line,
              sceneNumber: args.sceneNumber,
              startTime:
                line.startTime ??
                args.start + (i * (args.end - args.start)) / Math.max(1, jsonList.length),
            },
          ];
        } catch {
          return [];
        }
      });
  const blob =
    typeof rec.dialogue === "string" && rec.dialogue.trim()
      ? rec.dialogue
      : args.transcriptSlice;
  const fromText =
    fromJson.length > 0
      ? []
      : explodeMixedDialogue(blob).flatMap((part, i) => {
          const text = part.speaker ? `${part.speaker} : ${part.text}` : part.text;
          if (!text.trim()) return [];
          const line = lineFromUtterance(text, i, args.sceneNumber, args.characters);
          return [
            {
              ...line,
              startTime: args.start + ((i + 0.5) * (args.end - args.start)) / Math.max(1, explodeMixedDialogue(blob).length),
            },
          ];
        });
  const merged = fromJson.length ? fromJson : fromText;
  const stamped = merged.map((line, i) => ({
    ...line,
    id: `S${String(args.sceneNumber).padStart(2, "0")}-D${String(i + 1).padStart(2, "0")}`,
    sceneNumber: args.sceneNumber,
    order: i + 1,
    startTime:
      typeof line.startTime === "number"
        ? Math.min(args.end, Math.max(args.start, line.startTime))
        : args.start,
  }));
  return autoAssignSpeakers(stamped, args.characters);
}
