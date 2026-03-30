import type { StateCreator } from "zustand";
import { createSeedState } from "@/store/seedState";
import type { AppStore, IssueSlice } from "@/store/types";

export const createIssueSlice: StateCreator<AppStore, [], [], IssueSlice> = (set) => {
  const seed = createSeedState();

  return {
    issues: seed.issues,
    addIssue: (issue) =>
      set((state) => ({
        issues: [issue, ...state.issues],
      })),
    addIssues: (issues) =>
      set((state) => {
        const existing = new Set(state.issues.map((issue) => `${issue.title}|${issue.linkedSection ?? ""}`));
        const filtered = issues.filter((issue) => !existing.has(`${issue.title}|${issue.linkedSection ?? ""}`));
        return {
          issues: [...filtered, ...state.issues],
        };
      }),
    updateIssue: (issueId, patch) =>
      set((state) => ({
        issues: state.issues.map((issue) =>
          issue.id === issueId ? { ...issue, ...patch, updatedAt: new Date().toISOString() } : issue,
        ),
      })),
    deleteIssue: (issueId) =>
      set((state) => ({
        issues: state.issues.filter((issue) => issue.id !== issueId),
      })),
    updateIssueStatus: (issueId, status) =>
      set((state) => ({
        issues: state.issues.map((issue) =>
          issue.id === issueId ? { ...issue, status, updatedAt: new Date().toISOString() } : issue,
        ),
      })),
  };
};
