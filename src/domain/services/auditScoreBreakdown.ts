import type { AuditConfidenceLevel, AuditResult } from "@/domain/models";

export type AuditScoreBreakdown = {
  overallScore: number;
  strongCount: number;
  mediumCount: number;
  weakCount: number;
  missingCount: number;
  parserCoveragePercent: number;
  contradictionCount: number;
  unsupportedClaimCount: number;
  auditConfidence: AuditConfidenceLevel;
};

export function getAuditScoreBreakdown(audit: AuditResult): AuditScoreBreakdown {
  const strongCount = audit.findings.filter((item) => item.health === "strong").length;
  const mediumCount = audit.findings.filter((item) => item.health === "medium").length;
  const weakCount = audit.findings.filter((item) => item.health === "weak").length;
  const missingCount = audit.findings.filter((item) => item.health === "missing").length;
  const contradictionCount = audit.findings.reduce((sum, item) => sum + item.contradictions.length, 0);
  const unsupportedClaimCount = audit.findings.reduce(
    (sum, item) => sum + item.unsupportedClaims.length,
    0,
  );

  return {
    overallScore: audit.overallScore,
    strongCount,
    mediumCount,
    weakCount,
    missingCount,
    parserCoveragePercent: audit.parserCoverage?.mappedPercent ?? 0,
    contradictionCount,
    unsupportedClaimCount,
    auditConfidence: audit.auditConfidence ?? audit.debugInfo?.overallAuditConfidence ?? "low",
  };
}
