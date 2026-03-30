import type {
  ApprovalGate,
  AuditResult,
  ConfidenceItem,
  ConflictItem,
  EvidenceCoverageItem,
  InsightReport,
  IssueItem,
  PassHistoryEntry,
  SourceItem,
  SourceQualityItem,
} from "@/domain/models";

export interface GovernanceDerivationInput {
  projectId: string;
  versionId: string;
  sources: SourceItem[];
  audits: AuditResult[];
  insights: InsightReport[];
  issues: IssueItem[];
}

export function deriveGovernanceSummaries(input: GovernanceDerivationInput) {
  const audit = input.audits.find((item) => item.versionId === input.versionId);
  const insight = input.insights.find((item) => item.versionId === input.versionId);
  const scopedIssues = input.issues.filter((item) => item.projectId === input.projectId);

  const criticalOpen = scopedIssues.filter(
    (item) => item.priority === "critical" && item.status !== "resolved" && item.status !== "closed",
  ).length;

  const approvalGates: ApprovalGate[] = [
    {
      id: `gate_design_${input.versionId}`,
      projectId: input.projectId,
      gateName: "Design Quality Gate",
      status:
        (audit?.overallScore ?? 0) >= 75
          ? criticalOpen > 0
            ? "pending"
            : "approved"
          : "rejected",
      owner: "Design Director",
      updatedAt: new Date().toISOString(),
    },
    {
      id: `gate_readiness_${input.versionId}`,
      projectId: input.projectId,
      gateName: "Readiness Gate",
      status:
        (audit?.overallScore ?? 0) >= 70 && criticalOpen === 0
          ? "approved"
          : (audit?.overallScore ?? 0) >= 60
            ? "pending"
            : "rejected",
      owner: "Producer",
      updatedAt: new Date().toISOString(),
    },
  ];

  const confidenceItems: ConfidenceItem[] = [
    {
      id: `conf_doc_${input.versionId}`,
      label: "Document Confidence",
      score: audit?.overallScore ?? 0,
      reason: "Derived from audit section health and evidence checks.",
    },
    {
      id: `conf_alignment_${input.versionId}`,
      label: "Audit/Scorecard Alignment",
      score:
        insight
          ? Math.max(
              0,
              100 -
                Math.round(
                  Object.values(insight.deltas).reduce((sum, delta) => sum + Math.abs(delta), 0) /
                    Math.max(1, Object.keys(insight.deltas).length),
                ),
            )
          : 0,
      reason: "Higher score means smaller audit/scorecard deltas.",
    },
  ];

  const byReliability = {
    high: 0,
    medium: 0,
    low: 0,
    fragile: 0,
  };

  input.sources.forEach((source) => {
    const reliability = source.reliability ?? "low";
    byReliability[reliability] += 1;
  });

  const sourceQualityItems: SourceQualityItem[] = input.sources.map((source) => ({
    id: `sq_${source.id}`,
    sourceId: source.id,
    qualityScore:
      source.reliability === "high" ? 90 : source.reliability === "medium" ? 70 : source.reliability === "low" ? 50 : 35,
    issues:
      source.reliability === "high"
        ? []
        : ["Consider adding stronger evidence or corroboration for this source."],
  }));

  const evidenceCoverageItems: EvidenceCoverageItem[] = audit
    ? audit.findings.map((finding) => {
        const coverage = Math.max(0, 100 - finding.gaps.length * 20 - finding.unsupportedClaims.length * 15);
        return {
          id: `cov_${finding.sectionKey}_${input.versionId}`,
          sectionKey: finding.sectionKey,
          coverage,
          note:
            coverage >= 75
              ? "Evidence coverage is healthy."
              : "Coverage is weak; add stronger and more diverse references.",
        };
      })
    : [];

  const conflictItems: ConflictItem[] =
    audit?.findings
      .flatMap((finding) =>
        finding.contradictions.map((contradiction, index) => ({
          id: `conflict_${finding.sectionKey}_${index}_${input.versionId}`,
          statementA: contradiction,
          statementB: `Review against neighboring section assumptions for ${finding.sectionKey}.`,
          severity: "medium" as const,
          detectedAt: new Date().toISOString(),
        })),
      )
      .slice(0, 20) ?? [];

  return {
    approvalGates,
    confidenceItems,
    evidenceCoverageItems,
    sourceQualityItems,
    conflictItems,
    sourceReliabilityMix: byReliability,
  };
}

export function buildPassComparisonSummary(passHistory: PassHistoryEntry[]) {
  const latest = passHistory.slice().sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  const [current, previous] = latest;

  return {
    current,
    previous,
    summary:
      current && previous
        ? `${current.label} compared with ${previous.label}. Score delta: ${(current.score ?? 0) - (previous.score ?? 0)}.`
        : "Not enough pass history yet. Run more passes to unlock comparisons.",
  };
}
