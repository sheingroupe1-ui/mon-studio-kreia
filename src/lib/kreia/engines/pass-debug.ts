export type DialoguePassDebug = {
  transcriptOk: boolean;
  transcriptNote?: string;
  transcriptError?: string;
  speakersAttempted: boolean;
  speakersOk: boolean;
  speakersError?: string;
  speakersMatched: string;
  speakerSceneProgress?: string;
  relationshipsAttempted: boolean;
  relationshipsOk: boolean;
  relationshipsError?: string;
  relationshipsFilled?: string;
};

export function emptyDialoguePassDebug(): DialoguePassDebug {
  return {
    transcriptOk: false,
    speakersAttempted: false,
    speakersOk: false,
    speakersMatched: "0/0",
    speakerSceneProgress: "0/0",
    relationshipsAttempted: false,
    relationshipsOk: false,
  };
}

export function formatDialoguePassDebug(debug?: DialoguePassDebug | null): string {
  if (!debug) return "";
  return [
    `transcriptOk=${debug.transcriptOk}`,
    `transcriptNote=${debug.transcriptNote || "none"}`,
    debug.transcriptError ? `transcriptError=${debug.transcriptError}` : "",
    `speakersAttempted=${debug.speakersAttempted}`,
    `speakersOk=${debug.speakersOk}`,
    `speakersError=${debug.speakersError || "none"}`,
    `speakersMatched=${debug.speakersMatched}`,
    `speakerSceneProgress=${debug.speakerSceneProgress ?? "0/0"}`,
    `relationshipsAttempted=${debug.relationshipsAttempted}`,
    `relationshipsOk=${debug.relationshipsOk}`,
    `relationshipsError=${debug.relationshipsError || "none"}`,
    `relationshipsFilled=${debug.relationshipsFilled ?? "0/0"}`,
  ]
    .filter(Boolean)
    .join(" | ");
}