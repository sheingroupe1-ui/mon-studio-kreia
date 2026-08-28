import { create } from "zustand";
import {
  deleteProject,
  listProjectIndex,
  loadProject,
  saveProject,
  type ProjectIndexItem,
} from "./db";
import { createId } from "./ids";
import type {
  FrameCapture,
  KreiaProject,
  ProductionPlan,
  ProjectKind,
  ReconstructionMode,
  VideoAnalysis,
  VideoMeta,
} from "./types";
import type { UserBrief } from "./user-brief";

type KreiaState = {
  hydrated: boolean;
  index: ProjectIndexItem[];
  current: KreiaProject | null;
  hydrate: () => Promise<void>;
  open: (id: string) => Promise<KreiaProject | null>;
  createDraft: (args: {
    kind: ProjectKind;
    mode: ReconstructionMode;
    video: VideoMeta;
    frames: FrameCapture[];
    thumbnailDataUrl?: string;
    userNotes: string;
    userBrief?: UserBrief;
  }) => Promise<KreiaProject>;
  patchCurrent: (patch: Partial<KreiaProject>) => Promise<void>;
  setAnalysis: (analysis: VideoAnalysis) => Promise<void>;
  setProduction: (production: ProductionPlan) => Promise<void>;
  remove: (id: string) => Promise<void>;
};

function titleFrom(meta: VideoMeta): string {
  const base = meta.fileName.replace(/\.[a-z0-9]+$/i, "").trim();
  return base || "Projet sans titre";
}

export const useKreia = create<KreiaState>((set, get) => ({
  hydrated: false,
  index: [],
  current: null,

  hydrate: async () => {
    set({ index: listProjectIndex(), hydrated: true });
  },

  open: async (id) => {
    const project = await loadProject(id);
    set({ current: project });
    return project;
  },

  createDraft: async ({ kind, mode, video, frames, thumbnailDataUrl, userNotes, userBrief }) => {
    const now = new Date().toISOString();
    const project: KreiaProject = {
      id: createId("prj"),
      title: titleFrom(video),
      createdAt: now,
      updatedAt: now,
      kind,
      mode,
      status: "analyzing",
      video,
      thumbnailDataUrl,
      frames,
      analysisEdits: [],
      userNotes,
      userBrief,
    };
    await saveProject(project);
    set({
      current: project,
      index: listProjectIndex(),
    });
    return project;
  },

  patchCurrent: async (patch) => {
    const current = get().current;
    if (!current) return;
    const next: KreiaProject = {
      ...current,
      ...patch,
      updatedAt: new Date().toISOString(),
    };
    await saveProject(next);
    set({ current: next, index: listProjectIndex() });
  },

  setAnalysis: async (analysis) => {
    await get().patchCurrent({
      analysis,
      status: "analysis-ready",
      errorMessage: undefined,
      analysisIncomplete: false,
      analysisCheckpoint: undefined,
    });
  },

  setProduction: async (production) => {
    await get().patchCurrent({
      production,
      status: "complete",
      errorMessage: undefined,
    });
  },

  remove: async (id) => {
    await deleteProject(id);
    const current = get().current;
    set({
      index: listProjectIndex(),
      current: current?.id === id ? null : current,
    });
  },
}));
