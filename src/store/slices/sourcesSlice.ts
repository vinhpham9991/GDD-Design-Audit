import type { StateCreator } from "zustand";
import { createSeedState } from "@/store/seedState";
import type { AppStore, SourcesSlice } from "@/store/types";

export const createSourcesSlice: StateCreator<AppStore, [], [], SourcesSlice> = (set) => {
  const seed = createSeedState();

  return {
    sourceItems: seed.sourceItems,
    addSourceItem: (item) =>
      set((state) => ({
        sourceItems: [item, ...state.sourceItems],
      })),
    updateSourceItem: (sourceId, patch) =>
      set((state) => ({
        sourceItems: state.sourceItems.map((source) =>
          source.id === sourceId ? { ...source, ...patch, updatedAt: new Date().toISOString() } : source,
        ),
      })),
    deleteSourceItem: (sourceId) =>
      set((state) => ({
        sourceItems: state.sourceItems.filter((source) => source.id !== sourceId),
      })),
  };
};
