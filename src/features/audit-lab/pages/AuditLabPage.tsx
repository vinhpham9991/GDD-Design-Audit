import { useMemo, useState } from "react";
import { PageContainer } from "@/components/layout/PageContainer";
import { Badge } from "@/components/shared/Badge";
import { Button } from "@/components/shared/Button";
import { Card } from "@/components/shared/Card";
import { EmptyState } from "@/components/shared/EmptyState";
import { HelpTooltip } from "@/components/shared/HelpTooltip";
import { runAuditForVersion } from "@/domain/services/auditService";
import { AuditDebugPanel } from "@/features/audit-lab/components/AuditDebugPanel";
import { AuditExportMenu } from "@/features/audit-lab/components/AuditExportMenu";
import { ScoreBreakdownPanel } from "@/features/audit-lab/components/ScoreBreakdownPanel";
import { getHelpContent } from "@/features/help/content";
import { useSyncedVersionSelection } from "@/hooks/useSyncedVersionSelection";
import { useI18n } from "@/hooks/useI18n";
import { useAppStore } from "@/store";

export function AuditLabPage() {
  const { language, t } = useI18n();
  const help = getHelpContent(language);
  const activeProjectId = useAppStore((state) => state.activeProjectId);
  const projects = useAppStore((state) => state.projects);
  const gddVersions = useAppStore((state) => state.gddVersions);
  const sourceItems = useAppStore((state) => state.sourceItems);
  const audits = useAppStore((state) => state.auditResults);
  const saveAuditResult = useAppStore((state) => state.saveAuditResult);
  const addRevisionLog = useAppStore((state) => state.addRevisionLog);
  const addPassHistory = useAppStore((state) => state.addPassHistory);
  const pushToast = useAppStore((state) => state.pushToast);

  const project = projects.find((item) => item.id === activeProjectId) ?? projects[0];
  const versions = useMemo(
    () => gddVersions.filter((version) => version.projectId === project?.id),
    [gddVersions, project?.id],
  );
  const scopedSources = useMemo(
    () => sourceItems.filter((source) => !source.projectId || source.projectId === project?.id),
    [project?.id, sourceItems],
  );
  const [selectedVersionId, setSelectedVersionId] = useSyncedVersionSelection(
    versions,
    project?.currentVersionId,
  );
  const [selectedFindingKey, setSelectedFindingKey] = useState<string | undefined>();
  const [showDebug, setShowDebug] = useState(false);

  const selectedVersion = versions.find((version) => version.id === selectedVersionId) ?? versions[0];
  const latestAudit = audits.find((audit) => audit.versionId === selectedVersion?.id);
  const selectedFinding = latestAudit?.findings.find((item) => item.sectionKey === selectedFindingKey);
  const selectedFindingDebug = latestAudit?.debugInfo?.canonicalSections.find(
    (item) => item.sectionKey === selectedFinding?.sectionKey,
  );

  const runAudit = () => {
    if (!project || !selectedVersion) {
      pushToast("Select a GDD version before running audit.", "error");
      return;
    }
    const result = runAuditForVersion(project.id, selectedVersion, scopedSources);
    saveAuditResult(result);
    addPassHistory({
      id: `pass_${crypto.randomUUID()}`,
      projectId: project.id,
      versionId: selectedVersion.id,
      passType: "audit",
      label: `Audit pass for ${selectedVersion.name}`,
      score: result.overallScore,
      createdAt: result.createdAt,
    });
    addRevisionLog({
      id: `revision_${crypto.randomUUID()}`,
      projectId: project.id,
      versionId: selectedVersion.id,
      changeSummary: `Ran audit for ${selectedVersion.name} (score ${result.overallScore}).`,
      createdAt: result.createdAt,
      author: "System",
    });
    pushToast("Audit completed.", "success");
    setSelectedFindingKey(result.findings[0]?.sectionKey);
  };

  return (
    <PageContainer
      title={t.pages.auditLab}
      description="Evaluate document quality while accounting for parser and mapping coverage."
    >
      <Card title="Audit Controls">
        <div className="flex flex-wrap items-center gap-3">
          <select
            className="h-10 rounded-lg border border-slate-300 px-3 text-sm"
            value={selectedVersion?.id ?? ""}
            onChange={(event) => setSelectedVersionId(event.target.value)}
          >
            {versions.map((version) => (
              <option key={version.id} value={version.id}>
                {version.name}
              </option>
            ))}
          </select>
          <Button onClick={runAudit} disabled={!selectedVersion}>
            Run Audit
          </Button>
          <Button variant="ghost" onClick={() => setShowDebug((prev) => !prev)} disabled={!latestAudit}>
            {showDebug ? "Hide Audit Debug" : "Show Audit Debug"}
          </Button>
        </div>
        <p className="mt-2 text-xs text-slate-500">
          Audit Debug helps explain how the current score was derived.
        </p>
      </Card>

      {!latestAudit ? (
        <EmptyState title="No audit results" description="Run audit on a GDD version to generate findings." />
      ) : (
        <>
          <ScoreBreakdownPanel audit={latestAudit} />
          <AuditExportMenu
            project={project}
            version={selectedVersion ?? versions[0]!}
            currentAudit={latestAudit}
            audits={audits}
            versions={versions}
            onFeedback={pushToast}
          />

          <div className="grid gap-4 md:grid-cols-4">
            <Card
              title={(
                <span className="inline-flex items-center gap-2">
                  Overall Score <HelpTooltip text={help.tooltips.auditScore} />
                </span>
              )}
              subtitle={help.sectionDescriptions.latestAudit}
            >
              <p className="text-3xl font-semibold text-slate-900">{latestAudit.overallScore}</p>
            </Card>
            <Card title="Weak or Missing">
              <p className="text-3xl font-semibold text-slate-900">
                {
                  latestAudit.findings.filter((item) => item.health === "weak" || item.health === "missing")
                    .length
                }
              </p>
            </Card>
            <Card title="Readiness Summary">
              <p className="text-sm text-slate-700">{latestAudit.readinessSummary}</p>
            </Card>
            <Card title="Parser Coverage">
              <p className="text-3xl font-semibold text-slate-900">
                {latestAudit.parserCoverage?.mappedPercent ?? 0}%
              </p>
              <p className="mt-1 text-xs text-slate-600">
                {latestAudit.parserCoverage?.mappedBlocks ?? 0}/{latestAudit.parserCoverage?.totalBlocks ?? 0} blocks mapped
              </p>
            </Card>
          </div>

          {latestAudit.confidenceWarning && (
            <div className="rounded-lg border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900">
              Low parser coverage can reduce audit confidence. {latestAudit.confidenceWarning}
            </div>
          )}

          <div className="grid gap-4 xl:grid-cols-12">
            <Card title="Section Findings" className="xl:col-span-8">
              <div className="space-y-2">
                {latestAudit.findings.map((finding) => (
                  <button
                    key={finding.sectionKey}
                    className="w-full rounded-lg border border-slate-200 p-3 text-left"
                    type="button"
                    onClick={() => setSelectedFindingKey(finding.sectionKey)}
                  >
                    <div className="flex items-center justify-between">
                      <p className="font-medium text-slate-900">{finding.sectionKey}</p>
                      <Badge
                        tone={
                          finding.health === "strong"
                            ? "good"
                            : finding.health === "weak" || finding.health === "missing"
                              ? "danger"
                              : "warn"
                        }
                      >
                        {finding.health}
                      </Badge>
                    </div>
                    <p className="mt-1 text-sm text-slate-600">Score: {finding.score}</p>
                    {finding.gaps[0] && <p className="mt-1 text-sm text-slate-500">{finding.gaps[0]}</p>}
                  </button>
                ))}
              </div>
            </Card>
            <Card title="Rewrite Brief" className="xl:col-span-4">
              {!selectedFinding ? (
                <EmptyState title="No section selected" description="Choose a finding to inspect rewrite guidance." />
              ) : (
                <div className="space-y-3 text-sm text-slate-700">
                  <p className="font-semibold text-slate-900">{selectedFinding.sectionKey}</p>
                  <p>{selectedFinding.rewriteBrief ?? "No rewrite required for this section."}</p>
                  {selectedFinding.scoreBreakdown && (
                    <div className="rounded-lg border border-slate-200 bg-slate-50 p-2 text-xs">
                      <p className="font-semibold text-slate-900">Section Score Breakdown</p>
                      <p>Base: {selectedFinding.scoreBreakdown.baseScore}</p>
                      <p>Detail: {selectedFinding.scoreBreakdown.detailScore}</p>
                      <p>
                        Penalties:{" "}
                        {selectedFinding.scoreBreakdown.penalties.reduce(
                          (sum, penalty) => sum + penalty.amount,
                          0,
                        )}
                      </p>
                      <p>Final: {selectedFinding.scoreBreakdown.adjustedScore}</p>
                    </div>
                  )}
                  {selectedFinding.unsupportedClaims.length > 0 && (
                    <p>Unsupported claims: {selectedFinding.unsupportedClaims.length}</p>
                  )}
                  {selectedFinding.contradictions.length > 0 && (
                    <p>Contradictions: {selectedFinding.contradictions.length}</p>
                  )}
                  {selectedFindingDebug && (
                    <div className="rounded-lg border border-slate-200 p-2">
                      <p className="text-xs font-semibold text-slate-900">
                        Contributing Source Blocks ({selectedFindingDebug.mappedBlocks.length})
                      </p>
                      {selectedFindingDebug.mappedBlocks.length === 0 ? (
                        <p className="mt-1 text-xs text-slate-500">
                          No mapped blocks. This may indicate parser/mapping uncertainty.
                        </p>
                      ) : (
                        <ul className="mt-1 space-y-1 text-xs text-slate-700">
                          {selectedFindingDebug.mappedBlocks.slice(0, 6).map((block) => (
                            <li key={block.blockId}>
                              {block.sourceTitle} - {block.heading || "Untitled"} ({block.mappingConfidence})
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  )}
                </div>
              )}
            </Card>
          </div>

          {showDebug && <AuditDebugPanel audit={latestAudit} />}
        </>
      )}
    </PageContainer>
  );
}
