import {
  SCORECARD_CATEGORIES,
  type ScorecardCategoryKey,
  type ScorecardCategoryScores,
} from "@/domain/models/constants";

export function emptyScorecardScores(): ScorecardCategoryScores {
  return SCORECARD_CATEGORIES.reduce((acc, item) => {
    acc[item.key] = 50;
    return acc;
  }, {} as ScorecardCategoryScores);
}

export function normalizeScoreInput(input: Partial<Record<ScorecardCategoryKey, number>>) {
  const output = emptyScorecardScores();

  for (const category of SCORECARD_CATEGORIES) {
    const value = input[category.key];
    output[category.key] = Math.max(0, Math.min(100, Number(value ?? output[category.key])));
  }

  return output;
}

export function computeWeightedScore(scores: ScorecardCategoryScores): number {
  const totalWeight = SCORECARD_CATEGORIES.reduce((sum, item) => sum + item.weight, 0);
  const weighted = SCORECARD_CATEGORIES.reduce((sum, item) => {
    return sum + scores[item.key] * item.weight;
  }, 0);

  return Math.round((weighted / totalWeight) * 10) / 10;
}
