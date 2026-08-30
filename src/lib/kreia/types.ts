import type { UserBrief } from "./user-brief";

export const PROJECT_KINDS = ["human", "fruit-humanoid", "angel"] as const;
export type ProjectKind = (typeof PROJECT_KINDS)[number];

export const RECONSTRUCTION_MODES = [
  "reconstruction",
  "adaptation",
  "inspiration",
] as const;
export type ReconstructionMode = (typeof RECONSTRUCTION_MODES)[number];

export const CONFIDENCE_LEVELS = ["observed", "inferred", "proposed"] as const;
export type Confidence = (typeof CONFIDENCE_LEVELS)[number];

export const CHARACTER_PROMINENCE = [
  "principal",
  "secondary",
  "punctual",
] as const;
export type CharacterProminence = (typeof CHARACTER_PROMINENCE)[number];

export const SCENE_DURATIONS = [6, 8, 10] as const;
export type SceneDuration = (typeof SCENE_DURATIONS)[number];

export const PROJECT_STATUSES = [
  "draft",
  "analyzing",
  "analysis-ready",
  "incomplete",
  "generating",
  "complete",
  "error",
] as const;
export type ProjectStatus = (typeof PROJECT_STATUSES)[number];

export type FrameCapture = {
  t: number;
  dataUrl: string;
};

export type VideoMeta = {
  durationSeconds: number;
  width: number;
  height: number;
  fileName: string;
  source: "file" | "tiktok" | "url";
  sourceUrl?: string;
};

export type CharacterType =
  | "human"
  | "fruit_humanoid"
  | "angel"
  | "animated_character"
  | "animal_humanoid"
  | "fantasy_character"
  | "unknown_character"
  | "unknown";

export type CharacterSheet = {
  id: string;
  designation: string;
  name: string | null;
  sourceName?: string | null;
  nameConfidence: Confidence;
  characterType?: CharacterType;
  species?: string;
  bodyStructure?: string;
  distinctiveFeatures?: string;
  wings?: string;
  halo?: string;
  identityFingerprint?: string;
  firstSeen?: string;
  lastSeen?: string;
  ageApparent: string;
  sex: string;
  appearance: string;
  complexion: string;
  morphology: string;
  hair: string;
  eyes: string;
  clothing: string;
  accessories: string;
  role: string;
  personality: string;
  relationships: string;
  prominence: CharacterProminence;
  lockedTraits: string[];
  notes: string;
  dialogueColor?: string;
  userLocked?: boolean;
};

export type HookAnalysis = {
  firstSecondsDescription: string;
  attentionMechanism: string;
  revealedInfo: string;
  introducedConflict: string;
  curiosityCreated: string;
  whyContinue: string;
  confidence: Confidence;
};

export type NarrativeAnalysis = {
  subject: string;
  story: string;
  context: string;
  initialSituation: string;
  incitingIncident: string;
  conflict: string;
  stakes: string;
  evolution: string;
  climax: string;
  resolution: string;
  conclusion: string;
  cta: string | null;
  genre: string;
  tone: string;
  confidence: Confidence;
};

export type VisualStyleAnalysis = {
  renderType: string;
  artisticStyle: string;
  characterAppearance: string;
  colorPalette: string[];
  saturation: string;
  contrast: string;
  colorTemperature: string;
  lighting: string;
  shadows: string;
  textures: string;
  materials: string;
  sets: string;
  depthOfField: string;
  composition: string;
  framing: string;
  perspective: string;
  cameraMovement: string;
  pace: string;
  transitions: string;
  atmosphere: string;
  detailLevel: string;
  lockedStylePhrase: string;
  confidence: Confidence;
};

export type CinematicLanguage = {
  dominantShots: string[];
  cameraAngles: string[];
  movements: string[];
  lightingStyle: string;
  rhythm: string;
};

export type SceneAnalysis = {
  number: number;
  estimatedDuration: number;
  startHint: string;
  characters: string[];
  setting: string;
  action: string;
  emotion: string;
  camera: string;
  lighting: string;
  audio: string;
  dialogue: string | null;
  dialogueSpeaker: string | null;
  styleNotes: string;
  confidence: Confidence;
  silentReactions: SilentReaction[];
};

