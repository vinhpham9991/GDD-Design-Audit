import { normalizeHeading } from "@/domain/services/mapSections";

const APPENDIX_HINTS = [
  "appendix",
  "phu luc",
  "notes",
  "additional notes",
  "reference",
  "supporting notes",
  "benchmark notes",
  "designer notes",
  "production notes",
];

export function isAppendixHeading(value?: string): boolean {
  if (!value) {
    return false;
  }
  const normalized = normalizeHeading(value);
  return APPENDIX_HINTS.some((hint) => normalized.includes(hint));
}
