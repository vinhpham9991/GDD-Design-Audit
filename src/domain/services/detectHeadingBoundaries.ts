import { normalizeHeading } from "@/domain/services/mapSections";

export type HeadingBoundary = {
  isHeading: boolean;
  level?: number;
  reason?: string;
};

const headingHints = [
  "overview",
  "goal",
  "audience",
  "pillar",
  "loop",
  "controls",
  "mechanics",
  "meta",
  "monetization",
  "economy",
  "live ops",
  "risks",
  "tong quan",
  "muc tieu",
  "doi tuong",
  "tru cot",
  "vong lap",
  "dieu khien",
  "co che",
  "kiem tien",
  "kinh te",
  "phu luc",
  "target audience",
  "nguoi choi muc tieu",
  "audience summary",
  "dong luc quay lai",
  "pain points",
  "moment to moment loop",
  "core tension model",
  "mechanics systems",
  "cup system",
  "physics rules",
  "queue bias",
  "numeric tuning",
  "danger window",
  "grace window",
  "continue recovery",
  "level design framework",
  "kpi",
  "metrics",
];

export function detectHeadingBoundary(text: string, explicitLevel?: number): HeadingBoundary {
  const trimmed = text.trim();
  if (!trimmed) {
    return { isHeading: false };
  }
  if (explicitLevel) {
    return { isHeading: true, level: explicitLevel, reason: "explicit_heading_tag" };
  }

  const numbered = trimmed.match(/^(\d+(?:\.\d+){0,3})[).\s-]+(.+)/);
  if (numbered) {
    const titlePart = numbered[2].trim();
    const wordCount = titlePart.split(/\s+/).length;
    if (titlePart.length <= 95 && wordCount <= 14) {
      return {
        isHeading: true,
        level: numbered[1].split(".").length,
        reason: "numbered_heading_pattern",
      };
    }
  }

  if (trimmed.endsWith(":") && trimmed.length <= 90) {
    return { isHeading: true, level: 2, reason: "colon_heading_pattern" };
  }

  const normalized = normalizeHeading(trimmed);
  if (trimmed.length <= 80 && !/[.!?]$/.test(trimmed)) {
    if (headingHints.some((hint) => normalized.includes(hint))) {
      return { isHeading: true, level: 2, reason: "heading_keyword_hint" };
    }
  }

  return { isHeading: false };
}
