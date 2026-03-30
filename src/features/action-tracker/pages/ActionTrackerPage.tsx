import { useMemo, useState } from "react";
import { PageContainer } from "@/components/layout/PageContainer";
import { Badge } from "@/components/shared/Badge";
import { Button } from "@/components/shared/Button";
import { Card } from "@/components/shared/Card";
import { EmptyState } from "@/components/shared/EmptyState";
import { HelpTooltip } from "@/components/shared/HelpTooltip";
import { Input } from "@/components/shared/Input";
import { Textarea } from "@/components/shared/Textarea";
import { generateIssuesFromFindings } from "@/domain/services/issueService";
import type { IssueItem } from "@/domain/models";
import { getHelpContent } from "@/features/help/content";
import { useI18n } from "@/hooks/useI18n";
import { useAppStore } from "@/store";

const STATUSES: IssueItem["status"][] = ["open", "in_progress", "blocked", "resolved", "closed"];
const PRIORITIES: IssueItem["priority"][] = ["low", "medium", "high", "critical"];

export function ActionTrackerPage() {
  const { language, t } = useI18n();
  const help = getHelpContent(language);
  const activeProjectId = useAppStore((state) => state.activeProjectId);
  const projects = useAppStore((state) => state.projects);
  const issues = useAppStore((state) => state.issues);
  const audits = useAppStore((state) => state.auditResults);
  const insights = useAppStore((state) => state.insightReports);
  const addIssue = useAppStore((state) => state.addIssue);
  const addIssues = useAppStore((state) => state.addIssues);
  const updateIssue = useAppStore((state) => state.updateIssue);
  const deleteIssue = useAppStore((state) => state.deleteIssue);
  const addRevisionLog = useAppStore((state) => state.addRevisionLog);
  const addPassHistory = useAppStore((state) => state.addPassHistory);
  const pushToast = useAppStore((state) => state.pushToast);

  const project = projects.find((item) => item.id === activeProjectId) ?? projects[0];

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [priorityFilter, setPriorityFilter] = useState<string>("all");
  const [editingIssueId, setEditingIssueId] = useState<string | undefined>();

  const [form, setForm] = useState<Partial<IssueItem>>({
    title: "",
    description: "",
    status: "open",
    priority: "medium",
    severity: "medium",
    owner: "",
    linkedSection: "",
    recommendation: "",
  });

  const scopedIssues = useMemo(() => {
    const base = issues.filter((item) => item.projectId === project?.id);

    return base.filter((issue) => {
      const matchesSearch =
        issue.title.toLowerCase().includes(search.toLowerCase()) ||
        (issue.description ?? "").toLowerCase().includes(search.toLowerCase());
      const matchesStatus = statusFilter === "all" || issue.status === statusFilter;
      const matchesPriority = priorityFilter === "all" || issue.priority === priorityFilter;

      return matchesSearch && matchesStatus && matchesPriority;
    });
  }, [issues, priorityFilter, project?.id, search, statusFilter]);

  const startEdit = (issue: IssueItem) => {
    setEditingIssueId(issue.id);
    setForm(issue);
  };

  const resetForm = () => {
    setEditingIssueId(undefined);
    setForm({
      title: "",
      description: "",
      status: "open",
      priority: "medium",
      severity: "medium",
      owner: "",
      linkedSection: "",
      recommendation: "",
    });
  };

  const save = () => {
    if (!project || !form.title || !form.status || !form.priority || !form.severity) {
      pushToast("Title, status, priority, and severity are required.", "error");
      return;
    }

    if (editingIssueId) {
      updateIssue(editingIssueId, form);
      pushToast("Issue updated.", "success");
    } else {
      addIssue({
        id: `issue_${crypto.randomUUID()}`,
        projectId: project.id,
        versionId: project.currentVersionId,
        title: form.title,
        description: form.description,
        linkedSection: form.linkedSection,
        priority: form.priority,
        severity: form.severity,
        status: form.status,
        owner: form.owner,
        recommendation: form.recommendation,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
      pushToast("Issue created.", "success");
    }

    addRevisionLog({
      id: `revision_${crypto.randomUUID()}`,
      projectId: project.id,
      versionId: project.currentVersionId ?? "",
      changeSummary: editingIssueId ? `Updated issue: ${form.title}` : `Created issue: ${form.title}`,
      createdAt: new Date().toISOString(),
      author: "User",
    });
    resetForm();
  };

  const autoGenerate = () => {
    if (!project || !project.currentVersionId) {
      pushToast("Select a project version before auto-generating issues.", "error");
      return;
    }
    const audit = audits.find((item) => item.versionId === project.currentVersionId);
    const insight = insights.find((item) => item.versionId === project.currentVersionId);
    const generated = generateIssuesFromFindings(project.id, project.currentVersionId, audit, insight);
    addIssues(generated);
    addPassHistory({
      id: `pass_${crypto.randomUUID()}`,
      projectId: project.id,
      versionId: project.currentVersionId,
      passType: "issues",
      label: "Issue generation pass",
      score: generated.length,
      createdAt: new Date().toISOString(),
    });
    addRevisionLog({
      id: `revision_${crypto.randomUUID()}`,
      projectId: project.id,
      versionId: project.currentVersionId,
      changeSummary: `Auto-generated ${generated.length} issues from audit and insight.`,
      createdAt: new Date().toISOString(),
      author: "System",
    });
    pushToast(`Generated ${generated.length} issues.`, "success");
  };

  return (
    <PageContainer
      title={t.pages.actionTracker}
      description={help.pageDescriptions.actionTracker}
    >
      <Card title="Create / Edit Issue">
        <div className="grid gap-3 md:grid-cols-2">
          <Input
            placeholder="Issue title"
            value={form.title ?? ""}
            onChange={(event) => setForm((prev) => ({ ...prev, title: event.target.value }))}
          />
          <Input
            placeholder="Owner"
            value={form.owner ?? ""}
            onChange={(event) => setForm((prev) => ({ ...prev, owner: event.target.value }))}
          />
        </div>
        <Textarea
          className="mt-3"
          placeholder="Description"
          value={form.description ?? ""}
          onChange={(event) => setForm((prev) => ({ ...prev, description: event.target.value }))}
        />
        <div className="mt-3 grid gap-3 md:grid-cols-4">
          <Input
            placeholder="Linked section"
            value={form.linkedSection ?? ""}
            onChange={(event) => setForm((prev) => ({ ...prev, linkedSection: event.target.value }))}
          />
          <select
            className="h-10 rounded-lg border border-slate-300 px-3 text-sm"
            value={form.status}
            onChange={(event) =>
              setForm((prev) => ({ ...prev, status: event.target.value as IssueItem["status"] }))
            }
          >
            {STATUSES.map((status) => (
              <option key={status} value={status}>
                {status}
              </option>
            ))}
          </select>
          <select
            className="h-10 rounded-lg border border-slate-300 px-3 text-sm"
            value={form.priority}
            onChange={(event) =>
              setForm((prev) => ({ ...prev, priority: event.target.value as IssueItem["priority"] }))
            }
          >
            {PRIORITIES.map((priority) => (
              <option key={priority} value={priority}>
                {priority}
              </option>
            ))}
          </select>
          <select
            className="h-10 rounded-lg border border-slate-300 px-3 text-sm"
            value={form.severity}
            onChange={(event) =>
              setForm((prev) => ({ ...prev, severity: event.target.value as IssueItem["severity"] }))
            }
          >
            <option value="low">low</option>
            <option value="medium">medium</option>
            <option value="high">high</option>
          </select>
        </div>
        <Textarea
          className="mt-3"
          placeholder="Recommendation"
          value={form.recommendation ?? ""}
          onChange={(event) => setForm((prev) => ({ ...prev, recommendation: event.target.value }))}
        />
        <div className="mt-3 flex flex-wrap gap-2">
          <Button onClick={save}>{editingIssueId ? "Update Issue" : "Create Issue"}</Button>
          {editingIssueId && (
            <Button variant="ghost" onClick={resetForm}>
              {t.common.cancel}
            </Button>
          )}
          <Button variant="ghost" onClick={autoGenerate}>
            <span className="inline-flex items-center gap-2">
              Auto-generate from Audit + Insight
              <HelpTooltip text={help.tooltips.issueGeneration} />
            </span>
          </Button>
        </div>
      </Card>

      <Card title="Filters">
        <div className="grid gap-3 md:grid-cols-3">
          <Input placeholder="Search" value={search} onChange={(event) => setSearch(event.target.value)} />
          <select
            className="h-10 rounded-lg border border-slate-300 px-3 text-sm"
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value)}
          >
            <option value="all">All Statuses</option>
            {STATUSES.map((status) => (
              <option key={status} value={status}>
                {status}
              </option>
            ))}
          </select>
          <select
            className="h-10 rounded-lg border border-slate-300 px-3 text-sm"
            value={priorityFilter}
            onChange={(event) => setPriorityFilter(event.target.value)}
          >
            <option value="all">All Priorities</option>
            {PRIORITIES.map((priority) => (
              <option key={priority} value={priority}>
                {priority}
              </option>
            ))}
          </select>
        </div>
      </Card>

      <Card title="Issue List">
        {scopedIssues.length === 0 ? (
          <EmptyState title={t.common.emptyState} description="No issues match current filters." />
        ) : (
          <div className="space-y-2">
            {scopedIssues.map((issue) => (
              <div key={issue.id} className="rounded-lg border border-slate-200 p-3">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <p className="font-medium text-slate-900">{issue.title}</p>
                    <p className="text-sm text-slate-600">{issue.description}</p>
                    <p className="text-xs text-slate-500">Owner: {issue.owner || "Unassigned"}</p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Badge tone={issue.priority === "critical" ? "danger" : "warn"}>{issue.priority}</Badge>
                    <Badge tone="neutral">{issue.status}</Badge>
                  </div>
                </div>
                <div className="mt-2 flex gap-2">
                  <Button variant="ghost" onClick={() => startEdit(issue)}>
                    Edit
                  </Button>
                  <Button
                    variant="danger"
                    onClick={() => {
                      deleteIssue(issue.id);
                      pushToast("Issue deleted.", "success");
                    }}
                  >
                    Delete
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </PageContainer>
  );
}
