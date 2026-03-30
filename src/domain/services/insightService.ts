import { SCORECARD_CATEGORIES } from "@/domain/models/constants";
import type { AuditResult, InsightReport, Scorecard } from "@/domain/models";

const AUDIT_CATEGORY_MAP: Record<string, string[]> = {
  core_loop_strength: ["core_gameplay_loop", "core_pillars", "new_mechanics"],
  retention_potential: ["meta_layer", "live_ops", "ftue"],
  progression_depth: ["meta_layer", "economy"],
  monetization_fit: ["monetization", "economy"],
  production_feasibility: ["risks_assumptions", "controls", "new_mechanics"],
  marketability: ["game_overview", "target_audience", "design_goals"],
  ux_clarity: ["controls", "ftue", "game_overview"],
  hybrid_casual_fit: ["core_gameplay_loop", "target_audience", "live_ops"],
};

function average(values: number[]) {
  if (values.length === 0) return 0;
  return Math.round(values.reduce((sum, value) => sum + value, 0) / values.length);
}

function classifyPair(audit: number, scorecard: number) {
  const a = audit >= 75 ? "high" : audit < 60 ? "low" : "mid";
  const s = scorecard >= 75 ? "high" : scorecard < 60 ? "low" : "mid";
  return `${a}_${s}`;
}

export function generateInsightReport(
  projectId: string,
  versionId: string,
  audit: AuditResult,
  scorecard: Scorecard,
): InsightReport {
  const bySection = new Map(audit.findings.map((finding) => [finding.sectionKey, finding.score]));

  const auditScores: Record<string, number> = {};
  const scorecardScores: Record<string, number> = {};
  const deltas: Record<string, number> = {};

  const strengths: string[] = [];
  const gaps: string[] = [];
  const recommendations: string[] = [];

  for (const category of SCORECARD_CATEGORIES) {
    const sectionKeys = AUDIT_CATEGORY_MAP[category.key] ?? [];
    const auditScore = average(sectionKeys.map((key) => bySection.get(key) ?? 0));
    const scoreScore = scorecard.categoryScores[category.key] ?? 0;
    const delta = Math.round((scoreScore - auditScore) * 10) / 10;

    auditScores[category.key] = auditScore;
    scorecardScores[category.key] = scoreScore;
    deltas[category.key] = delta;

    const caseKey = classifyPair(auditScore, scoreScore);

    if (caseKey === "high_high") {
      strengths.push(`${category.label}: aligned and strong.`);
    }
    if (caseKey === "low_low") {
      gaps.push(`${category.label}: weak in both documentation and design confidence.`);
      recommendations.push(`Prioritize a focused rewrite and validation sprint for ${category.label}.`);
    }
    if (caseKey === "low_high") {
      gaps.push(`${category.label}: design confidence exceeds document evidence.`);
      recommendations.push(`Add evidence-backed detail in GDD sections tied to ${category.label}.`);
    }
    if (caseKey === "high_low") {
      gaps.push(`${category.label}: documentation strong, reviewer confidence lagging.`);
      recommendations.push(`Run design review workshop to align interpretation for ${category.label}.`);
    }
  }

  const summary =
    gaps.length === 0
      ? "Audit and scorecard are well aligned with no major risk deltas."
      : `Detected ${gaps.length} notable alignment gaps between documentation quality and design scoring.`;

  return {
    id: `insight_${crypto.randomUUID()}`,
    projectId,
    versionId,
    createdAt: new Date().toISOString(),
    auditScores,
    scorecardScores,
    deltas,
    summary,
    strengths,
    gaps,
    recommendations,
  };
}
