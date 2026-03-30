import type { AuditResult, GDDVersion, Project } from "@/domain/models";

export function buildAuditDebugExport(project: Project, version: GDDVersion, audit: AuditResult) {
  return {
    project: {
      id: project.id,
      name: project.name,
    },
    version: {
      id: version.id,
      name: version.name,
    },
    audit: {
      id: audit.id,
      createdAt: audit.createdAt,
      overallScore: audit.overallScore,
      auditConfidence: audit.auditConfidence ?? "low",
    },
    debug: audit.debugInfo ?? null,
  };
}
