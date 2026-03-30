import type { StateCreator } from "zustand";
import { createSeedState } from "@/store/seedState";
import type { AppStore, ProjectSlice } from "@/store/types";

export const createProjectSlice: StateCreator<AppStore, [], [], ProjectSlice> = (set) => {
  const seed = createSeedState();

  return {
    projects: seed.projects,
    activeProjectId: seed.activeProjectId,
    addProject: (project) =>
      set((state) => ({
        projects: [project, ...state.projects],
        activeProjectId: project.id,
      })),
    setActiveProject: (projectId) => set(() => ({ activeProjectId: projectId })),
    updateProject: (projectId, patch) =>
      set((state) => ({
        projects: state.projects.map((project) =>
          project.id === projectId ? { ...project, ...patch, updatedAt: new Date().toISOString() } : project,
        ),
      })),
  };
};
