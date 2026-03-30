import { Navigate, createBrowserRouter } from "react-router-dom";
import { AppLayout } from "@/components/layout/AppLayout";
import { DashboardPage } from "@/features/project-core/pages/DashboardPage";
import { ProjectHubPage } from "@/features/project-core/pages/ProjectHubPage";
import { SourcesPage } from "@/features/sources/pages/SourcesPage";
import { GDDStudioPage } from "@/features/gdd-studio/pages/GDDStudioPage";
import { AuditLabPage } from "@/features/audit-lab/pages/AuditLabPage";
import { ScorecardPage } from "@/features/scorecard-board/pages/ScorecardPage";
import { InsightCenterPage } from "@/features/insight-center/pages/InsightCenterPage";
import { ActionTrackerPage } from "@/features/action-tracker/pages/ActionTrackerPage";
import { GovernancePage } from "@/features/governance-history/pages/GovernancePage";
import { SettingsPage } from "@/features/export-import/pages/SettingsPage";

export const router = createBrowserRouter([
  {
    path: "/",
    element: <AppLayout />,
    children: [
      { index: true, element: <Navigate to="/dashboard" replace /> },
      { path: "/dashboard", element: <DashboardPage /> },
      { path: "/project-hub", element: <ProjectHubPage /> },
      { path: "/sources", element: <SourcesPage /> },
      { path: "/gdd-studio", element: <GDDStudioPage /> },
      { path: "/audit-lab", element: <AuditLabPage /> },
      { path: "/scorecard", element: <ScorecardPage /> },
      { path: "/insight-center", element: <InsightCenterPage /> },
      { path: "/action-tracker", element: <ActionTrackerPage /> },
      { path: "/governance", element: <GovernancePage /> },
      { path: "/settings", element: <SettingsPage /> },
    ],
  },
]);

