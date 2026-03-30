import { useLocation } from "react-router-dom";
import { Button } from "@/components/shared/Button";
import { useI18n } from "@/hooks/useI18n";
import { useAppStore } from "@/store";

const pageByPath = {
  "/dashboard": "dashboard",
  "/project-hub": "projectHub",
  "/sources": "sources",
  "/gdd-studio": "gddStudio",
  "/audit-lab": "auditLab",
  "/scorecard": "scorecard",
  "/insight-center": "insightCenter",
  "/action-tracker": "actionTracker",
  "/governance": "governance",
  "/settings": "settings",
} as const;

export function TopBar() {
  const location = useLocation();
  const toggleSidebar = useAppStore((state) => state.toggleSidebar);
  const openHelp = useAppStore((state) => state.openHelp);
  const { language, setLanguage, t } = useI18n();

  const pageKey = pageByPath[location.pathname as keyof typeof pageByPath] ?? "dashboard";

  return (
    <header className="sticky top-0 z-10 border-b border-slate-200 bg-white/95 px-4 py-3 backdrop-blur md:px-6">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Button variant="ghost" className="md:hidden" onClick={toggleSidebar}>
            Menu
          </Button>
          <h1 className="text-lg font-semibold text-slate-900">{t.pages[pageKey]}</h1>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" onClick={openHelp}>
            {t.common.help}
          </Button>
          <div className="flex items-center rounded-lg border border-slate-200 bg-white p-1">
            <button
              className={`rounded px-2 py-1 text-xs font-semibold ${
                language === "en" ? "bg-teal-600 text-white" : "text-slate-600"
              }`}
              onClick={() => setLanguage("en")}
              type="button"
            >
              EN
            </button>
            <button
              className={`rounded px-2 py-1 text-xs font-semibold ${
                language === "vi" ? "bg-teal-600 text-white" : "text-slate-600"
              }`}
              onClick={() => setLanguage("vi")}
              type="button"
            >
              VI
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