export type DialogueConfidence = "clear" | "uncertain" | "inaudible";

export type DialogueAttribution = "certain" | "unverified";

export type DialoguePerformance = {
  emotionStart: string;
  emotionDominant: string;
  intensity: number;
  facialExpression: string;
  gaze: string;
  gesture: string;
  posture: string;
  tone: string;
  tears: string;
  evolution: string;
};

export type SilentReaction = {
  characterId: string;
  characterLabel: string;
  expression: string;
  gaze: string;
  gesture: string;
  posture: string;
};

export type DialogueLine = {
  id: string;
  sceneNumber: number;
  order: number;
  speakerId: string | null;
  speakerLabel: string;
  sourceText: string;
  displayText: string;
  timeHint: string;
  startTime?: number;
  endTime?: number;
  emotion: string;
  intention: string;
  confidence: DialogueConfidence;
  attribution: DialogueAttribution;
  performance: DialoguePerformance;
  uncertainSpan?: string;
};

export type LockedDialogueBible = {
  language: string | null;
  source: "transcript" | "subtitles" | "visual-inference" | "unavailable";
  rawTranscript: string | null;
  lines: DialogueLine[];
};

export type AudioAnalysis = {
  dialoguePresent: boolean;
  voiceOverPresent: boolean;
  musicPresent: boolean;
  ambiencePresent: boolean;
  sfxPresent: boolean;
  silenceUsed: boolean;
  rhythm: string;
  transcriptExcerpt: string | null;
  notes: string;
  source: "transcript" | "subtitles" | "visual-inference" | "unavailable";
};

export type VideoAnalysis = {
  observedSummary: string;
  limitations: string[];
  language: string | null;
  sceneCountEstimate: number;
  narrative: NarrativeAnalysis;
  hook: HookAnalysis;
  characters: CharacterSheet[];
  visualStyle: VisualStyleAnalysis;
  cinematic: CinematicLanguage;
  scenes: SceneAnalysis[];
  audio: AudioAnalysis;
  dialogues: LockedDialogueBible;
};

export type CharacterProduction = {
  id: string;
  bible: string;
  imagePrompt: string;
  formattedSheet?: string;
};

export type SceneProduction = {
  number: number;
  duration: SceneDuration;
  characters: string[];
  location: string;
  action: string;
  emotion: string;
  camera: string;
  lighting: string;
  visualStyle: string;
  audio: string;
  dialogue: string | null;
  videoPrompt: string;
  continuityNotes: string;
  formattedPrompt?: string;
};

export type ProductionPlan = {
  hook: {
    reconstructed: string;
    visualPrompt: string;
    duration: SceneDuration;
    mechanism: string;
  };
  scenario: {
    logline: string;
    synopsis: string;
    structure: string;
    dialoguesNote: string;
  };
  characters: CharacterProduction[];
  visualStyle: {
    lockedPhrase: string;
    productionNotes: string;
    doNot: string[];
  };
  scenes: SceneProduction[];
};

export type SegmentNote = {
  index: number;
  start: number;
  end: number;
  frameTimes: number[];
  setting?: string;
  action?: string;
  emotion?: string;
  camera?: string;
  lighting?: string;
  audio?: string;
  characters?: string[];
  speakerId?: string | null;
  dialogue?: string | null;
  performance?: DialoguePerformance;
  silentReactions?: SilentReaction[];
  dialogues?: DialogueLine[];
  status?: "ok" | "retry" | "failed";
  done?: boolean;
};

export type AnalysisCheckpoint = {
  version: 1;
  completed: Array<"structure" | "cast" | "segments" | "narrative" | "speakers" | "produce">;
  characters?: CharacterSheet[];
  visualStyle?: VisualStyleAnalysis;
  cinematic?: CinematicLanguage;
  observedSummary?: string;
  limitations?: string[];
  language?: string | null;
  segments?: SegmentNote[];
  segmentNotes?: SegmentNote[];
  analyzedSegmentCount: number;
  analyzedCastBatchCount?: number;
  analyzedProductionSceneCount?: number;
  analyzedSpeakerSceneCount?: number;
  incomplete: boolean;
  failedStep?: string;
  failedMessage?: string;
  transcript?: string | null;
  transcriptNote?: string;
  castValidated?: boolean;
  dialoguesValidated?: boolean;
  dialogueDebug?: import("./engines/pass-debug").DialoguePassDebug;
  analysis?: VideoAnalysis;
  production?: ProductionPlan;
  userBrief?: UserBrief;
};

