import { seedData } from "@/data/seed";
import { cloneDeep } from "@/lib/clone";
import type { AppStore } from "@/store/types";

type SeedOnlyState = Omit<
  AppStore,
  | "addProject"
  | "setActiveProject"
  | "updateProject"
  | "addSourceItem"
  | "updateSourceItem"
  | "deleteSourceItem"
  | "addGddVersion"
  | "updateGddVersion"
  | "updateGddSection"
  | "saveAuditResult"
  | "saveScorecard"
  | "deleteScorecard"
  | "saveInsightReport"
  | "addIssue"
  | "addIssues"
  | "updateIssue"
  | "deleteIssue"
  | "updateIssueStatus"
  | "addDecisionLog"
  | "addRevisionLog"
  | "addPassHistory"
  | "setGovernanceSummaries"
  | "toggleSidebar"
  | "setLanguage"
  | "openHelp"
  | "closeHelp"
  | "pushToast"
  | "removeToast"
  | "resetToSeed"
  | "replaceFromSnapshot"
>;

export function createSeedState(): SeedOnlyState {
  const cloned = cloneDeep(seedData);
  const firstProject = cloned.projects[0];

  return {
    projects: cloned.projects,
    activeProjectId: firstProject?.id,
    sourceItems: cloned.sourceItems,
    gddVersions: cloned.gddVersions,
    auditResults: cloned.auditResults,
    scorecards: cloned.scorecards,
    insightReports: cloned.insightReports,
    issues: cloned.issues,
    decisionLogs: cloned.decisionLogs,
    revisionLogs: cloned.revisionLogs,
    passHistory: cloned.passHistory,
    approvalGates: cloned.approvalGates,
    confidenceItems: cloned.confidenceItems,
    evidenceCoverageItems: cloned.evidenceCoverageItems,
    sourceQualityItems: cloned.sourceQualityItems,
    conflictItems: cloned.conflictItems,
    sidebarCollapsed: false,
    language: "en",
    helpOpen: false,
    toasts: [],
  };
}
