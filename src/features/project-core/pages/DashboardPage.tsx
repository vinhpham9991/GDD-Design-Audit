import { useMemo } from "react";
import { ScoreTrendChart } from "@/components/charts/ScoreTrendChart";
import { PageContainer } from "@/components/layout/PageContainer";
import { Badge } from "@/components/shared/Badge";
import { Card } from "@/components/shared/Card";
import { EmptyState } from "@/components/shared/EmptyState";
import { HelpTooltip } from "@/components/shared/HelpTooltip";
import { getHelpContent } from "@/features/help/content";
import { useI18n } from "@/hooks/useI18n";
import { useAppStore } from "@/store";

export function DashboardPage() {
  const { language, t } = useI18n();
  const help = getHelpContent(language);
  const projects = useAppStore((state) => state.projects);
  const activeProjectId = useAppStore((state) => state.activeProjectId);
  const sources = useAppStore((state) => state.sourceItems);
  const issues = useAppStore((state) => state.issues);
  const audits = useAppStore((state) => state.auditResults);
  const scorecards = useAppStore((state) => state.scorecards);
  const insights = useAppStore((state) => state.insightReports);
  const approvalGates = useAppStore((state) => state.approvalGates);

  const project = projects.find((item) => item.id === activeProjectId) ?? projects[0];
  const currentVersionId = project?.currentVersionId;

  const latestAudit = audits.find((item) => item.versionId === currentVersionId) ?? audits[0];
  const latestScorecard = scorecards.find((item) => item.versionId === currentVersionId) ?? scorecards[0];
  const latestInsight = insights.find((item) => item.versionId === currentVersionId) ?? insights[0];
  const topIssues = useMemo(
    () =>
      issues
        .filter((item) => item.projectId === project?.id && item.status !== "resolved" && item.status !== "closed")
        .sort((a, b) => {
          const priorityRank = { critical: 4, high: 3, medium: 2, low: 1 };
          return priorityRank[b.priority] - priorityRank[a.priority];
        })
        .slice(0, 4),
    [issues, project?.id],
  );

  const nextActions = [
    latestAudit && latestAudit.overallScore < 70 ? "Run GDD rewrite pass on weak sections." : undefined,
    topIssues.some((item) => item.priority === "critical") ? "Resolve critical issues before gate review." : undefined,
    !latestInsight ? "Generate insight report after audit and scorecard." : undefined,
    approvalGates.some((gate) => gate.status !== "approved") ? "Address pending/rejected approval gates." : undefined,
  ].filter(Boolean) as string[];

  return (
    <PageContainer
      title={t.pages.dashboard}
      description="Project status, quality signals, governance snapshot, and recommended next actions."
    >
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Card title="Current Project">
          <p className="text-lg font-semibold text-slate-900">{project?.name ?? "No project selected"}</p>
          <p className="mt-1 text-sm text-slate-500">{project?.status ?? "N/A"}</p>
        </Card>
        <Card
          title={(
            <span className="inline-flex items-center gap-2">
              Latest Audit <HelpTooltip text={help.tooltips.auditScore} />
            </span>
          )}
          subtitle={help.sectionDescriptions.latestAudit}
        >
          <p className="text-3xl font-semibold text-slate-900">{latestAudit?.overallScore ?? "-"}</p>
        </Card>
        <Card
          title={(
            <span className="inline-flex items-center gap-2">
              Latest Scorecard <HelpTooltip text={help.tooltips.scorecardTotal} />
            </span>
          )}
        >
          <p className="text-3xl font-semibold text-slate-900">{latestScorecard?.weightedTotal ?? "-"}</p>
        </Card>
        <Card title="Open Issues">
          <p className="text-3xl font-semibold text-slate-900">{topIssues.length}</p>
        </Card>
      </div>

      <div className="grid gap-4 xl:grid-cols-12">
        <Card title="Top Issues" className="xl:col-span-5">
          {topIssues.length === 0 ? (
            <EmptyState title={t.common.emptyState} description="No high-priority open issues." />
          ) : (
            <div className="space-y-2">
              {topIssues.map((issue) => (
                <div key={issue.id} className="rounded-lg border border-slate-200 p-2">
                  <div className="flex items-center justify-between gap-2">
                    <p className="font-medium text-slate-900">{issue.title}</p>
                    <Badge tone={issue.priority === "critical" ? "danger" : "warn"}>{issue.priority}</Badge>
                  </div>
                  <p className="text-xs text-slate-500">{issue.status}</p>
                </div>
              ))}
            </div>
          )}
        </Card>

        <Card title="Recommended Next Actions" className="xl:col-span-4">
          {nextActions.length === 0 ? (
            <EmptyState title="Stable" description="No urgent actions detected." />
          ) : (
            <ul className="space-y-2 text-sm text-slate-700">
              {nextActions.map((item) => (
                <li key={item}>- {item}</li>
              ))}
            </ul>
          )}
        </Card>

        <Card title="Governance Snapshot" subtitle={help.sectionDescriptions.approvalGates} className="xl:col-span-3">
          <div className="space-y-2 text-sm">
            {approvalGates.length === 0 ? (
              <EmptyState title={t.common.emptyState} description="No gate data yet." />
            ) : (
              approvalGates.slice(0, 4).map((gate) => (
                <div key={gate.id} className="rounded border border-slate-200 p-2">
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
              ))
            )}
          </div>
        </Card>
      </div>

      <ScoreTrendChart />

      <Card title="Data Overview">
        <p className="text-sm text-slate-700">
          Sources: {sources.length} | Audits: {audits.length} | Insights: {insights.length}
        </p>
        <p className="mt-1 text-sm text-slate-600">{latestInsight?.summary ?? "Generate insight for strategic alignment summary."}</p>
      </Card>
    </PageContainer>
  );
}
