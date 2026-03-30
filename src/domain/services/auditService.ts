import {
  CALIBRATION_PENALTIES,
  CONFIDENCE_THRESHOLDS,
  HEALTH_SCORE_BANDS,
  HEALTH_THRESHOLDS,
  IMPORTANCE_WEIGHTS,
  PARSER_SCORE_ADJUSTMENT,
  SECTION_IMPORTANCE,
  type SectionImportance,
} from "@/domain/config/auditRubric";
import { GDD_SECTION_TEMPLATES, type GddSectionKey } from "@/domain/models/constants";
import type {
  AuditConfidenceLevel,
  AuditResult,
  GDDSection,
  GDDVersion,
  HealthLevel,
  SourceItem,
} from "@/domain/models";
import { buildAuditDebugInfo } from "@/domain/services/buildAuditDebugInfo";
import { extractStructuredBlocksFromSources } from "@/domain/services/buildStructuredGdd";
import { computeParserCoverage, getParserCoverageWarning } from "@/domain/services/parserCoverage";

const VAGUE_TERMS = [
  "maybe",
  "etc",
  "some",
  "various",
  "kind of",
  "probably",
  "co the",
  "nhieu",
  "mot so",
];
const EVIDENCE_TERMS = [
  "source",
  "benchmark",
  "data",
  "metric",
  "evidence",
  "test",
  "nguon",
  "du lieu",
  "chi so",
  "kiem chung",
];
const SPECIFICITY_TERMS = [
  "loop",
  "kpi",
  "system",
  "mechanic",
  "resource",
  "flow",
  "cadence",
  "milestone",
  "constraint",
  "session",
  "vong lap",
  "co che",
  "tai nguyen",
  "chi tieu",
  "han che",
  "ke hoach",
];
const CONTRADICTION_RULES: Array<[string, string]> = [
  ["turn-based", "real-time"],
  ["single-player only", "multiplayer only"],
  ["premium", "free-to-play"],
  ["no monetization", "battle pass"],
  ["offline only", "live ops"],
];

type QualitySignals = {
  lengthScore: number;
  specificityScore: number;
  evidenceScore: number;
  clarityScore: number;
  structureScore: number;
  mappedBlockScore: number;
  qualityIndex: number;
};

function clamp01(value: number): number {
  return Math.max(0, Math.min(1, value));
}

function detectUnsupportedClaims(content: string): string[] {
  const sentences = content
    .split(/[.!?]/)
    .map((s) => s.trim())
    .filter(Boolean);

  return sentences.filter((sentence) => {
    const lower = sentence.toLowerCase();
    const hasClaim =
      /\d+%|always|guarantee|proven|will increase|best-in-class|chac chan|tot nhat/.test(lower);
    const hasEvidence = EVIDENCE_TERMS.some((token) => lower.includes(token));
    return hasClaim && !hasEvidence;
  });
}

function detectContradictions(section: GDDSection, fullText: string): string[] {
  const hits: string[] = [];
  const local = section.content.toLowerCase();
  const global = fullText.toLowerCase();

  for (const [a, b] of CONTRADICTION_RULES) {
    if ((local.includes(a) && global.includes(b)) || (local.includes(b) && global.includes(a))) {
      hits.push(`Potential contradiction: "${a}" vs "${b}"`);
    }
  }

  return hits;
}

function countTermMatches(content: string, terms: string[]): number {
  const lower = content.toLowerCase();
  return terms.reduce((sum, term) => sum + (lower.includes(term) ? 1 : 0), 0);
}

function deriveQualitySignals(content: string, mappedBlockCount: number): QualitySignals {
  const trimmed = content.trim();
  const length = trimmed.length;
  const lineCount = trimmed.split("\n").filter((line) => line.trim().length > 0).length;

  const lengthScore = clamp01(length / 650);
  const specificityScore = clamp01(countTermMatches(trimmed, SPECIFICITY_TERMS) / 5);
  const evidenceScore = clamp01(countTermMatches(trimmed, EVIDENCE_TERMS) / 4);
  const vagueRatio = clamp01(countTermMatches(trimmed, VAGUE_TERMS) / 4);
  const clarityScore = clamp01(0.9 - vagueRatio);
  const structureScore = clamp01(lineCount / 14);
  const mappedBlockScore = clamp01(mappedBlockCount / 3);

  const qualityIndex = clamp01(
    lengthScore * 0.2 +
      specificityScore * 0.25 +
      evidenceScore * 0.15 +
      clarityScore * 0.2 +
      structureScore * 0.1 +
      mappedBlockScore * 0.1,
  );

  return {
    lengthScore,
    specificityScore,
    evidenceScore,
    clarityScore,
    structureScore,
    mappedBlockScore,
    qualityIndex,
  };
}

