import { useMemo, useState } from "react";
import { PageContainer } from "@/components/layout/PageContainer";
import { Button } from "@/components/shared/Button";
import { Card } from "@/components/shared/Card";
import { EmptyState } from "@/components/shared/EmptyState";
import { HelpTooltip } from "@/components/shared/HelpTooltip";
import { Input } from "@/components/shared/Input";
import { Textarea } from "@/components/shared/Textarea";
import {
  SCORECARD_CATEGORIES,
  type ScorecardCategoryKey,
} from "@/domain/models/constants";
import {
  computeWeightedScore,
  emptyScorecardScores,
  normalizeScoreInput,
} from "@/domain/services/scorecardService";
import { getHelpContent } from "@/features/help/content";
import { useSyncedVersionSelection } from "@/hooks/useSyncedVersionSelection";
import { useI18n } from "@/hooks/useI18n";
import { useAppStore } from "@/store";

export function ScorecardPage() {
  const { language, t } = useI18n();
  const help = getHelpContent(language);
  const activeProjectId = useAppStore((state) => state.activeProjectId);
  const projects = useAppStore((state) => state.projects);
  const gddVersions = useAppStore((state) => state.gddVersions);
  const scorecards = useAppStore((state) => state.scorecards);
  const saveScorecard = useAppStore((state) => state.saveScorecard);
  const deleteScorecard = useAppStore((state) => state.deleteScorecard);
  const addRevisionLog = useAppStore((state) => state.addRevisionLog);
  const addPassHistory = useAppStore((state) => state.addPassHistory);
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
  const [editingId, setEditingId] = useState<string | undefined>();
  const [reviewer, setReviewer] = useState("Lead Designer");
  const [comments, setComments] = useState("");
  const [scores, setScores] = useState(emptyScorecardScores());

  const scopedScorecards = scorecards.filter((item) => item.versionId === selectedVersionId);
  const weightedTotal = computeWeightedScore(scores);

  const setCategoryScore = (key: ScorecardCategoryKey, value: number) => {
    setScores((prev) => ({ ...prev, [key]: Math.max(0, Math.min(100, value)) }));
  };

  const resetForm = () => {
    setEditingId(undefined);
    setReviewer("Lead Designer");
    setComments("");
    setScores(emptyScorecardScores());
  };

  const save = () => {
    if (!project || !selectedVersionId) {
      pushToast("Select a GDD version before saving scorecard.", "error");
      return;
    }
    const normalized = normalizeScoreInput(scores);
    saveScorecard({
      id: editingId ?? `scorecard_${crypto.randomUUID()}`,
      projectId: project.id,
      versionId: selectedVersionId,
      reviewer,
      comments,
      createdAt: new Date().toISOString(),
      categoryScores: normalized,
      weightedTotal: computeWeightedScore(normalized),
    });
    addPassHistory({
      id: `pass_${crypto.randomUUID()}`,
      projectId: project.id,
      versionId: selectedVersionId,
      passType: "scorecard",
      label: `Scorecard saved by ${reviewer}`,
      score: computeWeightedScore(normalized),
      createdAt: new Date().toISOString(),
    });
    addRevisionLog({
      id: `revision_${crypto.randomUUID()}`,
      projectId: project.id,
      versionId: selectedVersionId,
      changeSummary: `Saved scorecard (${reviewer}) with weighted score ${computeWeightedScore(normalized)}.`,
      createdAt: new Date().toISOString(),
      author: reviewer || "User",
    });
    pushToast("Scorecard saved.", "success");
    resetForm();
  };

  return (
    <PageContainer
      title={t.pages.scorecard}
      description={help.pageDescriptions.scorecard}
    >
      <Card title="Scoring Form">
        <div className="grid gap-3 md:grid-cols-2">
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
          <Input value={reviewer} onChange={(event) => setReviewer(event.target.value)} placeholder="Reviewer" />
        </div>

        <div className="mt-4 grid gap-3">
          {SCORECARD_CATEGORIES.map((category) => (
            <div key={category.key} className="rounded-lg border border-slate-200 p-3">
              <div className="mb-1 flex items-center justify-between text-sm">
                <span className="font-medium text-slate-900">{category.label}</span>
                <span className="text-slate-600">{scores[category.key]}</span>
              </div>
              <input
                type="range"
                min={0}
                max={100}
                value={scores[category.key]}
                onChange={(event) => setCategoryScore(category.key, Number(event.target.value))}
                className="w-full"
              />
            </div>
          ))}
        </div>

        <div className="mt-4">
          <Textarea value={comments} onChange={(event) => setComments(event.target.value)} placeholder="Comments" />
        </div>

        <div className="mt-4 flex items-center justify-between">
          <p className="inline-flex items-center gap-2 text-sm text-slate-700">
            Weighted Total: <strong>{weightedTotal}</strong>
            <HelpTooltip text={help.tooltips.scorecardTotal} />
          </p>
          <div className="flex gap-2">
            {editingId && (
              <Button variant="ghost" onClick={resetForm}>
                {t.common.cancel}
              </Button>
            )}
            <Button onClick={save} disabled={!selectedVersionId}>
              {editingId ? "Update Scorecard" : "Save Scorecard"}
            </Button>
          </div>
        </div>
      </Card>

      <Card title="Saved Scorecards">
        {scopedScorecards.length === 0 ? (
          <EmptyState title={t.common.emptyState} description="No scorecards for this version yet." />
        ) : (
          <div className="space-y-2">
            {scopedScorecards.map((item) => (
              <div key={item.id} className="rounded-lg border border-slate-200 p-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="font-medium text-slate-900">
                    {item.reviewer} - {item.weightedTotal}
                  </p>
                  <div className="flex gap-2">
                    <Button
                      variant="ghost"
                      onClick={() => {
                        setEditingId(item.id);
                        setReviewer(item.reviewer);
                        setComments(item.comments ?? "");
                        setScores(item.categoryScores);
                      }}
                    >
                      Edit
                    </Button>
                    <Button
                      variant="danger"
                      onClick={() => {
                        deleteScorecard(item.id);
                        pushToast("Scorecard deleted.", "success");
                      }}
                    >
                      Delete
                    </Button>
                  </div>
                </div>
                <p className="mt-1 text-sm text-slate-600">{item.comments || "No comments"}</p>
              </div>
            ))}
          </div>
        )}
      </Card>
    </PageContainer>
  );
}
