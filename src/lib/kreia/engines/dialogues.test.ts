import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  applyLinesToScenes,
  attachDialogues,
  emptyPerformance,
  enforceProductionDialogues,
  explodeMixedDialogue,
  finalizeLockedDialogues,
  formatAttributedPromptBlock,
  injectVerbatimDialogue,
  isFaithfulToTranscript,
  reassignDialogueSpeaker,
  substituteNames,
  utterancesFromTranscript,
} from "./dialogues.ts";
import type { CharacterSheet, SceneAnalysis, SceneProduction, VideoAnalysis } from "../types.ts";

function character(name: string | null, sourceName: string | null = name): CharacterSheet {
  return {
    id: "CHARACTER_01",
    designation: "Femme",
    name,
    sourceName,
    nameConfidence: "observed",
    ageApparent: "",
    sex: "femme",
    appearance: "",
    complexion: "",
    morphology: "",
    hair: "",
    eyes: "",
    clothing: "",
    accessories: "",
    role: "",
    personality: "",
    relationships: "",
    prominence: "principal",
    lockedTraits: [],
    notes: "",
  };
}

describe("substituteNames", () => {
  it("replaces only the first name, never the rest of the line", () => {
    const out = substituteNames("Marie, attends-moi !", [{ from: "Marie", to: "Sarah" }]);
    assert.equal(out, "Sarah, attends-moi !");
  });

  it("does not rewrite the sentence when substituting Jean → David", () => {
    const out = substituteNames("Jean, pourquoi tu m'as fait ça ?", [{ from: "Jean", to: "David" }]);
    assert.equal(out, "David, pourquoi tu m'as fait ça ?");
    assert.equal(out.includes("trahir"), false);
  });
});

describe("utterancesFromTranscript", () => {
  it("keeps spoken sentences in order", () => {
    const u = utterancesFromTranscript(
      "[0.0s] Tu m'avais pourtant promis de ne jamais partir.\n[4.2s] Je n'avais pas le choix.",
    );
    assert.equal(u.length, 2);
    assert.match(u[0] ?? "", /promis de ne jamais partir/);
    assert.match(u[1] ?? "", /pas le choix/);
  });

  it("keeps an ellipsis replica as a single utterance", () => {
    const u = utterancesFromTranscript("Je t'en prie... ne me quitte pas.");
    assert.equal(u.length, 1);
    assert.match(u[0] ?? "", /ne me quitte pas/);
  });
});

describe("isFaithfulToTranscript", () => {
  it("rejects a creative paraphrase", () => {
    const transcript = "Tu m'avais pourtant promis de ne jamais partir.";
    assert.equal(
      isFaithfulToTranscript("Je ne comprends pas pourquoi tu as décidé de me trahir.", transcript),
      false,
    );
    assert.equal(isFaithfulToTranscript(transcript, transcript), true);
  });
});

