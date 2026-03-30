import type { AuditResult, InsightReport, IssueItem } from "@/domain/models";

export function generateIssuesFromFindings(
  projectId: string,
  versionId: string,
  audit?: AuditResult,
  insight?: InsightReport,
): IssueItem[] {
  const now = new Date().toISOString();
  const issues: IssueItem[] = [];

  if (audit) {
    audit.findings.forEach((finding) => {
      if (finding.health === "weak" || finding.health === "missing") {
        issues.push({
          id: `issue_${crypto.randomUUID()}`,
          projectId,
          versionId,
          title: `Rewrite needed: ${finding.sectionKey}`,
          description: finding.gaps.join(" ") || "Section requires substantive rewrite.",
          linkedSection: finding.sectionKey,
          priority: finding.health === "missing" ? "critical" : "high",
          severity: "high",
          status: "open",
          recommendation: finding.rewriteBrief,
          createdAt: now,
          updatedAt: now,
        });
      }

      if (finding.contradictions.length > 0) {
        issues.push({
          id: `issue_${crypto.randomUUID()}`,
          projectId,
          versionId,
          title: `Resolve contradictions in ${finding.sectionKey}`,
          description: finding.contradictions.join(" "),
          linkedSection: finding.sectionKey,
          priority: "high",
          severity: "medium",
          status: "open",
          recommendation: "Reconcile contradictory claims and update dependent sections.",
          createdAt: now,
          updatedAt: now,
        });
      }
    });
  }

  if (insight) {
    Object.entries(insight.deltas).forEach(([key, delta]) => {
      if (Math.abs(delta) < 20) {
        return;
      }

      issues.push({
        id: `issue_${crypto.randomUUID()}`,
        projectId,
        versionId,
        title: `Alignment gap: ${key}`,
        description: `Audit and scorecard delta is ${delta}. Review intent vs documented evidence.`,
        linkedSection: key,
        priority: "medium",
        severity: "medium",
        status: "open",
        recommendation: "Run review and update GDD or scoring rationale to close mismatch.",
        createdAt: now,
        updatedAt: now,
      });
    });
  }

  const unique = new Map<string, IssueItem>();
  issues.forEach((item) => {
    const key = `${item.title}|${item.linkedSection ?? ""}`;
    if (!unique.has(key)) unique.set(key, item);
  });

  return Array.from(unique.values());
}
