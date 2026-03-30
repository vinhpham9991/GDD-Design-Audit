import type {
  ScorecardCategoryScores,
  SourceType,
} from "@/domain/models/constants";

export type HealthLevel = "strong" | "medium" | "weak" | "missing";
export type Reliability = "high" | "medium" | "low" | "fragile";
export type MappingConfidence = "high" | "medium" | "low" | "unmapped";
export type AuditConfidenceLevel = "high" | "medium" | "low";

export interface ParagraphElement {
  type: "paragraph";
  text: string;
}

export interface HeadingElement {
  type: "heading";
  text: string;
  normalizedText?: string;
  level?: number;
}

export interface TableElement {
  type: "table";
  rows: string[][];
  flattenedText: string;
}

export interface BulletListElement {
  type: "bullet_list";
  items: string[];
  flattenedText: string;
}

export interface NumberedListElement {
  type: "numbered_list";
  items: string[];
  flattenedText: string;
}

export interface AppendixElement {
  type: "appendix";
  heading?: string;
  text: string;
}

export interface UnknownElement {
  type: "unknown";
  text: string;
}

export type ParsedElement =
  | ParagraphElement
  | HeadingElement
  | TableElement
  | BulletListElement
  | NumberedListElement
  | AppendixElement
  | UnknownElement;

export interface ParsedBlock {
  id: string;
  heading?: string;
  normalizedHeading?: string;
  level?: number;
  headingLevel?: number;
  content: string;
  sourceRange?: string;
  mappedSectionKey?: string;
  mappedBucket?: string;
  primaryBucket?: string;
  primaryCanonicalSection?: string;
  supportCanonicalSections?: string[];
  bucketCategory?: "canonical" | "non_canonical" | "unknown";
  mappingConfidence?: MappingConfidence;
  contentParts?: ParsedElement[];
  sourceTypeHints?: string[];
  isAppendix?: boolean;
  appendixLabel?: string;
  isDocumentFraming?: boolean;
  notes?: string[];
  mappingReasons?: string[];
  ownershipReason?: string;
  ownershipHeading?: string;
  manualMapping?: boolean;
}

export interface ParsedDocument {
  title?: string;
  rawText: string;
  elements?: ParsedElement[];
  blocks: ParsedBlock[];
  appendixBlocks?: ParsedBlock[];
  unmappedBlocks?: ParsedBlock[];
  diagnostics?: ParserDiagnostics;
}

export interface ParserDiagnostics {
  totalElements: number;
  totalBlocks: number;
  headingCount: number;
  tableCount: number;
  bulletListCount: number;
  numberedListCount: number;
  appendixCount: number;
  emptyBlockCount: number;
  canonicalMappedCount: number;
  nonCanonicalMappedCount: number;
  unknownUnmappedCount: number;
  tableContainingBlocks: number;
  bulletContainingBlocks: number;
  numberedContainingBlocks: number;
  appendixBlocks: number;
  documentFramingBlocks: number;
}

export interface ParserCoverageSummary {
  totalBlocks: number;
  mappedBlocks: number;
  unmappedBlocks: number;
  mappedPercent: number;
  sourceBackedSections: number;
  emptySections: number;
  lowConfidenceBlocks: number;
}

export interface GddSectionBuildMeta {
  blockCount: number;
  mappedContentLength: number;
  confidenceSummary: MappingConfidence;
  directContributorCount?: number;
  supportContributorCount?: number;
  descendantContributorCount?: number;
}

export interface MaterializationContributor {
  blockId: string;
  heading?: string;
  bucket?: string;
  primarySection?: string;
  supportSections?: string[];
  contentPreview: string;
  charCount: number;
  contributionType: "direct" | "support" | "descendant";
  confidence: "high" | "medium" | "low";
  reason?: string;
}

export interface MaterializationRejectedCandidate {
  blockId: string;
  heading?: string;
  bucket?: string;
  reason: string;
}

export interface SectionMaterializationDebug {
  sectionKey: string;
  title: string;
  totalChars: number;
  totalBlocks: number;
  confidence: "high" | "medium" | "low" | "empty";
  directContributors: MaterializationContributor[];
  supportContributors: MaterializationContributor[];
  descendantContributors: MaterializationContributor[];
  rejectedCandidates: MaterializationRejectedCandidate[];
  notes: string[];
}

export interface MaterializationDebugInfo {
  sections: SectionMaterializationDebug[];
  totalCanonicalSections: number;
  populatedSections: number;
  emptySections: number;
  notes: string[];
}

export interface Project {
  id: string;
  name: string;
  genre?: string;
  platform?: string;
  targetAudience?: string;
  status?: string;
  createdAt: string;
  updatedAt: string;
  currentVersionId?: string;
}

export interface SourceItem {
  id: string;
  projectId?: string;
  title: string;
  type: SourceType;
  content?: string;
  url?: string;
  createdAt: string;
  updatedAt: string;
  reliability?: Reliability;
  tags?: string[];
  parsedDocument?: ParsedDocument;
}

export interface GDDSection {
  id: string;
  key: string;
  title: string;
  content: string;
  status?: HealthLevel;
}

export interface GDDVersion {
  id: string;
  projectId: string;
  name: string;
  createdAt: string;
  sections: GDDSection[];
  summary?: string;
  sectionBuildMeta?: Record<string, GddSectionBuildMeta>;
  unmappedBlocks?: ParsedBlock[];
  parserCoverage?: ParserCoverageSummary;
  materializationDebug?: MaterializationDebugInfo;
}

