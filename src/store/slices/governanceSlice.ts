import type { StateCreator } from "zustand";
import { createSeedState } from "@/store/seedState";
import type { AppStore, GovernanceSlice } from "@/store/types";

export const createGovernanceSlice: StateCreator<AppStore, [], [], GovernanceSlice> = (set) => {
  const seed = createSeedState();

  return {
    decisionLogs: seed.decisionLogs,
    revisionLogs: seed.revisionLogs,
    passHistory: seed.passHistory,
    approvalGates: seed.approvalGates,
    addDecisionLog: (entry) =>
      set((state) => ({
        decisionLogs: [entry, ...state.decisionLogs],
      })),
    addRevisionLog: (entry) =>
      set((state) => ({
        revisionLogs: [entry, ...state.revisionLogs],
      })),
    addPassHistory: (entry) =>
      set((state) => ({
        passHistory: [entry, ...state.passHistory],
      })),
    setGovernanceSummaries: (payload) =>
      set(() => ({
        approvalGates: payload.approvalGates,
        confidenceItems: payload.confidenceItems,
        evidenceCoverageItems: payload.evidenceCoverageItems,
        sourceQualityItems: payload.sourceQualityItems,
        conflictItems: payload.conflictItems,
      })),
  };
};
