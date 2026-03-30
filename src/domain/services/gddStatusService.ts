import type { GDDSection } from "@/domain/models";

export function deriveSectionStatus(content: string): GDDSection["status"] {
  const len = content.trim().length;
  if (len < 20) return "missing";
  if (len < 120) return "weak";
  if (len < 260) return "medium";
  return "strong";
}