export interface AuditSectionFinding {
  sectionKey: string;
  health: HealthLevel;
  score: number;
  unsupportedClaims: string[];
  contradictions: string[];
  gaps: string[];
  rewriteBrief?: string;
  scoreBreakdown?: {
    baseScore: number;
    detailScore: number;
    penalties: Array<{ type: string; amount: number; reason: string }>;
    adjustedScore: number;
  };
}

export interface MappedBlockDebug {
  blockId: string;
  sourceTitle: string;
  heading?: string;
  snippet: string;
  mappingConfidence: MappingConfidence;
  mappedSectionKey?: string;
  primaryBucket?: string;
  primaryCanonicalSection?: string;
  supportCanonicalSections?: string[];
  contributionMode?: "direct" | "support" | "descendant";
  reasoning?: string[];
  sourceType?: string;
  mappingMode?: "automatic" | "manual";
}

export interface CanonicalSectionDebug {
  sectionKey: string;
  title: string;
  contentLength: number;
  mappedBlockCount: number;
  directBlockCount?: number;
  supportBlockCount?: number;
  supportBuckets?: string[];
  mappingConfidence: "high" | "medium" | "low" | "none";
  health: HealthLevel;
  rawScore: number;
  adjustedScore?: number;
  reasons: string[];
  mappedBlocks: MappedBlockDebug[];
}

export interface ParserCoverageDebug {
  totalBlocks: number;
  mappedBlocks: number;
  unmappedBlocks: number;
  coveragePercent: number;
  sectionsWithMappedContent: number;
  emptySections: number;
}

export interface AuditPenaltyDebug {
  type: string;
  label: string;
  amount: number;
  reason: string;
  affectedSections?: string[];
}

export interface AuditAggregationDebug {
  method: string;
  explanation: string;
  rawAverage?: number;
  weightedAverage?: number;
  finalScore: number;
}

export interface AuditDebugInfo {
  canonicalSections: CanonicalSectionDebug[];
  unmappedBlocks: MappedBlockDebug[];
  lowConfidenceBlocks: MappedBlockDebug[];
  parserCoverage: ParserCoverageDebug;
  penalties: AuditPenaltyDebug[];
  aggregation: AuditAggregationDebug;
  overallAuditConfidence: AuditConfidenceLevel;
  notes: string[];
}

export interface AuditResult {
  id: string;
  projectId: string;
  versionId: string;
  createdAt: string;
  overallScore: number;
  readinessSummary: string;
  findings: AuditSectionFinding[];
  parserCoverage?: ParserCoverageSummary;
  confidenceWarning?: string;
  auditConfidence?: AuditConfidenceLevel;
  debugInfo?: AuditDebugInfo;
}

export interface Scorecard {
  id: string;
  projectId: string;
  versionId: string;
  reviewer: string;
  createdAt: string;
  categoryScores: ScorecardCategoryScores;
  weightedTotal: number;
  comments?: string;
}

export interface InsightReport {
  id: string;
  projectId: string;
  versionId: string;
  createdAt: string;
  auditScores: Record<string, number>;
  scorecardScores: Record<string, number>;
  deltas: Record<string, number>;
  summary: string;
  strengths: string[];
  gaps: string[];
  recommendations: string[];
}

export interface IssueItem {
  id: string;
  projectId: string;
  versionId?: string;
  title: string;
  description?: string;
  linkedSection?: string;
  priority: "low" | "medium" | "high" | "critical";
  severity: "low" | "medium" | "high";
  status: "open" | "in_progress" | "blocked" | "resolved" | "closed";
  owner?: string;
  recommendation?: string;
  createdAt: string;
  updatedAt: string;
}

export interface DecisionLogEntry {
  id: string;
  projectId: string;
  title: string;
  decision: string;
  rationale: string;
  createdAt: string;
  createdBy: string;
}

export interface RevisionLogEntry {
  id: string;
  projectId: string;
  versionId: string;
  changeSummary: string;
  createdAt: string;
  author: string;
}

export interface PassHistoryEntry {
  id: string;
  projectId: string;
  versionId: string;
  passType: "audit" | "scorecard" | "insight" | "issues";
  label: string;
  score?: number;
  createdAt: string;
}

export interface ApprovalGate {
  id: string;
  projectId: string;
  gateName: string;
  status: "pending" | "approved" | "rejected";
  owner: string;
  updatedAt: string;
}

export interface ConfidenceItem {
  id: string;
  label: string;
  score: number;
  reason: string;
}

export interface EvidenceCoverageItem {
  id: string;
  sectionKey: string;
  coverage: number;
  note: string;
}

export interface SourceQualityItem {
  id: string;
  sourceId: string;
  qualityScore: number;
  issues: string[];
}

export interface ConflictItem {
  id: string;
  statementA: string;
  statementB: string;
  severity: "low" | "medium" | "high";
  detectedAt: string;
}

export interface AppSnapshot {
  version: number;
  exportedAt: string;
  projects: Project[];
  activeProjectId?: string;
  sourceItems: SourceItem[];
  gddVersions: GDDVersion[];
  auditResults: AuditResult[];
  scorecards: Scorecard[];
  insightReports: InsightReport[];
  issues: IssueItem[];
  decisionLogs: DecisionLogEntry[];
  revisionLogs: RevisionLogEntry[];
  passHistory: PassHistoryEntry[];
  approvalGates: ApprovalGate[];
  confidenceItems: ConfidenceItem[];
  evidenceCoverageItems: EvidenceCoverageItem[];
  sourceQualityItems: SourceQualityItem[];
  conflictItems: ConflictItem[];
}
