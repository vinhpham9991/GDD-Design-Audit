import type {
  AppSnapshot,
  ApprovalGate,
  AuditResult,
  ConfidenceItem,
  ConflictItem,
  DecisionLogEntry,
  EvidenceCoverageItem,
  GDDSection,
  GDDVersion,
  InsightReport,
  IssueItem,
  PassHistoryEntry,
  Project,
  RevisionLogEntry,
  Scorecard,
  SourceItem,
  SourceQualityItem,
} from "@/domain/models";
import type { Language } from "@/features/i18n/translations";

export interface ProjectSlice {
  projects: Project[];
  activeProjectId?: string;
  addProject: (project: Project) => void;
  setActiveProject: (projectId: string) => void;
  updateProject: (projectId: string, patch: Partial<Project>) => void;
}

export interface SourcesSlice {
  sourceItems: SourceItem[];
  addSourceItem: (item: SourceItem) => void;
  updateSourceItem: (sourceId: string, patch: Partial<SourceItem>) => void;
  deleteSourceItem: (sourceId: string) => void;
}

export interface GddSlice {
  gddVersions: GDDVersion[];
  addGddVersion: (version: GDDVersion) => void;
  updateGddVersion: (versionId: string, patch: Partial<GDDVersion>) => void;
  updateGddSection: (versionId: string, sectionKey: string, patch: Partial<GDDSection>) => void;
}

export interface AuditSlice {
  auditResults: AuditResult[];
  saveAuditResult: (result: AuditResult) => void;
}

export interface ScorecardSlice {
  scorecards: Scorecard[];
  saveScorecard: (scorecard: Scorecard) => void;
  deleteScorecard: (id: string) => void;
}

export interface InsightSlice {
  insightReports: InsightReport[];
  confidenceItems: ConfidenceItem[];
  evidenceCoverageItems: EvidenceCoverageItem[];
  sourceQualityItems: SourceQualityItem[];
  conflictItems: ConflictItem[];
  saveInsightReport: (report: InsightReport) => void;
}

export interface IssueSlice {
  issues: IssueItem[];
  addIssue: (issue: IssueItem) => void;
  addIssues: (issues: IssueItem[]) => void;
  updateIssue: (issueId: string, patch: Partial<IssueItem>) => void;
  deleteIssue: (issueId: string) => void;
  updateIssueStatus: (issueId: string, status: IssueItem["status"]) => void;
}

export interface GovernanceSlice {
  decisionLogs: DecisionLogEntry[];
  revisionLogs: RevisionLogEntry[];
  passHistory: PassHistoryEntry[];
  approvalGates: ApprovalGate[];
  addDecisionLog: (entry: DecisionLogEntry) => void;
  addRevisionLog: (entry: RevisionLogEntry) => void;
  addPassHistory: (entry: PassHistoryEntry) => void;
  setGovernanceSummaries: (payload: {
    approvalGates: ApprovalGate[];
    confidenceItems: ConfidenceItem[];
    evidenceCoverageItems: EvidenceCoverageItem[];
    sourceQualityItems: SourceQualityItem[];
    conflictItems: ConflictItem[];
  }) => void;
}

export interface ToastItem {
  id: string;
  message: string;
  tone?: "info" | "success" | "error";
}

export interface UiSlice {
  language: Language;
  sidebarCollapsed: boolean;
  helpOpen: boolean;
  toasts: ToastItem[];
  toggleSidebar: () => void;
  setLanguage: (language: Language) => void;
  openHelp: () => void;
  closeHelp: () => void;
  pushToast: (message: string, tone?: ToastItem["tone"]) => void;
  removeToast: (id: string) => void;
}

export interface AppSlice {
  resetToSeed: () => void;
  replaceFromSnapshot: (snapshot: AppSnapshot) => void;
}

export type AppStore = ProjectSlice &
  SourcesSlice &
  GddSlice &
  AuditSlice &
  ScorecardSlice &
  InsightSlice &
  IssueSlice &
  GovernanceSlice &
  UiSlice &
  AppSlice;
