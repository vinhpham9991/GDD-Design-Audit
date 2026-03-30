import { NavLink } from "react-router-dom";
import { useI18n } from "@/hooks/useI18n";
import { cn } from "@/lib/cn";

const navConfig = [
  { to: "/dashboard", key: "dashboard" },
  { to: "/project-hub", key: "projectHub" },
  { to: "/sources", key: "sources" },
  { to: "/gdd-studio", key: "gddStudio" },
  { to: "/audit-lab", key: "auditLab" },
  { to: "/scorecard", key: "scorecard" },
  { to: "/insight-center", key: "insightCenter" },
  { to: "/action-tracker", key: "actionTracker" },
  { to: "/governance", key: "governance" },
  { to: "/settings", key: "settings" },
] as const;

type Props = {
  collapsed: boolean;
};

export function Sidebar({ collapsed }: Props) {
  const { t } = useI18n();

  return (
    <aside
      className={cn(
        "hidden border-r border-slate-200 bg-slate-900 text-slate-200 md:flex md:flex-col",
        collapsed ? "md:w-20" : "md:w-64",
      )}
    >
      <div className="border-b border-slate-800 px-4 py-4 text-sm font-semibold uppercase tracking-wide text-teal-300">
        {collapsed ? "GDO" : t.appName}
      </div>
      <nav className="flex-1 space-y-1 p-3">
        {navConfig.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              cn(
                "block rounded-lg px-3 py-2 text-sm transition",
                isActive ? "bg-teal-500/20 text-teal-200" : "text-slate-300 hover:bg-slate-800",
              )
            }
          >
            {collapsed ? t.nav[item.key].slice(0, 2) : t.nav[item.key]}
          </NavLink>
        ))}
      </nav>
    </aside>
  );
}

