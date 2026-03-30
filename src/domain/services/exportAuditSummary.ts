import { GDD_SECTION_TEMPLATES } from "@/domain/models/constants";
import type { AuditResult, GDDVersion, Project } from "@/domain/models";

export type AuditExportFinding = {
  sectionKey: string;
  title: string;
  health: "strong" | "medium" | "weak" | "missing";
  score: number;
  rewriteBrief?: string;
  contradictions: string[];
  unsupportedClaims: string[];
  gaps: string[];
  reasons?: string[];
};

export type AuditExportSummary = {
  project: {
    id: string;
    name: string;
    status?: string;
  };
  version: {
    id: string;
    name: string;
    createdAt: string;
  };
  audit: {
    id: string;
    createdAt: string;
    overallScore: number;
    readinessSummary: string;
    auditConfidence: "high" | "medium" | "low";
    aggregationMethod: string;
  };
  healthCounts: {
    strong: number;
    medium: number;
    weak: number;
    missing: number;
  };
  parserCoverage: {
    totalBlocks: number;
    mappedBlocks: number;
    unmappedBlocks: number;
    coveragePercent: number;
  };
  findings: AuditExportFinding[];
  notes: string[];
};

export function buildAuditSummaryExport(
  project: Project,
  version: GDDVersion,
  audit: AuditResult,
): AuditExportSummary {
  const healthCounts = {
    strong: audit.findings.filter((item) => item.health === "strong").length,
    medium: audit.findings.filter((item) => item.health === "medium").length,
    weak: audit.findings.filter((item) => item.health === "weak").length,
    missing: audit.findings.filter((item) => item.health === "missing").length,
  };

  const findings: AuditExportFinding[] = audit.findings.map((finding) => ({
    sectionKey: finding.sectionKey,
    title:
      GDD_SECTION_TEMPLATES.find((section) => section.key === finding.sectionKey)?.title ??
      finding.sectionKey,
    health: finding.health,
    score: finding.score,
    rewriteBrief: finding.rewriteBrief,
    contradictions: finding.contradictions,
    unsupportedClaims: finding.unsupportedClaims,
    gaps: finding.gaps,
    reasons:
      audit.debugInfo?.canonicalSections.find((section) => section.sectionKey === finding.sectionKey)
        ?.reasons ?? [],
  }));

  return {
    project: {
      id: project.id,
      name: project.name,
      status: project.status,
    },
    version: {
      id: version.id,
      name: version.name,
      createdAt: version.createdAt,
    },
    audit: {
      id: audit.id,
      createdAt: audit.createdAt,
      overallScore: audit.overallScore,
      readinessSummary: audit.readinessSummary,
      auditConfidence: audit.auditConfidence ?? "low",
      aggregationMethod: audit.debugInfo?.aggregation.method ?? "Calibrated weighted aggregation",
    },
    healthCounts,
    parserCoverage: {
      totalBlocks: audit.parserCoverage?.totalBlocks ?? 0,
      mappedBlocks: audit.parserCoverage?.mappedBlocks ?? 0,
      unmappedBlocks: audit.parserCoverage?.unmappedBlocks ?? 0,
      coveragePercent: audit.parserCoverage?.mappedPercent ?? 0,
    },
    findings,
    notes: audit.debugInfo?.notes ?? [],
  };
}
