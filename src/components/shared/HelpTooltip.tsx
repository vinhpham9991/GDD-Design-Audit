import { useEffect, useRef, useState } from "react";

type Props = {
  text?: string;
  label?: string;
};

export function HelpTooltip({ text, label = "Help" }: Props) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLSpanElement | null>(null);

  useEffect(() => {
    if (!open || !text) {
      return;
    }

    const onPointerDown = (event: MouseEvent | TouchEvent) => {
      if (!rootRef.current) {
        return;
      }
      const target = event.target;
      if (target instanceof Node && !rootRef.current.contains(target)) {
        setOpen(false);
      }
    };

    const onEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
      }
    };

    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("touchstart", onPointerDown);
    document.addEventListener("keydown", onEscape);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("touchstart", onPointerDown);
      document.removeEventListener("keydown", onEscape);
    };
  }, [open, text]);

  if (!text) {
    return null;
  }

  return (
    <span ref={rootRef} className="relative inline-flex">
      <button
        type="button"
        className="inline-flex h-5 w-5 items-center justify-center rounded-full border border-slate-300 text-[11px] font-semibold text-slate-600 hover:bg-slate-100"
        aria-label={label}
        title={label}
        aria-expanded={open}
        onClick={() => setOpen((prev) => !prev)}
      >
        ?
      </button>
      {open && (
        <span className="absolute right-0 top-6 z-20 w-56 max-w-[calc(100vw-2rem)] rounded-md border border-slate-200 bg-white p-2 text-xs leading-5 text-slate-700 shadow-lg md:left-1/2 md:right-auto md:w-64 md:-translate-x-1/2">
          {text}
        </span>
      )}
    </span>
  );
}
