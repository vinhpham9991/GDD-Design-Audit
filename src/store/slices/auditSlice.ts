import type { StateCreator } from "zustand";
import { createSeedState } from "@/store/seedState";
import type { AppStore, AuditSlice } from "@/store/types";

export const createAuditSlice: StateCreator<AppStore, [], [], AuditSlice> = (set) => {
  const seed = createSeedState();

  return {
    auditResults: seed.auditResults,
    saveAuditResult: (result) =>
      set((state) => ({
        auditResults: [result, ...state.auditResults.filter((item) => item.id !== result.id)],
      })),
  };
};
