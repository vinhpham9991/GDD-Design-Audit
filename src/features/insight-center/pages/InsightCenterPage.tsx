import { useMemo, useState } from "react";
import { DualRadarChart } from "@/components/charts/DualRadarChart";
import { PageContainer } from "@/components/layout/PageContainer";
import { Button } from "@/components/shared/Button";
import { Card } from "@/components/shared/Card";
import { EmptyState } from "@/components/shared/EmptyState";
import { HelpTooltip } from "@/components/shared/HelpTooltip";
import { SCORECARD_CATEGORIES } from "@/domain/models/constants";
import { generateInsightReport } from "@/domain/services/insightService";
import { getHelpContent } from "@/features/help/content";
import { useSyncedVersionSelection } from "@/hooks/useSyncedVersionSelection";
import { useI18n } from "@/hooks/useI18n";
import { useAppStore } from "@/store";

export function InsightCenterPage() {
  const { language, t } = useI18n();
  const help = getHelpContent(language);
  const activeProjectId = useAppStore((state) => state.activeProjectId);
  const projects = useAppStore((state) => state.projects);
  const gddVersions = useAppStore((state) => state.gddVersions);
  const audits = useAppStore((state) => state.auditResults);
  const scorecards = useAppStore((state) => state.scorecards);
  const insightReports = useAppStore((state) => state.insightReports);
  const saveInsightReport = useAppStore((state) => state.saveInsightReport);
  const addPassHistory = useAppStore((state) => state.addPassHistory);
  const addRevisionLog = useAppStore((state) => state.addRevisionLog);
  const pushToast = useAppStore((state) => state.pushToast);

  const project = projects.find((item) => item.id === activeProjectId) ?? projects[0];
  const versions = useMemo(
    () => gddVersions.filter((version) => version.projectId === project?.id),
    [gddVersions, project?.id],
  );
  const [selectedVersionId, setSelectedVersionId] = useSyncedVersionSelection(
    versions,
    project?.currentVersionId,
  );
  const [mode, setMode] = useState<"overlay" | "split">("overlay");

  const audit = audits.find((item) => item.versionId === selectedVersionId);
  const scorecard = scorecards.find((item) => item.versionId === selectedVersionId);
  const report = insightReports.find((item) => item.versionId === selectedVersionId);

  const chartData = useMemo(() => {
    if (!report) {
      return [];
    }

    return SCORECARD_CATEGORIES.map((category) => ({
      category: category.label,
      audit: report.auditScores[category.key] ?? 0,
      scorecard: report.scorecardScores[category.key] ?? 0,
    }));
  }, [report]);

  const generate = () => {
    if (!project || !selectedVersionId || !audit || !scorecard) {
      pushToast("Run audit and save scorecard before generating insight.", "error");
      return;
    }

    const report = generateInsightReport(project.id, selectedVersionId, audit, scorecard);
    saveInsightReport(report);
    addPassHistory({
      id: `pass_${crypto.randomUUID()}`,
      projectId: project.id,
      versionId: selectedVersionId,
      passType: "insight",
      label: `Insight generated for ${selectedVersionId}`,
      score: Math.round(
        Object.values(report.deltas).reduce((sum, value) => sum + Math.abs(value), 0) /
          Math.max(1, Object.keys(report.deltas).length),
      ),
      createdAt: report.createdAt,
    });
    addRevisionLog({
      id: `revision_${crypto.randomUUID()}`,
      projectId: project.id,
      versionId: selectedVersionId,
      changeSummary: "Generated insight report from audit vs scorecard deltas.",
      createdAt: report.createdAt,
      author: "System",
    });
    pushToast("Insight report generated.", "success");
  };

  return (
    <PageContainer
      title={t.pages.insightCenter}
      description={help.pageDescriptions.insightCenter}
    >
      <Card title="Insight Controls">
        <div className="flex flex-wrap items-center gap-3">
          <select
            className="h-10 rounded-lg border border-slate-300 px-3 text-sm"
            value={selectedVersionId ?? ""}
            onChange={(event) => setSelectedVersionId(event.target.value)}
          >
            {versions.map((version) => (
              <option key={version.id} value={version.id}>
                {version.name}
              </option>
            ))}
          </select>
          <Button onClick={generate} disabled={!selectedVersionId}>
            Generate Insight
          </Button>
          <Button variant={mode === "overlay" ? "primary" : "ghost"} onClick={() => setMode("overlay")}>
            Overlay
          </Button>
          <Button variant={mode === "split" ? "primary" : "ghost"} onClick={() => setMode("split")}>
            Split
          </Button>
        </div>
      </Card>

      {!audit || !scorecard ? (
        <EmptyState
          title="Missing inputs"
          description="Run Audit and save at least one Scorecard for this version first."
        />
      ) : !report ? (
        <EmptyState title="No insight yet" description="Click Generate Insight to compute radar and summary." />
      ) : (
        <>
          <Card
            title={(
              <span className="inline-flex items-center gap-2">
                Dual Radar <HelpTooltip text={help.tooltips.dualRadar} />
              </span>
            )}
            subtitle={help.sectionDescriptions.topGaps}
          >
            <DualRadarChart data={chartData} mode={mode} />
          </Card>

          <div className="grid gap-4 lg:grid-cols-3">
            <Card title="Summary" className="lg:col-span-3">
              <p className="text-sm text-slate-700">{report.summary}</p>
            </Card>
            <Card title="Strengths">
              <ul className="space-y-1 text-sm text-slate-700">
                {report.strengths.map((item) => (
                  <li key={item}>- {item}</li>
                ))}
              </ul>
            </Card>
            <Card title="Gaps">
              <ul className="space-y-1 text-sm text-slate-700">
                {report.gaps.map((item) => (
                  <li key={item}>- {item}</li>
                ))}
              </ul>
            </Card>
            <Card title="Recommendations">
              <ul className="space-y-1 text-sm text-slate-700">
                {report.recommendations.map((item) => (
                  <li key={item}>- {item}</li>
                ))}
              </ul>
            </Card>
          </div>

          <Card title="Category Deltas">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-600">
                    <th className="pb-2">Category</th>
                    <th className="pb-2">Audit</th>
                    <th className="pb-2">Scorecard</th>
                    <th className="pb-2">Delta</th>
                  </tr>
                </thead>
                <tbody>
                  {SCORECARD_CATEGORIES.map((category) => (
                    <tr key={category.key} className="border-b border-slate-100">
                      <td className="py-2 font-medium text-slate-900">{category.label}</td>
                      <td className="py-2">{report.auditScores[category.key] ?? 0}</td>
                      <td className="py-2">{report.scorecardScores[category.key] ?? 0}</td>
                      <td className="py-2">{report.deltas[category.key] ?? 0}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </>
      )}
    </PageContainer>
  );
}
