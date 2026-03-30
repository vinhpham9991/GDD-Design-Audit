import type { GddSectionKey } from "@/domain/models/constants";
import type { SupportBucket } from "@/domain/config/supportBuckets";

export const CROSS_SECTION_SUPPORT_RULES: Record<SupportBucket, Array<{ section: GddSectionKey; weight: number }>> = {
  document_purpose: [
    { section: "game_overview", weight: 1 },
    { section: "design_goals", weight: 0.65 },
  ],
  document_scope: [
    { section: "design_goals", weight: 1 },
    { section: "risks_assumptions", weight: 0.5 },
  ],
  document_metadata: [{ section: "game_overview", weight: 0.4 }],
  current_direction_summary: [
    { section: "game_overview", weight: 0.8 },
    { section: "design_goals", weight: 0.7 },
  ],
  target_audience_support: [
    { section: "target_audience", weight: 1 },
    { section: "design_goals", weight: 0.45 },
  ],
  audience_motivation: [
    { section: "target_audience", weight: 0.9 },
    { section: "meta_layer", weight: 0.65 },
    { section: "core_gameplay_loop", weight: 0.55 },
  ],
  audience_pain_points: [
    { section: "target_audience", weight: 0.85 },
    { section: "ftue", weight: 0.75 },
    { section: "core_gameplay_loop", weight: 0.5 },
  ],
  mechanics_systems: [
    { section: "new_mechanics", weight: 1 },
    { section: "core_gameplay_loop", weight: 0.75 },
    { section: "controls", weight: 0.45 },
  ],
  core_loop_support: [
    { section: "core_gameplay_loop", weight: 1 },
    { section: "new_mechanics", weight: 0.7 },
  ],
  tension_fail_state_logic: [
    { section: "core_gameplay_loop", weight: 0.95 },
    { section: "new_mechanics", weight: 0.65 },
    { section: "risks_assumptions", weight: 0.55 },
  ],
  level_content_framework: [
    { section: "new_mechanics", weight: 0.8 },
    { section: "core_gameplay_loop", weight: 0.65 },
    { section: "meta_layer", weight: 0.4 },
  ],
  queue_tuning: [
    { section: "new_mechanics", weight: 0.85 },
    { section: "core_gameplay_loop", weight: 0.55 },
    { section: "economy", weight: 0.45 },
  ],
  numeric_tuning: [
    { section: "new_mechanics", weight: 0.8 },
    { section: "economy", weight: 0.65 },
    { section: "core_gameplay_loop", weight: 0.55 },
  ],
  reward_payoff_design: [
    { section: "economy", weight: 0.9 },
    { section: "meta_layer", weight: 0.55 },
    { section: "monetization", weight: 0.5 },
  ],
  progression_retention_support: [
    { section: "meta_layer", weight: 1 },
    { section: "core_gameplay_loop", weight: 0.65 },
    { section: "live_ops", weight: 0.6 },
  ],
  recovery_continue_design: [
    { section: "ftue", weight: 0.85 },
    { section: "core_gameplay_loop", weight: 0.75 },
    { section: "meta_layer", weight: 0.5 },
  ],
  tutorial_onboarding_support: [
    { section: "ftue", weight: 1 },
    { section: "controls", weight: 0.6 },
    { section: "target_audience", weight: 0.4 },
  ],
  economy_reward_flow: [
    { section: "economy", weight: 1 },
    { section: "monetization", weight: 0.75 },
    { section: "meta_layer", weight: 0.6 },
  ],
  ui_hud_controls_support: [
    { section: "controls", weight: 1 },
    { section: "ftue", weight: 0.65 },
    { section: "aesthetic_direction", weight: 0.45 },
  ],
  production_scope_notes: [
    { section: "risks_assumptions", weight: 0.9 },
    { section: "design_goals", weight: 0.55 },
    { section: "live_ops", weight: 0.4 },
  ],
  risks_assumptions_support: [
    { section: "risks_assumptions", weight: 1 },
    { section: "design_goals", weight: 0.45 },
  ],
  analytics_kpi_notes: [
    { section: "live_ops", weight: 0.85 },
    { section: "meta_layer", weight: 0.7 },
    { section: "core_gameplay_loop", weight: 0.45 },
  ],
  appendix_notes: [
    { section: "risks_assumptions", weight: 0.45 },
    { section: "design_goals", weight: 0.35 },
  ],
  supporting_notes: [
    { section: "design_goals", weight: 0.5 },
    { section: "risks_assumptions", weight: 0.45 },
  ],
  reference_notes: [
    { section: "design_goals", weight: 0.55 },
    { section: "target_audience", weight: 0.4 },
    { section: "new_mechanics", weight: 0.45 },
  ],
  unknown_unmapped: [],
};
