import { GDD_SECTION_TEMPLATES, type GddSectionKey } from "@/domain/models/constants";

const CANONICAL_KEYS = new Set<string>(GDD_SECTION_TEMPLATES.map((section) => section.key));

export function isCanonicalSectionKey(value?: string): value is GddSectionKey {
  return Boolean(value && CANONICAL_KEYS.has(value));
}
