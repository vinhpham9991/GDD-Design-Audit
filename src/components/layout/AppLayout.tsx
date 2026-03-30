import { Outlet } from "react-router-dom";
import { HelpModal } from "@/components/layout/HelpModal";
import { Sidebar } from "@/components/layout/Sidebar";
import { TopBar } from "@/components/layout/TopBar";
import { ToastViewport } from "@/components/shared/ToastViewport";
import { useAppStore } from "@/store";

export function AppLayout() {
  const sidebarCollapsed = useAppStore((state) => state.sidebarCollapsed);

  return (
    <div className="flex min-h-screen bg-slate-100">
      <Sidebar collapsed={sidebarCollapsed} />
      <div className="flex min-h-screen min-w-0 flex-1 flex-col">
        <TopBar />
        <Outlet />
      </div>
      <HelpModal />
      <ToastViewport />
    </div>
  );
}
