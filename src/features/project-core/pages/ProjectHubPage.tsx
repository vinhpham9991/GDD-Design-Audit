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

  // Hàm test để xác nhận JavaScript có chạy hay không
  const handleTestClick = () => {
    alert("XÁC NHẬN: JavaScript ĐÃ HOẠT ĐỘNG TRÊN VERCEL!");
  };

  return (
    <PageContainer 
      title="PROJECT HUB - PHIÊN BẢN MỚI NHẤT" 
      description="Nếu thấy dòng chữ này, hệ thống đã nhận diện đúng file code."
    >
      {/* KHU VỰC KIỂM TRA KẾT NỐI */}
      <div className="mb-6 p-4 bg-amber-50 border-2 border-amber-500 rounded-xl shadow-sm">
        <h3 className="font-bold text-amber-900 flex items-center gap-2">
          <span className="flex h-3 w-3 rounded-full bg-amber-500 animate-ping"></span>
          Debug Mode: Kiểm tra Runtime
        </h3>
        <p className="text-sm text-amber-800 mt-1 mb-3">
          Nhấn nút bên dưới. Nếu hiện thông báo (Alert), nghĩa là React đã "sống".
        </p>
        <button 
          onClick={handleTestClick}
          className="bg-amber-600 hover:bg-amber-700 text-white text-sm font-bold py-2 px-4 rounded-lg transition-all"
        >
          KÍCH HOẠT KIỂM TRA
        </button>
      </div>

      {/* FORM THÊM DỰ ÁN */}
      <Card title="Quick Add Project" subtitle="React Hook Form + Zod validation">
        <ProjectQuickForm />
      </Card>

      {/* DANH SÁCH DỰ ÁN */}
      <Card title="Projects List">
        {!hasHydrated ? (
          <div className="h-24 animate-pulse bg-slate-50 rounded-lg flex flex-col items-center justify-center text-slate-400 gap-2">
            <div className="w-8 h-8 border-4 border-teal-500 border-t-transparent rounded-full animate-spin"></div>
            <span className="text-xs font-medium italic">Đang đồng bộ LocalStorage...</span>
          </div>
        ) : projects.length === 0 ? (
          <EmptyState title={t.common.emptyState} description="Chưa có dữ liệu. Vui lòng nhập tên project (ít nhất 3 ký tự) để thử nghiệm." />
        ) : (
          <div className="space-y-3">
            {[...projects].reverse().map((project) => (
              <div
                key={project.id}
                className="flex flex-col justify-between gap-2 rounded-lg border border-slate-200 p-4 md:flex-row md:items-center hover:bg-slate-50 transition-all shadow-sm"
              >
                <div>
                  <p className="font-bold text-slate-900 text-lg">{project.name}</p>
                  <p className="text-sm text-slate-500">
                    Genre: {project.genre || "N/A"} | Platform: {project.platform || "N/A"}
                  </p>
                  <p className="text-[10px] text-slate-400 mt-1 uppercase tracking-wider font-semibold">
                    Cập nhật: {formatDate(project.updatedAt)}
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