describe("finalizeLockedDialogues", () => {
  it("replaces a paraphrased LLM line with the transcript", () => {
    const bible = finalizeLockedDialogues({
      transcript: "Tu m'avais pourtant promis de ne jamais partir.",
      llmLines: [
        {
          id: "D001",
          sceneNumber: 1,
          order: 1,
          speakerId: "CHARACTER_01",
          speakerLabel: "Marie",
          sourceText: "Tu avais dit que tu resterais pour toujours.",
          displayText: "Tu avais dit que tu resterais pour toujours.",
          timeHint: "",
          emotion: "",
          intention: "",
          confidence: "clear",
          attribution: "certain",
          performance: emptyPerformance(),
        },
      ],
      characters: [character("Marie")],
      sceneCount: 1,
    });
    assert.equal(bible.lines.length, 1);
    assert.equal(bible.lines[0]?.sourceText, "Tu m'avais pourtant promis de ne jamais partir.");
    assert.equal(bible.source, "transcript");
  });

  it("applies a name lock on display text only", () => {
    const bible = finalizeLockedDialogues({
      transcript: "Marie, attends-moi !",
      llmLines: [],
      characters: [character("Sarah", "Marie")],
      sceneCount: 1,
    });
    assert.equal(bible.lines[0]?.sourceText, "Marie, attends-moi !");
    assert.equal(bible.lines[0]?.displayText, "Sarah, attends-moi !");
  });

  it("does not split a replica that contains internal ellipsis", () => {
    const bible = finalizeLockedDialogues({
      transcript: "Je t'en prie... ne me quitte pas.",
      llmLines: [
        {
          id: "D001",
          sceneNumber: 1,
          order: 1,
          speakerId: "CHARACTER_01",
          speakerLabel: "Marie",
          sourceText: "Je t'en prie... ne me quitte pas.",
          displayText: "Je t'en prie... ne me quitte pas.",
          timeHint: "",
          emotion: "",
          intention: "",
          confidence: "clear",
          attribution: "certain",
          performance: emptyPerformance(),
        },
      ],
      characters: [character("Marie")],
      sceneCount: 1,
    });
    assert.equal(bible.lines.length, 1);
    assert.equal(bible.lines[0]?.speakerId, "CHARACTER_01");
    assert.match(bible.lines[0]?.sourceText ?? "", /Je t'en prie/);
    assert.match(bible.lines[0]?.sourceText ?? "", /ne me quitte pas/);
  });
});

describe("enforceProductionDialogues", () => {
  it("overwrites a rewritten production line with the locked source", () => {
    const analysis = {
      dialogues: {
        language: "fr",
        source: "transcript" as const,
        rawTranscript: "Je n'avais pas le choix.",
        lines: [
          {
            id: "D001",
            sceneNumber: 1,
            order: 1,
            speakerId: "CHARACTER_01",
            speakerLabel: "Jean",
            sourceText: "Je n'avais pas le choix.",
            displayText: "Je n'avais pas le choix.",
            timeHint: "",
            emotion: "",
            intention: "",
            confidence: "clear" as const,
            attribution: "certain" as const,
            performance: emptyPerformance(),
          },
        ],
      },
      characters: [character("Jean")],
      scenes: [],
      audio: { dialoguePresent: true },
    } as unknown as VideoAnalysis;

    const scene: SceneProduction = {
      number: 1,
      duration: 8,
      characters: ["CHARACTER_01"],
      location: "set",
      action: "répond",
      emotion: "",
      camera: "",
      lighting: "",
      visualStyle: "",
      audio: "",
      dialogue: "Je n'ai jamais vraiment eu d'alternative, tu sais.",
      videoPrompt: "A man answers, dialogue: I never really had a choice.",
      continuityNotes: "",
    };

    const out = enforceProductionDialogues(
      {
        hook: { reconstructed: "", visualPrompt: "", duration: 8, mechanism: "" },
        scenario: { logline: "", synopsis: "", structure: "", dialoguesNote: "" },
        characters: [],
        visualStyle: { lockedPhrase: "", productionNotes: "", doNot: [] },
        scenes: [scene],
      },
      analysis,
      "reconstruction",
    );
    assert.match(out.scenes[0]?.dialogue ?? "", /Je n'avais pas le choix/);
    assert.equal(out.scenes[0]?.dialogue?.includes("alternative"), false);
    assert.match(out.scenes[0]?.videoPrompt ?? "", /Dialogue exact/);
    assert.match(out.scenes[0]?.videoPrompt ?? "", /Je n'avais pas le choix/);
    assert.match(out.scenario.dialoguesNote, /verrouillés/);
  });
});

describe("applyLinesToScenes", () => {
  it("keeps both speakers in order when two lines share a scene", () => {
    const scene: SceneAnalysis = {
      number: 1,
      estimatedDuration: 10,
      startHint: "0s",
      characters: ["CHARACTER_01", "CHARACTER_02"],
      setting: "",
      action: "",
      emotion: "",
      camera: "",
      lighting: "",
      audio: "",
      dialogue: null,
      dialogueSpeaker: null,
      styleNotes: "",
      confidence: "observed",
      silentReactions: [],
    };
    const out = applyLinesToScenes([scene], [
      {
        id: "D001",
        sceneNumber: 1,
        order: 1,
        speakerId: "CHARACTER_01",
        speakerLabel: "Marie",
        sourceText: "Tu m'avais pourtant promis de ne jamais partir.",
        displayText: "Tu m'avais pourtant promis de ne jamais partir.",
        timeHint: "",
        emotion: "",
        intention: "",
        confidence: "clear",
        attribution: "certain",
        performance: emptyPerformance(),
      },
      {
        id: "D002",
        sceneNumber: 1,
        order: 2,
        speakerId: "CHARACTER_02",
        speakerLabel: "Jean",
        sourceText: "Je n'avais pas le choix.",
        displayText: "Je n'avais pas le choix.",
        timeHint: "",
        emotion: "",
        intention: "",
        confidence: "clear",
        attribution: "certain",
        performance: emptyPerformance(),
      },
    ]);
    assert.match(out[0]?.dialogue ?? "", /promis de ne jamais partir/);
    assert.match(out[0]?.dialogue ?? "", /pas le choix/);
  });
});

describe("injectVerbatimDialogue", () => {
  it("appends a lock block without dropping the prompt", () => {
    const out = injectVerbatimDialogue("cinematic two-shot, warm light", "Marie : « Attends. »");
    assert.match(out, /cinematic two-shot/);
    assert.match(out, /DIALOGUES VERROUILLÉS/);
    assert.match(out, /Attends/);
  });
});

describe("attachDialogues", () => {
  it("does not invent lines when nothing was heard", () => {
    const analysis = {
      observedSummary: "Deux personnages se regardent.",
      limitations: [],
      language: "fr",
      sceneCountEstimate: 1,
      narrative: {},
      hook: {},
      characters: [character(null)],
      visualStyle: {},
      cinematic: {},
      scenes: [
        {
          number: 1,
          estimatedDuration: 8,
          startHint: "",
          characters: ["CHARACTER_01"],
          setting: "",
          action: "",
          emotion: "",
          camera: "",
          lighting: "",
          audio: "silence",
          dialogue: null,
          dialogueSpeaker: null,
          styleNotes: "",
          confidence: "observed",
          silentReactions: [],
        },
      ],
      audio: {
        dialoguePresent: false,
        voiceOverPresent: false,
        musicPresent: false,
        ambiencePresent: false,
        sfxPresent: false,
        silenceUsed: true,
        rhythm: "",
        transcriptExcerpt: null,
        notes: "",
        source: "unavailable",
      },
      dialogues: { language: null, source: "unavailable", rawTranscript: null, lines: [] },
    } as unknown as VideoAnalysis;
    const out = attachDialogues(analysis, null);
    assert.equal(out.dialogues.lines.length, 0);
    assert.equal(out.scenes[0]?.dialogue, null);
  });
});

describe("speaker attribution", () => {
  it("does not dump unmatched lines onto the principal character", () => {
    const bible = finalizeLockedDialogues({
      transcript: "Je n'avais pas le choix.",
      llmLines: [],
      characters: [character("Marie")],
      sceneCount: 1,
    });
    assert.equal(bible.lines[0]?.speakerId, null);
    assert.equal(bible.lines[0]?.attribution, "unverified");
  });

  it("splits mixed speakers and keeps order", () => {
    const parts = explodeMixedDialogue(
      "Marie : « Je veux connaître la vérité »\nJean : « Tu n'étais pas censée apprendre ça »",
    );
    assert.equal(parts.length, 2);
    assert.equal(parts[0]?.speaker, "Marie");
    assert.match(parts[0]?.text ?? "", /vérité/);
    assert.equal(parts[1]?.speaker, "Jean");
  });

  it("keeps replica text when reassigning speaker", () => {
    const marie = character("Marie");
    const jean: CharacterSheet = { ...character("Jean"), id: "CHARACTER_02", designation: "Homme" };
    const line = {
      id: "D001",
      sceneNumber: 1,
      order: 1,
      speakerId: "CHARACTER_01",
      speakerLabel: "Marie",
      sourceText: "Je veux connaître la vérité",
      displayText: "Je veux connaître la vérité",
      timeHint: "",
      emotion: "",
      intention: "",
      confidence: "clear" as const,
      attribution: "certain" as const,
      performance: emptyPerformance(),
    };
    const next = reassignDialogueSpeaker(line, "CHARACTER_02", [marie, jean]);
    assert.equal(next.speakerId, "CHARACTER_02");
    assert.equal(next.speakerLabel, "Jean");
    assert.equal(next.sourceText, "Je veux connaître la vérité");
  });

  it("formats one identified speaker per prompt block, in order", () => {
    const marie = character("Marie");
    const jean: CharacterSheet = { ...character("Jean"), id: "CHARACTER_02", designation: "Homme" };
    const block = formatAttributedPromptBlock(
      [
        {
          id: "D001",
          sceneNumber: 1,
          order: 1,
          speakerId: "CHARACTER_01",
          speakerLabel: "Marie",
          sourceText: "Je veux connaître la vérité",
          displayText: "Je veux connaître la vérité",
          timeHint: "",
          emotion: "",
          intention: "",
          confidence: "clear",
          attribution: "certain",
          performance: {
            ...emptyPerformance(),
            emotionDominant: "tristesse profonde qui se transforme en colère contenue",
            intensity: 7,
            facialExpression: "yeux remplis de larmes, sourcils légèrement contractés",
            tears: "une larme coule sur sa joue",
            gesture: "elle essuie rapidement une larme",
            tone: "voix tremblante mais ferme",
          },
        },
        {
          id: "D002",
          sceneNumber: 1,
          order: 2,
          speakerId: "CHARACTER_02",
          speakerLabel: "Jean",
          sourceText: "Tu n'étais pas censée apprendre ça",
          displayText: "Tu n'étais pas censée apprendre ça",
          timeHint: "",
          emotion: "",
          intention: "",
          confidence: "clear",
          attribution: "certain",
          performance: emptyPerformance(),
        },
      ],
      [marie, jean],
    );
    assert.match(block ?? "", /MARIE[\s\S]*vérité[\s\S]*JEAN[\s\S]*censée/);
    assert.match(block ?? "", /yeux remplis de larmes/);
    assert.match(block ?? "", /Dialogue exact/);
    assert.equal((block ?? "").indexOf("MARIE") < (block ?? "").indexOf("JEAN"), true);
  });
});
