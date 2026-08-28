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
import { durationFromProject, splitAnalysis, splitProduction } from "./engines/split-plan";

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

function applySplit(current: KreiaProject, patch: Partial<KreiaProject>): Partial<KreiaProject> {
  const duration = durationFromProject({
    durationSeconds: patch.video?.durationSeconds ?? current.video.durationSeconds,
    frameTimes: (patch.frames ?? current.frames).map((frame) => frame.t),
    analysis: patch.analysis ?? current.analysis,
  });
  const next = { ...patch };
  if (patch.analysis) next.analysis = splitAnalysis(patch.analysis, duration);
  if (patch.production) {
    const analysis = next.analysis ?? current.analysis;
    if (analysis) next.production = splitProduction(patch.production, analysis, duration);
  }
  return next;
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
    if (!project) {
      set({ current: null });
      return null;
    }
    if (project.analysis) {
      const duration = durationFromProject({
        durationSeconds: project.video.durationSeconds,
        frameTimes: project.frames.map((frame) => frame.t),
        analysis: project.analysis,
      });
      const analysis = splitAnalysis(project.analysis, duration);
      const production = project.production
        ? splitProduction(project.production, analysis, duration)
        : project.production;
      const next = { ...project, analysis, production };
      if (
        analysis.scenes.length !== project.analysis.scenes.length ||
        (production && production.scenes.length !== project.production?.scenes.length)
      ) {
        await saveProject(next);
      }
      set({ current: next });
      return next;
    }
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
    const split = applySplit(current, patch);
    const next: KreiaProject = {
      ...current,
      ...split,
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