export type KreiaProject = {
  id: string;
  title: string;
  createdAt: string;
  updatedAt: string;
  kind: ProjectKind;
  mode: ReconstructionMode;
  status: ProjectStatus;
  errorMessage?: string;
  video: VideoMeta;
  thumbnailDataUrl?: string;
  frames: FrameCapture[];
  analysis?: VideoAnalysis;
  production?: ProductionPlan;
  analysisEdits: string[];
  userNotes: string;
  userBrief?: UserBrief;
  analysisCheckpoint?: AnalysisCheckpoint;
  analysisIncomplete?: boolean;
};

export type AudioChunk = {
  t: number;
  ownStart?: number;
  ownEnd?: number;
  wavBase64: string;
};

export type AnalyzeInput = {
  frames: FrameCapture[];
  audioWavBase64?: string | null;
  audioChunks?: AudioChunk[];
  audioExtractError?: string;
  durationSeconds: number;
  width: number;
  height: number;
  kind: ProjectKind;
  mode?: ReconstructionMode;
  userNotes?: string;
  checkpoint?: AnalysisCheckpoint;
  chosenStyleId?: string;
  chosenStyleText?: string;
  userBrief?: UserBrief;
};

export type GenerateInput = {
  analysis: VideoAnalysis;
  kind: ProjectKind;
  mode: ReconstructionMode;
  userNotes?: string;
  durationSeconds: number;
  checkpoint?: AnalysisCheckpoint;
};

export type ReviseAnalysisInput = {
  analysis: VideoAnalysis;
  instruction: string;
  kind: ProjectKind;
  durationSeconds: number;
};

export type ReviseProductionInput = {
  analysis: VideoAnalysis;
  production: ProductionPlan;
  kind: ProjectKind;
  mode: ReconstructionMode;
  instruction: string;
  durationSeconds: number;
  focus?: {
    section:
      | "hook"
      | "scenario"
      | "character"
      | "style"
      | "scene"
      | "all";
    characterId?: string;
    sceneNumber?: number;
  };
};

export type CreativeDirection = "strict" | "balanced" | "develop";

export type IdeateInput = {
  kind: ProjectKind;
  idea: string;
  extras?: string;
  durationSeconds: number;
  sceneCount: number;
  direction: CreativeDirection;
  chosenStyleId?: string;
  chosenStyleText?: string;
  styleImageDataUrl?: string | null;
  userNotes?: string;
};

export const IDEA_PHASES = [
  "understand",
  "story",
  "characters",
  "visual",
  "scenes",
  "dialogues",
  "prepare",
] as const;
export type IdeaPhase = (typeof IDEA_PHASES)[number];

export type IdeaUnderstanding = {
  mainIdea: string;
  genre: string;
  conflict: string;
  events: string[];
  mentionedCharacters: string[];
  relations: string[];
  locations: string[];
  emotions: string[];
  givenFacts: string[];
  missing: string[];
};

export type IdeaStory = {
  title: string;
  logline: string;
  beginning: string;
  progression: string;
  conflict: string;
  twists: string[];
  climax: string;
  ending: string;
  tone: string;
  subject: string;
};

export type IdeaCheckpoint = {
  version: 1;
  phase: IdeaPhase;
  completed: IdeaPhase[];
  understanding?: IdeaUnderstanding;
  story?: IdeaStory;
  characters?: CharacterSheet[];
  visualStyle?: VisualStyleAnalysis;
  cinematic?: CinematicLanguage;
  scenes?: SceneAnalysis[];
  dialogues?: LockedDialogueBible;
  analysis?: VideoAnalysis;
  production?: ProductionPlan;
  failedPhase?: IdeaPhase;
  failedMessage?: string;
};

