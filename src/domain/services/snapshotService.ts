import { z } from "zod";
import type { AppSnapshot } from "@/domain/models";
import { SOURCE_TYPES } from "@/domain/models/constants";
import type { AppStore } from "@/store/types";

export const SNAPSHOT_VERSION = 1;

const isoString = z.string().min(1);
const idString = z.string().min(1);

const projectSchema = z.object({
  id: idString,
  name: z.string().min(1),
  createdAt: isoString,
  updatedAt: isoString,
  currentVersionId: z.string().optional(),
});

const sourceSchema = z.object({
  id: idString,
  projectId: z.string().optional(),
  title: z.string().min(1),
  type: z.enum(SOURCE_TYPES),
  content: z.string().optional(),
  url: z.string().optional(),
  reliability: z.enum(["high", "medium", "low", "fragile"]).optional(),
  tags: z.array(z.string()).optional(),
  parsedDocument: z
    .object({
      title: z.string().optional(),
      rawText: z.string(),
      elements: z.array(
        z.union([
          z.object({ type: z.literal("paragraph"), text: z.string() }),
          z.object({
            type: z.literal("heading"),
            text: z.string(),
            normalizedText: z.string().optional(),
            level: z.number().optional(),
          }),
          z.object({
            type: z.literal("table"),
            rows: z.array(z.array(z.string())),
            flattenedText: z.string(),
          }),
          z.object({
            type: z.literal("bullet_list"),
            items: z.array(z.string()),
            flattenedText: z.string(),
          }),
          z.object({
            type: z.literal("numbered_list"),
            items: z.array(z.string()),
            flattenedText: z.string(),
          }),
          z.object({
            type: z.literal("appendix"),
            heading: z.string().optional(),
            text: z.string(),
          }),
          z.object({ type: z.literal("unknown"), text: z.string() }),
        ]),
      ).optional(),
      blocks: z.array(
        z.object({
          id: idString,
          heading: z.string().optional(),
          normalizedHeading: z.string().optional(),
          level: z.number().optional(),
          content: z.string(),
          sourceRange: z.string().optional(),
          mappedSectionKey: z.string().optional(),
          mappedBucket: z.string().optional(),
          primaryBucket: z.string().optional(),
          primaryCanonicalSection: z.string().optional(),
          supportCanonicalSections: z.array(z.string()).optional(),
          bucketCategory: z.enum(["canonical", "non_canonical", "unknown"]).optional(),
          mappingConfidence: z.enum(["high", "medium", "low", "unmapped"]).optional(),
          contentParts: z.array(z.unknown()).optional(),
          sourceTypeHints: z.array(z.string()).optional(),
          isAppendix: z.boolean().optional(),
          appendixLabel: z.string().optional(),
          isDocumentFraming: z.boolean().optional(),
          notes: z.array(z.string()).optional(),
          mappingReasons: z.array(z.string()).optional(),
          ownershipReason: z.string().optional(),
          ownershipHeading: z.string().optional(),
          manualMapping: z.boolean().optional(),
        }),
      ),
      appendixBlocks: z
        .array(
          z.object({
            id: idString,
            heading: z.string().optional(),
            normalizedHeading: z.string().optional(),
            level: z.number().optional(),
            content: z.string(),
            sourceRange: z.string().optional(),
            mappedSectionKey: z.string().optional(),
            mappedBucket: z.string().optional(),
            primaryBucket: z.string().optional(),
            primaryCanonicalSection: z.string().optional(),
            supportCanonicalSections: z.array(z.string()).optional(),
            bucketCategory: z.enum(["canonical", "non_canonical", "unknown"]).optional(),
            mappingConfidence: z.enum(["high", "medium", "low", "unmapped"]).optional(),
            contentParts: z.array(z.unknown()).optional(),
            sourceTypeHints: z.array(z.string()).optional(),
            isAppendix: z.boolean().optional(),
            appendixLabel: z.string().optional(),
            isDocumentFraming: z.boolean().optional(),
            notes: z.array(z.string()).optional(),
            mappingReasons: z.array(z.string()).optional(),
            ownershipReason: z.string().optional(),
            ownershipHeading: z.string().optional(),
            manualMapping: z.boolean().optional(),
          }),
        )
        .optional(),
      unmappedBlocks: z
        .array(
          z.object({
            id: idString,
            heading: z.string().optional(),
            normalizedHeading: z.string().optional(),
            level: z.number().optional(),
            content: z.string(),
            sourceRange: z.string().optional(),
            mappedSectionKey: z.string().optional(),
            mappedBucket: z.string().optional(),
            primaryBucket: z.string().optional(),
            primaryCanonicalSection: z.string().optional(),
            supportCanonicalSections: z.array(z.string()).optional(),
            bucketCategory: z.enum(["canonical", "non_canonical", "unknown"]).optional(),
            mappingConfidence: z.enum(["high", "medium", "low", "unmapped"]).optional(),
            contentParts: z.array(z.unknown()).optional(),
            sourceTypeHints: z.array(z.string()).optional(),
            isAppendix: z.boolean().optional(),
            appendixLabel: z.string().optional(),
            isDocumentFraming: z.boolean().optional(),
            notes: z.array(z.string()).optional(),
            mappingReasons: z.array(z.string()).optional(),
            ownershipReason: z.string().optional(),
            ownershipHeading: z.string().optional(),
            manualMapping: z.boolean().optional(),
          }),
        )
        .optional(),
      diagnostics: z
        .object({
          totalElements: z.number(),
          totalBlocks: z.number(),
          headingCount: z.number(),
          tableCount: z.number(),
          bulletListCount: z.number(),
          numberedListCount: z.number(),
          appendixCount: z.number(),
          emptyBlockCount: z.number(),
          canonicalMappedCount: z.number().optional(),
          nonCanonicalMappedCount: z.number().optional(),
          unknownUnmappedCount: z.number().optional(),
          tableContainingBlocks: z.number().optional(),
          bulletContainingBlocks: z.number().optional(),
          numberedContainingBlocks: z.number().optional(),
          appendixBlocks: z.number().optional(),
          documentFramingBlocks: z.number().optional(),
        })
        .optional(),
    })
    .optional(),
  createdAt: isoString,
  updatedAt: isoString,
});

