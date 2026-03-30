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
  // Kiểm tra trạng thái đồng bộ dữ liệu để tránh lỗi render trên Vercel
  const hasHydrated = useAppStore((state) => state._hasHydrated);

  return (
    <PageContainer 
      title={`${t.pages.projectHub} v2`} 
      description="Create and manage project records for your workflow. (Updated)"
    >
      <Card title="Quick Add Project" subtitle="React Hook Form + Zod validation">
        <ProjectQuickForm />
      </Card>

      <Card title="Projects">
        {!hasHydrated ? (
          <div className="h-20 animate-pulse bg-slate-50 rounded-lg flex items-center justify-center text-slate-400 text-sm">
            Loading storage...
          </div>
        ) : projects.length === 0 ? (
          <EmptyState title={t.common.emptyState} description={t.common.noData} />
        ) : (
          <div className="space-y-3">
            {[...projects].reverse().map((project) => (
              <div
                key={project.id}
                className="flex flex-col justify-between gap-2 rounded-lg border border-slate-200 p-3 md:flex-row md:items-center hover:bg-slate-50 transition-colors"
              >
                <div>
                  <p className="font-medium text-slate-900">{project.name}</p>
                  <p className="text-sm text-slate-500">
                    {project.genre || "-"} | {project.platform || "-"} | {formatDate(project.updatedAt)}
                  </p>
                </div>
                <Badge tone={project.status === "Draft" ? "neutral" : "primary"}>
                  {project.status ?? "Draft"}
                </Badge>
              </div>
            ))}
          </div>
        )}
      </Card>
    </PageContainer>
  );
}