function classifyHealth(content: string, qualityIndex: number): HealthLevel {
  const trimmed = content.trim();
  if (trimmed.length <= HEALTH_THRESHOLDS.missingContentLengthMax) {
    return "missing";
  }
  if (qualityIndex >= HEALTH_THRESHOLDS.strongMin) {
    return "strong";
  }
  if (qualityIndex >= HEALTH_THRESHOLDS.mediumMin) {
    return "medium";
  }
  if (qualityIndex >= HEALTH_THRESHOLDS.weakMin) {
    return "weak";
  }
  return "missing";
}

function scoreWithinBand(health: HealthLevel, qualityIndex: number): number {
  const band = HEALTH_SCORE_BANDS[health];
  return Math.round(band.min + (band.max - band.min) * clamp01(qualityIndex));
}

function applySectionPenalties(params: {
  unsupportedClaims: number;
  contradictions: number;
}): { penalty: number; unsupportedPenalty: number; contradictionPenalty: number } {
  const unsupportedPenalty = Math.min(
    CALIBRATION_PENALTIES.unsupportedClaimPenaltyCapPerSection,
    params.unsupportedClaims * CALIBRATION_PENALTIES.unsupportedClaimPenalty,
  );
  const contradictionPenalty = Math.min(
    CALIBRATION_PENALTIES.contradictionPenaltyCapPerSection,
    params.contradictions * CALIBRATION_PENALTIES.contradictionPenalty,
  );
  return {
    penalty: unsupportedPenalty + contradictionPenalty,
    unsupportedPenalty,
    contradictionPenalty,
  };
}

function computeMissingPenaltyByImportance(
  sections: Array<{ key: GddSectionKey; health: HealthLevel }>,
): { amount: number; affectedSections: string[] } {
  const missingCritical = sections.filter(
    (section) => SECTION_IMPORTANCE[section.key] === "critical" && section.health === "missing",
  );
  const missingImportant = sections.filter(
    (section) => SECTION_IMPORTANCE[section.key] === "important" && section.health === "missing",
  );
  const missingSupporting = sections.filter(
    (section) => SECTION_IMPORTANCE[section.key] === "supporting" && section.health === "missing",
  );

  const penaltyCritical = Math.min(
    CALIBRATION_PENALTIES.missingCriticalPenaltyCap,
    missingCritical.length * CALIBRATION_PENALTIES.missingCriticalPenalty,
  );
  const penaltyImportant = Math.min(
    CALIBRATION_PENALTIES.missingImportantPenaltyCap,
    missingImportant.length * CALIBRATION_PENALTIES.missingImportantPenalty,
  );
  const penaltySupporting = Math.min(
    CALIBRATION_PENALTIES.missingSupportingPenaltyCap,
    missingSupporting.length * CALIBRATION_PENALTIES.missingSupportingPenalty,
  );

  return {
    amount: penaltyCritical + penaltyImportant + penaltySupporting,
    affectedSections: [...missingCritical, ...missingImportant, ...missingSupporting].map(
      (section) => section.key,
    ),
  };
}

function deriveAuditConfidence(params: {
  mappedPercent: number;
  lowConfidenceBlocks: number;
  totalBlocks: number;
  emptySections: number;
}): AuditConfidenceLevel {
  if (params.totalBlocks === 0) {
    return "low";
  }
  const lowConfidenceRatio = params.totalBlocks === 0 ? 1 : params.lowConfidenceBlocks / params.totalBlocks;

  if (
    params.mappedPercent >= CONFIDENCE_THRESHOLDS.highCoverageMin &&
    lowConfidenceRatio <= CONFIDENCE_THRESHOLDS.highLowConfidenceRatioMax &&
    params.emptySections <= CONFIDENCE_THRESHOLDS.maxEmptySectionsForHigh
  ) {
    return "high";
  }

  if (
    params.mappedPercent >= CONFIDENCE_THRESHOLDS.mediumCoverageMin &&
    lowConfidenceRatio <= CONFIDENCE_THRESHOLDS.mediumLowConfidenceRatioMax
  ) {
    return "medium";
  }

  return "low";
}