const gddVersionSchema = z.object({
  id: idString,
  projectId: idString,
  name: z.string().min(1),
  createdAt: isoString,
  sections: z.array(
    z.object({
      id: idString,
      key: z.string().min(1),
      title: z.string().min(1),
      content: z.string(),
      status: z.string().optional(),
    }),
  ),
  summary: z.string().optional(),
  sectionBuildMeta: z
    .record(
      z.string(),
      z.object({
        blockCount: z.number(),
        mappedContentLength: z.number(),
        confidenceSummary: z.enum(["high", "medium", "low", "unmapped"]),
        directContributorCount: z.number().optional(),
        supportContributorCount: z.number().optional(),
        descendantContributorCount: z.number().optional(),
      }),
    )
    .optional(),
  unmappedBlocks: z
    .array(
      z.object({
        id: idString,
        heading: z.string().optional(),
        normalizedHeading: z.string().optional(),
        level: z.number().optional(),
        content: z.string(),
        sourceRange: z.string().optional(),
        mappedSectionKey: z.string().optional(),
        mappingConfidence: z.enum(["high", "medium", "low", "unmapped"]).optional(),
      }),
    )
    .optional(),
  parserCoverage: z
    .object({
      totalBlocks: z.number(),
      mappedBlocks: z.number(),
      unmappedBlocks: z.number(),
      mappedPercent: z.number(),
      sourceBackedSections: z.number(),
      emptySections: z.number(),
      lowConfidenceBlocks: z.number(),
    })
    .optional(),
  materializationDebug: z
    .object({
      totalCanonicalSections: z.number(),
      populatedSections: z.number(),
      emptySections: z.number(),
      notes: z.array(z.string()),
      sections: z.array(
        z.object({
          sectionKey: z.string(),
          title: z.string(),
          totalChars: z.number(),
          totalBlocks: z.number(),
          confidence: z.enum(["high", "medium", "low", "empty"]),
          directContributors: z.array(z.unknown()),
          supportContributors: z.array(z.unknown()),
          descendantContributors: z.array(z.unknown()),
          rejectedCandidates: z.array(z.unknown()),
          notes: z.array(z.string()),
        }),
      ),
    })
    .optional(),
});

const auditSchema = z.object({
  id: idString,
  projectId: idString,
  versionId: idString,
  createdAt: isoString,
  overallScore: z.number(),
  readinessSummary: z.string(),
  findings: z.array(z.unknown()),
  parserCoverage: z
    .object({
      totalBlocks: z.number(),
      mappedBlocks: z.number(),
      unmappedBlocks: z.number(),
      mappedPercent: z.number(),
      sourceBackedSections: z.number(),
      emptySections: z.number(),
      lowConfidenceBlocks: z.number(),
    })
    .optional(),
  confidenceWarning: z.string().optional(),
  auditConfidence: z.enum(["high", "medium", "low"]).optional(),
  debugInfo: z.unknown().optional(),
});

const scorecardSchema = z.object({
  id: idString,
  projectId: idString,
  versionId: idString,
  reviewer: z.string().min(1),
  createdAt: isoString,
  categoryScores: z.record(z.string(), z.number()),
  weightedTotal: z.number(),
});

const insightSchema = z.object({
  id: idString,
  projectId: idString,
  versionId: idString,
  createdAt: isoString,
  auditScores: z.record(z.string(), z.number()),
  scorecardScores: z.record(z.string(), z.number()),
  deltas: z.record(z.string(), z.number()),
  summary: z.string(),
  strengths: z.array(z.string()),
  gaps: z.array(z.string()),
  recommendations: z.array(z.string()),
});

