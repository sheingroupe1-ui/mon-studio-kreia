export type DialoguePassDebug = {
  speakersAttempted: boolean;
  speakersOk: boolean;
  speakersError?: string;
  speakersMatched: string;
  relationshipsAttempted: boolean;
  relationshipsOk: boolean;
  relationshipsError?: string;
  relationshipsFilled?: string;
};

export function emptyDialoguePassDebug(): DialoguePassDebug {
  return {
    speakersAttempted: false,
    speakersOk: false,
    speakersMatched: "0/0",
    relationshipsAttempted: false,
    relationshipsOk: false,
  };
}

export function formatDialoguePassDebug(debug?: DialoguePassDebug | null): string {
  if (!debug) return "";
  const parts = [
    `speakers attempted=${debug.speakersAttempted} ok=${debug.speakersOk} matched=${debug.speakersMatched}`,
    debug.speakersError ? `speakersError=${debug.speakersError}` : "",
    `relationships attempted=${debug.relationshipsAttempted} ok=${debug.relationshipsOk} filled=${debug.relationshipsFilled ?? "0/0"}`,
    debug.relationshipsError ? `relationshipsError=${debug.relationshipsError}` : "",
  ].filter(Boolean);
  return parts.join(" | ");
}