function parserScoreAdjustment(params: {
  mappedPercent: number;
  lowConfidenceBlocks: number;
  totalBlocks: number;
}): number {
  if (params.totalBlocks === 0) {
    return CALIBRATION_PENALTIES.parserUncertaintyPenaltyCap;
  }

  const lowConfidenceRatio = params.lowConfidenceBlocks / params.totalBlocks;
  if (params.mappedPercent < PARSER_SCORE_ADJUSTMENT.poorCoverageThreshold) {
    return CALIBRATION_PENALTIES.parserUncertaintyPenaltyCap;
  }
  if (
    params.mappedPercent < PARSER_SCORE_ADJUSTMENT.mildCoverageThreshold ||
    lowConfidenceRatio > PARSER_SCORE_ADJUSTMENT.lowConfidenceRatioThreshold
  ) {
    return Math.round(CALIBRATION_PENALTIES.parserUncertaintyPenaltyCap * 0.5);
  }
  return 0;
}

function legacyBaselineScore(findings: Array<{ score: number }>): number {
  return Math.round(findings.reduce((sum, item) => sum + item.score, 0) / Math.max(1, findings.length));
}

export function runAuditForVersion(
  projectId: string,
  version: GDDVersion,
  sources: SourceItem[] = [],
): AuditResult {
  const fullText = version.sections.map((section) => section.content).join("\n");
  const parsedBlocks = extractStructuredBlocksFromSources(sources);
  const parserCoverage =
    version.parserCoverage ??
    (parsedBlocks.length > 0 ? computeParserCoverage(parsedBlocks) : undefined);
  const parserWarning = parserCoverage ? getParserCoverageWarning(parserCoverage) : undefined;

  const findings = GDD_SECTION_TEMPLATES.map((template) => {
    const section = version.sections.find((item) => item.key === template.key);
    const content = section?.content?.trim() ?? "";
    const mappedBlockCount = version.sectionBuildMeta?.[template.key]?.blockCount ?? 0;

    const unsupportedClaims = content ? detectUnsupportedClaims(content) : [];
    const contradictions = content && section ? detectContradictions(section, fullText) : [];
    const signals = deriveQualitySignals(content, mappedBlockCount);
    const health = classifyHealth(content, signals.qualityIndex);

    const rawScore = scoreWithinBand(health, signals.qualityIndex);
    const penalty = applySectionPenalties({
      unsupportedClaims: unsupportedClaims.length,
      contradictions: contradictions.length,
    });
    const score = Math.max(HEALTH_SCORE_BANDS[health].min, rawScore - penalty.penalty);

    const gaps: string[] = [];
    if (health === "missing") gaps.push("Section is absent or effectively empty.");
    if (signals.specificityScore < 0.35) {
      gaps.push("Content lacks enough concrete mechanics, constraints, or system specifics.");
    }
    if (signals.evidenceScore < 0.25) {
      gaps.push("Add references, metrics, or evidence-backed support for key claims.");
    }
    if (signals.clarityScore < 0.45) {
      gaps.push("Content is too vague; replace generic language with actionable detail.");
    }
    if (mappedBlockCount === 0 && content.length > HEALTH_THRESHOLDS.missingContentLengthMax) {
      gaps.push("Section content exists but has limited source-block mapping support.");
    }

    return {
      sectionKey: template.key,
      health,
      score,
      unsupportedClaims,
      contradictions,
      gaps,
      rewriteBrief:
        health === "weak" || health === "missing"
          ? `Rewrite ${template.title} with concrete production detail, clear ownership assumptions, and evidence-backed claims.`
          : undefined,
      scoreBreakdown: {
        baseScore: rawScore,
        detailScore: Math.round(signals.qualityIndex * 100),
        penalties: [
          {
            type: "unsupported_claim_penalty",
            amount: penalty.unsupportedPenalty,
            reason: "Claims detected without supporting evidence terms.",
          },
          {
            type: "contradiction_penalty",
            amount: penalty.contradictionPenalty,
            reason: "Potential contradiction against other sections.",
          },
        ],
        adjustedScore: score,
      },
    };
  });

  const weighted = findings.reduce(
    (acc, finding) => {
      const importance = SECTION_IMPORTANCE[finding.sectionKey as GddSectionKey] as SectionImportance;
      const weight = IMPORTANCE_WEIGHTS[importance];
      return {
        weightedSum: acc.weightedSum + finding.score * weight,
        weightSum: acc.weightSum + weight,
      };
    },
    { weightedSum: 0, weightSum: 0 },
  );
  const weightedAverage = weighted.weightSum > 0 ? weighted.weightedSum / weighted.weightSum : 0;

  const missingPenalty = computeMissingPenaltyByImportance(
    findings.map((finding) => ({
      key: finding.sectionKey as GddSectionKey,
      health: finding.health,
    })),
  );

  const totalUnsupportedClaims = findings.reduce(
    (sum, finding) => sum + finding.unsupportedClaims.length,
    0,
  );
  const totalContradictions = findings.reduce((sum, finding) => sum + finding.contradictions.length, 0);

  const globalUnsupportedPenalty = Math.min(
    CALIBRATION_PENALTIES.globalUnsupportedPenaltyCap,
    totalUnsupportedClaims * CALIBRATION_PENALTIES.globalUnsupportedPenaltyFactor,
  );
  const globalContradictionPenalty = Math.min(
    CALIBRATION_PENALTIES.globalContradictionPenaltyCap,
    totalContradictions * CALIBRATION_PENALTIES.globalContradictionPenaltyFactor,
  );

  const parserPenalty = parserCoverage
    ? parserScoreAdjustment({
        mappedPercent: parserCoverage.mappedPercent,
        lowConfidenceBlocks: parserCoverage.lowConfidenceBlocks,
        totalBlocks: parserCoverage.totalBlocks,
      })
    : 0;

  const totalPenalty = missingPenalty.amount + globalUnsupportedPenalty + globalContradictionPenalty + parserPenalty;
  const overallScore = Math.max(15, Math.min(98, Math.round(weightedAverage - totalPenalty)));

  const strong = findings.filter((item) => item.health === "strong").length;
  const medium = findings.filter((item) => item.health === "medium").length;
  const weakOrMissing = findings.filter(
    (item) => item.health === "weak" || item.health === "missing",
  ).length;

  const auditConfidence = parserCoverage
    ? deriveAuditConfidence({
        mappedPercent: parserCoverage.mappedPercent,
        lowConfidenceBlocks: parserCoverage.lowConfidenceBlocks,
        totalBlocks: parserCoverage.totalBlocks,
        emptySections: parserCoverage.emptySections,
      })
    : "medium";

  const readinessSummary =
    overallScore >= 80
      ? `Document quality is strong (${strong} strong sections, ${medium} medium). Focus on ${weakOrMissing} weak/missing sections before sign-off.`
      : overallScore >= 62
        ? `Document is partially production-usable. Strengthen ${weakOrMissing} weak/missing sections for safer execution.`
        : `Readiness is limited. ${weakOrMissing} sections need significant improvement before production alignment.`;

  const partial: AuditResult = {
    id: `audit_${crypto.randomUUID()}`,
    projectId,
    versionId: version.id,
    createdAt: new Date().toISOString(),
    overallScore,
    readinessSummary: parserWarning ? `${readinessSummary} ${parserWarning}` : readinessSummary,
    findings,
    parserCoverage,
    confidenceWarning: parserWarning,
    auditConfidence,
  };

  const debugInfo = buildAuditDebugInfo(partial, sources, version);
  const legacyScore = legacyBaselineScore(findings);
  debugInfo.aggregation.weightedAverage = Math.round(weightedAverage);
  debugInfo.notes.push(
    "This audit model is calibrated to a production-oriented reference rubric.",
    "Score and confidence are separate signals; parser coverage affects confidence more than score.",
    `Calibration helper: legacy-style baseline estimate ${legacyScore}, calibrated final ${overallScore}.`,
  );

  return {
    ...partial,
    debugInfo,
  };
}
