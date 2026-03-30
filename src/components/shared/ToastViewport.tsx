import { useEffect } from "react";
import { useAppStore } from "@/store";

export function ToastViewport() {
  const toasts = useAppStore((state) => state.toasts);
  const removeToast = useAppStore((state) => state.removeToast);

  useEffect(() => {
    if (toasts.length === 0) {
      return;
    }

    const timers = toasts.map((toast) =>
      window.setTimeout(() => {
        removeToast(toast.id);
      }, 2600),
    );

    return () => timers.forEach((id) => window.clearTimeout(id));
  }, [removeToast, toasts]);

  return (
    <div className="pointer-events-none fixed bottom-4 right-4 z-[70] flex w-96 max-w-[calc(100%-2rem)] flex-col gap-2">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`pointer-events-auto rounded-lg border px-3 py-2 text-sm shadow ${{
            info: "border-slate-300 bg-white text-slate-700",
            success: "border-emerald-300 bg-emerald-50 text-emerald-800",
            error: "border-rose-300 bg-rose-50 text-rose-800",
          }[toast.tone ?? "info"]}`}
        >
          {toast.message}
        </div>
      ))}
    </div>
  );
}
