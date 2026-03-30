import { useMemo, useState } from "react";
import { Button } from "@/components/shared/Button";
import { Card } from "@/components/shared/Card";
import type { AuditResult, GDDVersion, Project } from "@/domain/models";
import { createAuditComparisonExport, exportAuditComparisonDocx } from "@/domain/services/exportAuditComparison";
import { buildAuditDebugExport } from "@/domain/services/exportAuditDebug";
import { buildAuditSummaryExport } from "@/domain/services/exportAuditSummary";
import {
  currentDateCompact,
  downloadJson,
  sanitizeFilePart,
} from "@/domain/services/exportHelpers";

type Props = {
  project: Project;
  version: GDDVersion;
  currentAudit: AuditResult;
  audits: AuditResult[];
  versions: GDDVersion[];
  onFeedback: (message: string, tone?: "success" | "error" | "info") => void;
};

export function AuditExportMenu({
  project,
  version,
  currentAudit,
  audits,
  versions,
  onFeedback,
}: Props) {
  const [selectedCompareAuditId, setSelectedCompareAuditId] = useState<string>("");
  const datePart = currentDateCompact();
  const projectPart = sanitizeFilePart(project.name);
  const versionPart = sanitizeFilePart(version.name);

  const compareCandidates = useMemo(
    () =>
      audits
        .filter(
          (audit) =>
            audit.id !== currentAudit.id &&
            audit.projectId === currentAudit.projectId,
        )
        .sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt)),
    [audits, currentAudit.id, currentAudit.projectId],
  );

  const resolvedCompareAudit =
    compareCandidates.find((audit) => audit.id === selectedCompareAuditId) ?? compareCandidates[0];

  const exportSummaryJson = () => {
    const payload = buildAuditSummaryExport(project, version, currentAudit);
    downloadJson(
      `audit-summary-${projectPart}-${versionPart}-${datePart}.json`,
      payload,
    );
    onFeedback("Audit summary JSON exported.", "success");
  };

  const exportDebugJson = () => {
    const payload = buildAuditDebugExport(project, version, currentAudit);
    downloadJson(
      `audit-debug-${projectPart}-${versionPart}-${datePart}.json`,
      payload,
    );
    onFeedback("Audit debug JSON exported.", "success");
  };

  const exportComparisonJson = () => {
    if (!resolvedCompareAudit) {
      onFeedback("No previous audit available for comparison.", "error");
      return;
    }
    const previousVersion = versions.find((item) => item.id === resolvedCompareAudit.versionId);
    const payload = createAuditComparisonExport({
      project,
      previousAudit: resolvedCompareAudit,
      previousVersion,
      currentAudit,
      currentVersion: version,
    });
    downloadJson(
      `audit-comparison-${projectPart}-${sanitizeFilePart(
        previousVersion?.name ?? resolvedCompareAudit.versionId,
      )}-vs-${versionPart}-${datePart}.json`,
      payload,
    );
    onFeedback("Audit comparison JSON exported.", "success");
  };

  const exportComparisonDocx = async () => {
    if (!resolvedCompareAudit) {
      onFeedback("No previous audit available for comparison.", "error");
      return;
    }
    const previousVersion = versions.find((item) => item.id === resolvedCompareAudit.versionId);
    const comparison = createAuditComparisonExport({
      project,
      previousAudit: resolvedCompareAudit,
      previousVersion,
      currentAudit,
      currentVersion: version,
    });
    await exportAuditComparisonDocx({
      comparison,
      filename: `audit-comparison-report-${projectPart}-${datePart}.docx`,
    });
    onFeedback("Audit comparison DOCX exported.", "success");
  };

  return (
    <Card
      title="Audit Export"
      subtitle="Export the current audit for offline review or cross-tool comparison."
    >
      <div className="space-y-3">
        <p className="text-xs text-slate-500">
          Debug export includes mapping, penalties, and aggregation details. Comparison export helps evaluate differences across versions or scoring passes.
        </p>
        <div className="flex flex-wrap gap-2">
          <Button variant="ghost" onClick={exportSummaryJson}>
            Export Summary JSON
          </Button>
          <Button variant="ghost" onClick={exportDebugJson}>
            Export Debug JSON
          </Button>
          <Button variant="ghost" onClick={exportComparisonJson} disabled={!resolvedCompareAudit}>
            Export Comparison JSON
          </Button>
          <Button onClick={exportComparisonDocx} disabled={!resolvedCompareAudit}>
            Export Comparison DOCX
          </Button>
        </div>
        <div className="max-w-xl">
          <label className="mb-1 block text-xs font-medium text-slate-600">Comparison target</label>
          <select
            className="h-10 w-full rounded-lg border border-slate-300 px-3 text-sm"
            value={resolvedCompareAudit?.id ?? ""}
            onChange={(event) => setSelectedCompareAuditId(event.target.value)}
            disabled={compareCandidates.length === 0}
          >
            {compareCandidates.length === 0 ? (
              <option value="">No previous audit available</option>
            ) : (
              compareCandidates.map((audit) => {
                const candidateVersion = versions.find((item) => item.id === audit.versionId);
                return (
                  <option key={audit.id} value={audit.id}>
                    {candidateVersion?.name ?? audit.versionId} | {new Date(audit.createdAt).toLocaleString()}
                  </option>
                );
              })
            )}
          </select>
        </div>
      </div>
    </Card>
  );
}
