import type { StateCreator } from "zustand";
import { createSeedState } from "@/store/seedState";
import type { AppStore, InsightSlice } from "@/store/types";

export const createInsightSlice: StateCreator<AppStore, [], [], InsightSlice> = (set) => {
  const seed = createSeedState();

  return {
    insightReports: seed.insightReports,
    confidenceItems: seed.confidenceItems,
    evidenceCoverageItems: seed.evidenceCoverageItems,
    sourceQualityItems: seed.sourceQualityItems,
    conflictItems: seed.conflictItems,
    saveInsightReport: (report) =>
      set((state) => ({
        insightReports: [report, ...state.insightReports.filter((item) => item.id !== report.id)],
      })),
  };
};
