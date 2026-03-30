import { useMemo, useState } from "react";
import { PageContainer } from "@/components/layout/PageContainer";
import { Badge } from "@/components/shared/Badge";
import { Button } from "@/components/shared/Button";
import { Card } from "@/components/shared/Card";
import { EmptyState } from "@/components/shared/EmptyState";
import { HelpTooltip } from "@/components/shared/HelpTooltip";
import { Input } from "@/components/shared/Input";
import { Textarea } from "@/components/shared/Textarea";
import { buildPassComparisonSummary, deriveGovernanceSummaries } from "@/domain/services/governanceService";
import { getHelpContent } from "@/features/help/content";
import { useI18n } from "@/hooks/useI18n";
import { useAppStore } from "@/store";

export function GovernancePage() {
  const { language, t } = useI18n();
  const help = getHelpContent(language);
  const projects = useAppStore((state) => state.projects);
  const activeProjectId = useAppStore((state) => state.activeProjectId);
  const sourceItems = useAppStore((state) => state.sourceItems);
  const audits = useAppStore((state) => state.auditResults);
  const insights = useAppStore((state) => state.insightReports);
  const issues = useAppStore((state) => state.issues);
  const decisionLogs = useAppStore((state) => state.decisionLogs);
  const revisionLogs = useAppStore((state) => state.revisionLogs);
  const passHistory = useAppStore((state) => state.passHistory);
  const approvalGates = useAppStore((state) => state.approvalGates);
  const confidenceItems = useAppStore((state) => state.confidenceItems);
  const evidenceCoverageItems = useAppStore((state) => state.evidenceCoverageItems);
  const sourceQualityItems = useAppStore((state) => state.sourceQualityItems);
  const conflictItems = useAppStore((state) => state.conflictItems);
  const addDecisionLog = useAppStore((state) => state.addDecisionLog);
  const setGovernanceSummaries = useAppStore((state) => state.setGovernanceSummaries);
  const pushToast = useAppStore((state) => state.pushToast);

  const project = projects.find((item) => item.id === activeProjectId) ?? projects[0];
  const currentVersionId = project?.currentVersionId;

  const [decisionTitle, setDecisionTitle] = useState("");
  const [decisionBody, setDecisionBody] = useState("");

  const scopedRevisions = revisionLogs.filter((item) => item.projectId === project?.id);
  const scopedDecisions = decisionLogs.filter((item) => item.projectId === project?.id);
  const scopedPasses = passHistory.filter((item) => item.projectId === project?.id);
  const sourceReliabilityMix = useMemo(() => {
    return sourceItems.reduce(
      (acc, source) => {
        const key = source.reliability ?? "low";
        acc[key] += 1;
        return acc;
      },
      { high: 0, medium: 0, low: 0, fragile: 0 },
    );
  }, [sourceItems]);

  const passComparison = useMemo(() => buildPassComparisonSummary(scopedPasses), [scopedPasses]);

  const refreshGovernance = () => {
    if (!project || !currentVersionId) {
      pushToast("Select a project/version before refreshing governance summaries.", "error");
      return;
    }

    const derived = deriveGovernanceSummaries({
      projectId: project.id,
      versionId: currentVersionId,
      sources: sourceItems.filter((source) => !source.projectId || source.projectId === project.id),
      audits,
      insights,
      issues,
    });

    setGovernanceSummaries({
      approvalGates: derived.approvalGates,
      confidenceItems: derived.confidenceItems,
      evidenceCoverageItems: derived.evidenceCoverageItems,
      sourceQualityItems: derived.sourceQualityItems,
      conflictItems: derived.conflictItems,
    });

    pushToast("Governance summaries refreshed.", "success");
  };

  const saveDecision = () => {
    if (!project || !decisionTitle.trim() || !decisionBody.trim()) {
      pushToast("Decision title and content are required.", "error");
      return;
    }

    addDecisionLog({
      id: `decision_${crypto.randomUUID()}`,
      projectId: project.id,
      title: decisionTitle,
      decision: decisionBody,
      rationale: "Manual governance entry",
      createdAt: new Date().toISOString(),
      createdBy: "User",
    });

    setDecisionTitle("");
    setDecisionBody("");
    pushToast("Decision log entry added.", "success");
  };

  return (
    <PageContainer
      title={t.pages.governance}
      description={help.pageDescriptions.governance}
    >
      <Card title="Governance Controls">
        <div className="flex flex-wrap items-center gap-2">
          <Button onClick={refreshGovernance}>Refresh Derived Summaries</Button>
          <p className="text-sm text-slate-600">Project: {project?.name ?? "None"}</p>
        </div>
      </Card>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card title="Pass Comparison" className="lg:col-span-1">
          <p className="text-sm text-slate-700">{passComparison.summary}</p>
          {passComparison.current && (
            <p className="mt-2 text-xs text-slate-500">
              Current: {passComparison.current.label} ({passComparison.current.score ?? "N/A"})
            </p>
          )}
        </Card>

        <Card
          title={(
            <span className="inline-flex items-center gap-2">
              Approval Gates <HelpTooltip text={help.tooltips.approvalGates} />
            </span>
          )}
          subtitle={help.sectionDescriptions.approvalGates}
          className="lg:col-span-2"
        >
          {approvalGates.length === 0 ? (
            <EmptyState title={t.common.emptyState} description="Run governance refresh to derive gates." />
          ) : (
            <div className="grid gap-2 md:grid-cols-2">
              {approvalGates.map((gate) => (
                <div key={gate.id} className="rounded-lg border border-slate-200 p-3">
                  <div className="flex items-center justify-between gap-2">
                    <p className="font-medium text-slate-900">{gate.gateName}</p>
                    <Badge
                      tone={
                        gate.status === "approved"
                          ? "good"
                          : gate.status === "rejected"
                            ? "danger"
                            : "warn"
                      }
                    >
                      {gate.status}
                    </Badge>
                  </div>
                  <p className="text-xs text-slate-500">Owner: {gate.owner}</p>
                </div>
              ))}
            </div>
          )}
        </Card>

        <Card title="Revision Log">
          <ul className="space-y-2 text-sm text-slate-700">
            {scopedRevisions.slice(0, 10).map((entry) => (
              <li key={entry.id} className="rounded-lg border border-slate-200 p-2">
                <p className="font-medium text-slate-900">{entry.changeSummary}</p>
                <p className="text-xs text-slate-500">{entry.author}</p>
              </li>
            ))}
          </ul>
        </Card>

        <Card title="Decision Log">
          <div className="mb-3 space-y-2">
            <Input placeholder="Decision title" value={decisionTitle} onChange={(event) => setDecisionTitle(event.target.value)} />
            <Textarea
              placeholder="Decision body"
              value={decisionBody}
              onChange={(event) => setDecisionBody(event.target.value)}
            />
            <Button onClick={saveDecision}>Add Decision</Button>
          </div>
          <ul className="space-y-2 text-sm text-slate-700">
            {scopedDecisions.slice(0, 10).map((entry) => (
              <li key={entry.id} className="rounded-lg border border-slate-200 p-2">
                <p className="font-medium text-slate-900">{entry.title}</p>
                <p>{entry.decision}</p>
              </li>
            ))}
          </ul>
        </Card>

        <Card title="Pass History">
          <ul className="space-y-2 text-sm text-slate-700">
            {scopedPasses.slice(0, 10).map((entry) => (
              <li key={entry.id} className="rounded-lg border border-slate-200 p-2">
                <p className="font-medium text-slate-900">{entry.label}</p>
                <p className="text-xs text-slate-500">
                  {entry.passType} | {entry.score ?? "N/A"}
                </p>
              </li>
            ))}
          </ul>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card
          title={(
            <span className="inline-flex items-center gap-2">
              Confidence Summary <HelpTooltip text={help.tooltips.confidenceSummary} />
            </span>
          )}
        >
          <ul className="space-y-2 text-sm text-slate-700">
            {confidenceItems.map((item) => (
              <li key={item.id} className="rounded-lg border border-slate-200 p-2">
                <p className="font-medium text-slate-900">{item.label}</p>
                <p>{item.score} - {item.reason}</p>
              </li>
            ))}
          </ul>
        </Card>
        <Card title="Evidence Coverage">
          <ul className="space-y-2 text-sm text-slate-700">
            {evidenceCoverageItems.slice(0, 10).map((item) => (
              <li key={item.id} className="rounded-lg border border-slate-200 p-2">
                <p className="font-medium text-slate-900">{item.sectionKey}</p>
                <p>{item.coverage}% - {item.note}</p>
              </li>
            ))}
          </ul>
        </Card>
        <Card title="Source Quality" subtitle={help.sectionDescriptions.sourceQuality}>
          <ul className="space-y-2 text-sm text-slate-700">
            <li className="rounded-lg border border-slate-200 p-2">
              <p className="font-medium text-slate-900">Reliability Mix</p>
              <p>
                high {sourceReliabilityMix.high} | medium {sourceReliabilityMix.medium} | low{" "}
                {sourceReliabilityMix.low} | fragile {sourceReliabilityMix.fragile}
              </p>
            </li>
            {sourceQualityItems.slice(0, 10).map((item) => (
              <li key={item.id} className="rounded-lg border border-slate-200 p-2">
                <p className="font-medium text-slate-900">{item.sourceId}</p>
                <p>{item.qualityScore} - {item.issues.join("; ") || "No issues"}</p>
              </li>
            ))}
          </ul>
        </Card>
      </div>

      <Card title="Conflict Summary">
        {conflictItems.length === 0 ? (
          <EmptyState title={t.common.emptyState} description="No conflicts detected." />
        ) : (
          <ul className="space-y-2 text-sm text-slate-700">
            {conflictItems.slice(0, 10).map((item) => (
              <li key={item.id} className="rounded-lg border border-slate-200 p-2">
                <p>{item.statementA}</p>
                <p className="text-slate-500">vs {item.statementB}</p>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </PageContainer>
  );
}
