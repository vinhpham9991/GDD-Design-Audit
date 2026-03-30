import type { StateCreator } from "zustand";
import { createSeedState } from "@/store/seedState";
import type { AppStore, ScorecardSlice } from "@/store/types";

export const createScorecardSlice: StateCreator<AppStore, [], [], ScorecardSlice> = (set) => {
  const seed = createSeedState();

  return {
    scorecards: seed.scorecards,
    saveScorecard: (scorecard) =>
      set((state) => ({
        scorecards: [
          scorecard,
          ...state.scorecards.filter((item) => item.id !== scorecard.id),
        ],
      })),
    deleteScorecard: (id) =>
      set((state) => ({
        scorecards: state.scorecards.filter((scorecard) => scorecard.id !== id),
      })),
  };
};
