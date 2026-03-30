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
  const hasHydrated = useAppStore((state) => state._hasHydrated);

  // Hàm test trực tiếp không qua Store
  const handleTestClick = () => {
    alert("KẾT NỐI THÀNH CÔNG: JavaScript đang hoạt động trên Vercel!");
    console.log("Nút test đã được bấm");
  };

  return (
    <PageContainer 
      title="PROJECT HUB - KIỂM TRA V3" 
      description="Nếu bạn thấy chữ V3 này, nghĩa là Vercel đã nhận code mới."
    >
      <div className="mb-6 p-4 bg-yellow-100 border-2 border-yellow-400 rounded-xl">
        <h3 className="font-bold text-yellow-800">Bước 1: Kiểm tra JavaScript</h3>
        <p className="text-sm text-yellow-700 mb-2">Bấm nút dưới đây để xem trình duyệt có nhận diện được Logic React không:</p>
        <button 
          onClick={handleTestClick}
          className="bg-yellow-500 hover:bg-yellow-600 text-white font-bold py-2 px-4 rounded-lg shadow-md transition-all active:scale-95"
        >
          BẤM ĐỂ KIỂM TRA KẾT NỐI
        </button>
      </div>

      <Card title="Quick Add Project (Logic Test)" subtitle="React Hook Form + Zod validation">
        <ProjectQuickForm />
      </Card>

      <Card title="Projects List">
        {!hasHydrated ? (
          <div className="h-20 animate-pulse bg-slate-50 rounded-lg flex items-center justify-center text-slate-400 text-sm">
            Đang đồng bộ dữ liệu (Hydrating)...
          </div>
        ) : projects.length === 0 ? (
          <EmptyState title={t.common.emptyState} description="Chưa có dữ liệu. Hãy thử nhập tên > 3 ký tự ở trên." />
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