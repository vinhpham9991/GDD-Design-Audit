import type { TextareaHTMLAttributes } from "react";
import { cn } from "@/lib/cn";

type Props = TextareaHTMLAttributes<HTMLTextAreaElement>;

export function Textarea({ className, ...props }: Props) {
  return (
    <textarea
      className={cn(
        "min-h-28 max-h-[28rem] w-full resize-y overflow-auto rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none",
        "focus:border-teal-500 focus:ring-2 focus:ring-teal-200",
        className,
      )}
      {...props}
    />
  );
}
