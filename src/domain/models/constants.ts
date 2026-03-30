export const SOURCE_TYPES = [
  "gdd",
  "overview",
  "benchmark",
  "gameplay reference",
  "store page",
  "balancing notes",
  "level notes",
  "wireframe",
  "feedback",
  "asset reference",
  "other",
] as const;

export type SourceType = (typeof SOURCE_TYPES)[number];

export const GDD_SECTION_TEMPLATES = [
  { key: "game_overview", title: "Game Overview" },
  { key: "design_goals", title: "Design Goals" },
  { key: "target_audience", title: "Target Audience" },
  { key: "core_pillars", title: "Core Pillars" },
  { key: "core_gameplay_loop", title: "Core Gameplay Loop" },
  { key: "controls", title: "Controls" },
  { key: "new_mechanics", title: "New Mechanics" },
  { key: "meta_layer", title: "Meta Layer" },
  { key: "monetization", title: "Monetization" },
  { key: "aesthetic_direction", title: "Aesthetic Direction" },
  { key: "ftue", title: "FTUE" },
  { key: "economy", title: "Economy" },
  { key: "live_ops", title: "Live Ops" },
  { key: "risks_assumptions", title: "Risks and Assumptions" },
] as const;

export type GddSectionKey = (typeof GDD_SECTION_TEMPLATES)[number]["key"];

export const SCORECARD_CATEGORIES = [
  { key: "core_loop_strength", label: "Core Loop Strength", weight: 0.2 },
  { key: "retention_potential", label: "Retention Potential", weight: 0.15 },
  { key: "progression_depth", label: "Progression Depth", weight: 0.12 },
  { key: "monetization_fit", label: "Monetization Fit", weight: 0.1 },
  { key: "production_feasibility", label: "Production Feasibility", weight: 0.14 },
  { key: "marketability", label: "Marketability", weight: 0.1 },
  { key: "ux_clarity", label: "UX Clarity", weight: 0.1 },
  { key: "hybrid_casual_fit", label: "Hybrid-Casual Fit", weight: 0.09 },
] as const;

export type ScorecardCategoryKey = (typeof SCORECARD_CATEGORIES)[number]["key"];
export type ScorecardCategoryScores = Record<ScorecardCategoryKey, number>;
