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

// Quản lý trạng thái đồng bộ dữ liệu (Hydration)
interface HydrationState {
  _hasHydrated: boolean;
  setHasHydrated: (state: boolean) => void;
}

function sanitizePersistedState(persistedState: unknown): Partial<AppStore> {
  const seed = createSeedState();
  if (!persistedState || typeof persistedState !== "object") return seed;
  const state = persistedState as Partial<AppStore>;

  return {
    projects: Array.isArray(state.projects) ? state.projects : seed.projects,
    activeProjectId: typeof state.activeProjectId === "string" ? state.activeProjectId : seed.activeProjectId,
    sourceItems: Array.isArray(state.sourceItems) ? state.sourceItems : seed.sourceItems,
    gddVersions: Array.isArray(state.gddVersions) ? state.gddVersions : seed.gddVersions,
    auditResults: Array.isArray(state.auditResults) ? state.auditResults : seed.auditResults,
    scorecards: Array.isArray(state.scorecards) ? state.scorecards : seed.scorecards,
    insightReports: Array.isArray(state.insightReports) ? state.insightReports : seed.insightReports,
    issues: Array.isArray(state.issues) ? state.issues : seed.issues,
    language: typeof state.language === "string" && VALID_LANGUAGES.has(state.language) ? state.language : seed.language,
    sidebarCollapsed: typeof state.sidebarCollapsed === "boolean" ? state.sidebarCollapsed : seed.sidebarCollapsed,
    helpOpen: false,
    toasts: [],
  };
}

export const useAppStore = create<AppStore & HydrationState>()(
  persist(
    (set, get, api) => ({
      ...createProjectSlice(set, get, api),
      ...createSourcesSlice(set, get, api),
      ...createGddSlice(set, get, api),
      ...createAuditSlice(set, get, api),
      ...createScorecardSlice(set, get, api),
      ...createInsightSlice(set, get, api),
      ...createIssueSlice(set, get, api),
      ...createGovernanceSlice(set, get, api),
      ...createUiSlice(set, get, api),
      
      _hasHydrated: false,
      setHasHydrated: (state) => set({ _hasHydrated: state }),

      resetToSeed: () => set(() => ({ ...createSeedState() })),
      replaceFromSnapshot: (snapshot) => set(() => ({ ...createSeedState(), ...sanitizePersistedState(snapshot) })),
    }),
    {
      name: APP_STORAGE_KEY,
      version: STORE_VERSION,
      storage: zustandStorage,
      onRehydrateStorage: (state) => () => state?.setHasHydrated(true),
      migrate: (persistedState) => sanitizePersistedState(persistedState),
      merge: (persistedState, currentState) => ({
        ...currentState,
        ...sanitizePersistedState(persistedState),
      }),
    }
  )
);