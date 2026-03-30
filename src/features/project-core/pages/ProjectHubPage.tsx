import { PageContainer } from "@/components/layout/PageContainer";
import { ProjectQuickForm } from "@/components/forms/ProjectQuickForm";
import { Badge } from "@/components/shared/Badge";
import { Card } from "@/components/shared/Card";
import { EmptyState } from "@/components/shared/EmptyState";
import { formatDate } from "@/domain/utils/date";
import { useI18n } from "@/hooks/useI18n";
import { useAppStore } from "@/store";

export function ProjectHubPage() {
  const { t } = useI18n();
  const projects = useAppStore((state) => state.projects);

  return (
    <PageContainer title={t.pages.projectHub} description="Create and manage project records for your workflow.">
      <Card title="Quick Add Project" subtitle="React Hook Form + Zod validation">
        <ProjectQuickForm />
      </Card>

      <Card title="Projects">
        {projects.length === 0 ? (
          <EmptyState title={t.common.emptyState} description={t.common.noData} />
        ) : (
          <div className="space-y-3">
            {projects.map((project) => (
              <div
                key={project.id}
                className="flex flex-col justify-between gap-2 rounded-lg border border-slate-200 p-3 md:flex-row md:items-center"
              >
                <div>
                  <p className="font-medium text-slate-900">{project.name}</p>
                  <p className="text-sm text-slate-500">
                    {project.genre ?? "-"} | {project.platform ?? "-"} | {formatDate(project.updatedAt)}
                  </p>
                </div>
                <Badge tone="neutral">{project.status ?? "Draft"}</Badge>
              </div>
            ))}
          </div>
        )}
      </Card>
    </PageContainer>
  );
}

