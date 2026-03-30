import type { StateCreator } from "zustand";
import { createSeedState } from "@/store/seedState";
import type { AppStore, GddSlice } from "@/store/types";

export const createGddSlice: StateCreator<AppStore, [], [], GddSlice> = (set) => {
  const seed = createSeedState();

  return {
    gddVersions: seed.gddVersions,
    addGddVersion: (version) =>
      set((state) => ({
        gddVersions: [version, ...state.gddVersions],
      })),
    updateGddVersion: (versionId, patch) =>
      set((state) => ({
        gddVersions: state.gddVersions.map((version) =>
          version.id === versionId ? { ...version, ...patch } : version,
        ),
      })),
    updateGddSection: (versionId, sectionKey, patch) =>
      set((state) => ({
        gddVersions: state.gddVersions.map((version) => {
          if (version.id !== versionId) {
            return version;
          }

          return {
            ...version,
            sections: version.sections.map((section) =>
              section.key === sectionKey ? { ...section, ...patch } : section,
            ),
          };
        }),
      })),
  };
};
