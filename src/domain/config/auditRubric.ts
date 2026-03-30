import type { GddSectionKey } from "@/domain/models/constants";

export type SectionImportance = "critical" | "important" | "supporting";

export const SECTION_IMPORTANCE: Record<GddSectionKey, SectionImportance> = {
  game_overview: "critical",
  design_goals: "critical",
  target_audience: "critical",
  core_pillars: "critical",
  core_gameplay_loop: "critical",
  controls: "important",
  new_mechanics: "important",
  meta_layer: "important",
  monetization: "important",
  ftue: "important",
  economy: "important",
  aesthetic_direction: "supporting",
  live_ops: "supporting",
  risks_assumptions: "supporting",
};

export const IMPORTANCE_WEIGHTS: Record<SectionImportance, number> = {
  critical: 1.4,
  important: 1,
  supporting: 0.75,
};

export const HEALTH_SCORE_BANDS = {
  strong: { min: 85, max: 95 },
  medium: { min: 65, max: 80 },
  weak: { min: 40, max: 60 },
  missing: { min: 15, max: 35 },
} as const;

export const HEALTH_THRESHOLDS = {
  strongMin: 0.78,
  mediumMin: 0.52,
  weakMin: 0.25,
  missingContentLengthMax: 12,
} as const;

export const CALIBRATION_PENALTIES = {
  unsupportedClaimPenalty: 4,
  contradictionPenalty: 6,
  unsupportedClaimPenaltyCapPerSection: 12,
  contradictionPenaltyCapPerSection: 18,
  globalUnsupportedPenaltyFactor: 0.5,
  globalUnsupportedPenaltyCap: 4,
  globalContradictionPenaltyFactor: 1,
  globalContradictionPenaltyCap: 6,
  missingCriticalPenalty: 4,
  missingCriticalPenaltyCap: 12,
  missingImportantPenalty: 2,
  missingImportantPenaltyCap: 8,
  missingSupportingPenalty: 1,
  missingSupportingPenaltyCap: 4,
  parserUncertaintyPenaltyCap: 6,
} as const;

export const PARSER_SCORE_ADJUSTMENT = {
  mildCoverageThreshold: 70,
  poorCoverageThreshold: 45,
  lowConfidenceRatioThreshold: 0.5,
} as const;

export const CONFIDENCE_THRESHOLDS = {
  highCoverageMin: 78,
  mediumCoverageMin: 50,
  highLowConfidenceRatioMax: 0.3,
  mediumLowConfidenceRatioMax: 0.6,
  maxEmptySectionsForHigh: 4,
} as const;