const issueSchema = z.object({
  id: idString,
  projectId: idString,
  title: z.string().min(1),
  priority: z.enum(["low", "medium", "high", "critical"]),
  severity: z.enum(["low", "medium", "high"]),
  status: z.enum(["open", "in_progress", "blocked", "resolved", "closed"]),
  createdAt: isoString,
  updatedAt: isoString,
});

const decisionSchema = z.object({
  id: idString,
  projectId: idString,
  title: z.string().min(1),
  decision: z.string().min(1),
  rationale: z.string(),
  createdAt: isoString,
  createdBy: z.string(),
});

const revisionSchema = z.object({
  id: idString,
  projectId: idString,
  versionId: z.string(),
  changeSummary: z.string().min(1),
  createdAt: isoString,
  author: z.string(),
});

const passHistorySchema = z.object({
  id: idString,
  projectId: idString,
  versionId: z.string(),
  passType: z.enum(["audit", "scorecard", "insight", "issues"]),
  label: z.string().min(1),
  score: z.number().optional(),
  createdAt: isoString,
});

const approvalGateSchema = z.object({
  id: idString,
  projectId: idString,
  gateName: z.string().min(1),
  status: z.enum(["pending", "approved", "rejected"]),
  owner: z.string().min(1),
  updatedAt: isoString,
});

const confidenceSchema = z.object({
  id: idString,
  label: z.string().min(1),
  score: z.number(),
  reason: z.string(),
});

const evidenceCoverageSchema = z.object({
  id: idString,
  sectionKey: z.string().min(1),
  coverage: z.number(),
  note: z.string(),
});

const sourceQualitySchema = z.object({
  id: idString,
  sourceId: idString,
  qualityScore: z.number(),
  issues: z.array(z.string()),
});

const conflictSchema = z.object({
  id: idString,
  statementA: z.string().min(1),
  statementB: z.string().min(1),
  severity: z.enum(["low", "medium", "high"]),
  detectedAt: isoString,
});

const snapshotSchema = z.object({
  version: z.number(),
  exportedAt: isoString,
  projects: z.array(projectSchema),
  activeProjectId: z.string().optional(),
  sourceItems: z.array(sourceSchema),
  gddVersions: z.array(gddVersionSchema),
  auditResults: z.array(auditSchema),
  scorecards: z.array(scorecardSchema),
  insightReports: z.array(insightSchema),
  issues: z.array(issueSchema),
  decisionLogs: z.array(decisionSchema),
  revisionLogs: z.array(revisionSchema),
  passHistory: z.array(passHistorySchema).optional(),
  approvalGates: z.array(approvalGateSchema),
  confidenceItems: z.array(confidenceSchema),
  evidenceCoverageItems: z.array(evidenceCoverageSchema),
  sourceQualityItems: z.array(sourceQualitySchema),
  conflictItems: z.array(conflictSchema),
});

export function createSnapshotFromStore(state: AppStore): AppSnapshot {
  return {
    version: SNAPSHOT_VERSION,
    exportedAt: new Date().toISOString(),
    projects: state.projects,
    activeProjectId: state.activeProjectId,
    sourceItems: state.sourceItems,
    gddVersions: state.gddVersions,
    auditResults: state.auditResults,
    scorecards: state.scorecards,
    insightReports: state.insightReports,
    issues: state.issues,
    decisionLogs: state.decisionLogs,
    revisionLogs: state.revisionLogs,
    passHistory: state.passHistory,
    approvalGates: state.approvalGates,
    confidenceItems: state.confidenceItems,
    evidenceCoverageItems: state.evidenceCoverageItems,
    sourceQualityItems: state.sourceQualityItems,
    conflictItems: state.conflictItems,
  };
}

export function createEmptySnapshot(): AppSnapshot {
  return {
    version: SNAPSHOT_VERSION,
    exportedAt: new Date().toISOString(),
    projects: [],
    activeProjectId: undefined,
    sourceItems: [],
    gddVersions: [],
    auditResults: [],
    scorecards: [],
    insightReports: [],
    issues: [],
    decisionLogs: [],
    revisionLogs: [],
    passHistory: [],
    approvalGates: [],
    confidenceItems: [],
    evidenceCoverageItems: [],
    sourceQualityItems: [],
    conflictItems: [],
  };
}

export function serializeSnapshot(snapshot: AppSnapshot): string {
  return JSON.stringify(snapshot, null, 2);
}

export function parseSnapshotJson(raw: string): AppSnapshot {
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    throw new Error("Malformed JSON file.");
  }

  const result = snapshotSchema.safeParse(parsed);
  if (!result.success) {
    throw new Error("Invalid snapshot structure.");
  }

  return {
    ...(result.data as AppSnapshot),
    passHistory: result.data.passHistory ?? [],
  };
}

export function downloadJsonFile(filename: string, content: string) {
  const blob = new Blob([content], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

