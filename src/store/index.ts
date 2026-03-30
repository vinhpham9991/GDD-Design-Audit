import { create } from "zustand";
import { persist } from "zustand/middleware";
import { APP_STORAGE_KEY, zustandStorage } from "@/domain/services/storage";
import type { AppSnapshot } from "@/domain/models";
import { createAuditSlice } from "@/store/slices/auditSlice";
import { createGddSlice } from "@/store/slices/gddSlice";
import { createGovernanceSlice } from "@/store/slices/governanceSlice";
import { createInsightSlice } from "@/store/slices/insightSlice";
import { createIssueSlice } from "@/store/slices/issueSlice";
import { createProjectSlice } from "@/store/slices/projectSlice";
import { createScorecardSlice } from "@/store/slices/scorecardSlice";
import { createSourcesSlice } from "@/store/slices/sourcesSlice";
import { createUiSlice } from "@/store/slices/uiSlice";
import { createSeedState } from "@/store/seedState";
import type { AppStore } from "@/store/types";

const STORE_VERSION = 2;
const VALID_LANGUAGES = new Set(["en", "vi"]);

function sanitizePersistedState(persistedState: unknown): Partial<AppStore> {
  const seed = createSeedState();
  if (!persistedState || typeof persistedState !== "object") {
    return seed;
  }

  const state = persistedState as Partial<AppStore>;

  return {
    projects: Array.isArray(state.projects) ? state.projects : seed.projects,
    activeProjectId:
      typeof state.activeProjectId === "string" || state.activeProjectId === undefined
        ? state.activeProjectId
        : seed.activeProjectId,
    sourceItems: Array.isArray(state.sourceItems) ? state.sourceItems : seed.sourceItems,
    gddVersions: Array.isArray(state.gddVersions) ? state.gddVersions : seed.gddVersions,
    auditResults: Array.isArray(state.auditResults) ? state.auditResults : seed.auditResults,
    scorecards: Array.isArray(state.scorecards) ? state.scorecards : seed.scorecards,
    insightReports: Array.isArray(state.insightReports) ? state.insightReports : seed.insightReports,
    issues: Array.isArray(state.issues) ? state.issues : seed.issues,
    decisionLogs: Array.isArray(state.decisionLogs) ? state.decisionLogs : seed.decisionLogs,
    revisionLogs: Array.isArray(state.revisionLogs) ? state.revisionLogs : seed.revisionLogs,
    passHistory: Array.isArray(state.passHistory) ? state.passHistory : seed.passHistory,
    approvalGates: Array.isArray(state.approvalGates) ? state.approvalGates : seed.approvalGates,
    confidenceItems: Array.isArray(state.confidenceItems)
      ? state.confidenceItems
      : seed.confidenceItems,
    evidenceCoverageItems: Array.isArray(state.evidenceCoverageItems)
      ? state.evidenceCoverageItems
      : seed.evidenceCoverageItems,
    sourceQualityItems: Array.isArray(state.sourceQualityItems)
      ? state.sourceQualityItems
      : seed.sourceQualityItems,
    conflictItems: Array.isArray(state.conflictItems) ? state.conflictItems : seed.conflictItems,
    sidebarCollapsed:
      typeof state.sidebarCollapsed === "boolean" ? state.sidebarCollapsed : seed.sidebarCollapsed,
    language:
      typeof state.language === "string" && VALID_LANGUAGES.has(state.language)
        ? state.language
        : seed.language,
    helpOpen: false,
    toasts: [],
  };
}

function snapshotToStoreState(snapshot: AppSnapshot): Partial<AppStore> {
  return sanitizePersistedState({
    projects: snapshot.projects,
    activeProjectId: snapshot.activeProjectId,
    sourceItems: snapshot.sourceItems,
    gddVersions: snapshot.gddVersions,
    auditResults: snapshot.auditResults,
    scorecards: snapshot.scorecards,
    insightReports: snapshot.insightReports,
    issues: snapshot.issues,
    decisionLogs: snapshot.decisionLogs,
    revisionLogs: snapshot.revisionLogs,
    passHistory: snapshot.passHistory,
    approvalGates: snapshot.approvalGates,
    confidenceItems: snapshot.confidenceItems,
    evidenceCoverageItems: snapshot.evidenceCoverageItems,
    sourceQualityItems: snapshot.sourceQualityItems,
    conflictItems: snapshot.conflictItems,
  });
}

export const useAppStore = create<AppStore>()(
  persist(
    (...a) => ({
      ...createProjectSlice(...a),
      ...createSourcesSlice(...a),
      ...createGddSlice(...a),
      ...createAuditSlice(...a),
      ...createScorecardSlice(...a),
      ...createInsightSlice(...a),
      ...createIssueSlice(...a),
      ...createGovernanceSlice(...a),
      ...createUiSlice(...a),
      resetToSeed: () =>
        a[0](() => {
          const seed = createSeedState();
          return { ...seed };
        }),
      replaceFromSnapshot: (snapshot) => {
        a[0](() => ({
          ...createSeedState(),
          ...snapshotToStoreState(snapshot),
        }));
      },
    }),
    {
      name: APP_STORAGE_KEY,
      version: STORE_VERSION,
      storage: zustandStorage,
      partialize: (state) => {
        const { toasts, helpOpen, ...rest } = state;
        void toasts;
        void helpOpen;
        return rest;
      },
      migrate: (persistedState) => sanitizePersistedState(persistedState),
      merge: (persistedState, currentState) => {
        return {
          ...currentState,
          ...sanitizePersistedState(persistedState),
        };
      },
    },
  ),
);
