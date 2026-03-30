import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

type Props = {
  children: ReactNode;
  tone?: "neutral" | "good" | "warn" | "danger";
};

export function Badge({ children, tone = "neutral" }: Props) {
  return (
    <span
      className={cn(
        "inline-flex rounded-full px-2 py-0.5 text-xs font-medium",
        tone === "neutral" && "bg-slate-100 text-slate-700",
        tone === "good" && "bg-emerald-100 text-emerald-700",
        tone === "warn" && "bg-amber-100 text-amber-700",
        tone === "danger" && "bg-rose-100 text-rose-700",
      )}
    >
      {children}
    </span>
  );
}

