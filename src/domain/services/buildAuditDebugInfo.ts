import { GDD_SECTION_TEMPLATES } from "@/domain/models/constants";
import type {
  AuditConfidenceLevel,
  AuditDebugInfo,
  AuditPenaltyDebug,
  AuditResult,
  CanonicalSectionDebug,
  GDDVersion,
  MappedBlockDebug,
  MappingConfidence,
  SourceItem,
} from "@/domain/models";
import {
  CALIBRATION_PENALTIES,
  IMPORTANCE_WEIGHTS,
  SECTION_IMPORTANCE,
} from "@/domain/config/auditRubric";
import { SUPPORT_BUCKET_LABELS } from "@/domain/config/supportBuckets";
import { mapHeadingToSection } from "@/domain/services/mapSections";
import { computeParserCoverage } from "@/domain/services/parserCoverage";

type SourceBlockWithContext = {
  sourceTitle: string;
  sourceType?: string;
  blockId: string;
  heading?: string;
  content: string;
  primaryBucket?: string;
  mappedSectionKey?: string;
  primaryCanonicalSection?: string;
  supportCanonicalSections: string[];
  mappingConfidence: MappingConfidence;
  mappingMode: "automatic" | "manual";
  mappingReasons?: string[];
};

function toSnippet(content: string): string {
  return content.replace(/\s+/g, " ").trim().slice(0, 180);
}

function summarizeMappingConfidence(values: MappingConfidence[]): "high" | "medium" | "low" | "none" {
  if (values.length === 0) return "none";
  if (values.includes("high")) return "high";
  if (values.includes("medium")) return "medium";
  if (values.includes("low")) return "low";
  return "none";
}

function collectSourceBlocks(sources: SourceItem[]): SourceBlockWithContext[] {
  const blocks: SourceBlockWithContext[] = [];

  sources.forEach((source) => {
    if (source.parsedDocument?.blocks?.length) {
      source.parsedDocument.blocks.forEach((block) => {
        const autoMapped = mapHeadingToSection(block.heading, block.content).sectionKey;
        const mappingMode: "automatic" | "manual" =
          block.manualMapping || (block.mappedSectionKey && autoMapped !== block.mappedSectionKey)
            ? "manual"
            : "automatic";
        blocks.push({
          sourceTitle: source.title,
          sourceType: source.type,
          blockId: block.id,
          heading: block.heading,
          content: block.content,
          primaryBucket: block.primaryBucket ?? block.mappedBucket,
          mappedSectionKey: block.mappedSectionKey,
          primaryCanonicalSection: block.primaryCanonicalSection ?? block.mappedSectionKey,
          supportCanonicalSections: block.supportCanonicalSections ?? [],
          mappingConfidence: block.mappingConfidence ?? "unmapped",
          mappingMode,
          mappingReasons: block.mappingReasons,
        });
      });
      return;
    }

    const fallback = (source.content ?? source.url ?? "").trim();
    if (!fallback) {
      return;
    }
    const autoMapped = mapHeadingToSection(source.title, fallback).sectionKey;
    blocks.push({
      sourceTitle: source.title,
      sourceType: source.type,
      blockId: `raw_${source.id}`,
      heading: source.title,
      content: fallback,
      primaryBucket: autoMapped,
      mappedSectionKey: autoMapped,
      primaryCanonicalSection: autoMapped,
      supportCanonicalSections: [],
      mappingConfidence: autoMapped ? "low" : "unmapped",
      mappingMode: "automatic",
      mappingReasons: autoMapped ? ["fallback_heading_match"] : ["fallback_unmapped"],
    });
  });

  return blocks;
}

function deriveAuditConfidence(params: {
  mappedPercent: number;
  emptySections: number;
  lowConfidenceBlocks: number;
  totalBlocks: number;
}): AuditConfidenceLevel {
  if (params.totalBlocks === 0 || params.mappedPercent < 50) {
    return "low";
  }
  if (
    params.mappedPercent >= 75 &&
    params.lowConfidenceBlocks <= Math.max(2, params.totalBlocks * 0.25) &&
    params.emptySections <= 5
  ) {
    return "high";
  }
  return "medium";
}

function asDebugBlock(
  block: SourceBlockWithContext,
  contributionMode: "direct" | "support",
): MappedBlockDebug {
  return {
    blockId: block.blockId,
    sourceTitle: block.sourceTitle,
    heading: block.heading,
    snippet: toSnippet(block.content),
    mappedSectionKey: block.mappedSectionKey,
    primaryBucket: block.primaryBucket,
    primaryCanonicalSection: block.primaryCanonicalSection,
    supportCanonicalSections: block.supportCanonicalSections,
    contributionMode,
    reasoning: block.mappingReasons,
    mappingConfidence: block.mappingConfidence,
    sourceType: block.sourceType,
    mappingMode: block.mappingMode,
  };
}

function buildFromMaterialization(
  version: GDDVersion,
  sourceBlockMap: Map<string, SourceBlockWithContext>,
): CanonicalSectionDebug[] | undefined {
  if (!version.materializationDebug?.sections?.length) return undefined;

  return version.materializationDebug.sections.map((section) => {
    const convertContributor = (
      blockId: string,
      contributionMode: "direct" | "support" | "descendant",
      fallback: {
        heading?: string;
        bucket?: string;
        supportSections?: string[];
        contentPreview: string;
        reason?: string;
      },
    ): MappedBlockDebug => {
      const sourceBlock = sourceBlockMap.get(blockId);
      if (sourceBlock) {
        return {
          ...asDebugBlock(
            sourceBlock,
            contributionMode === "direct" ? "direct" : "support",
          ),
          contributionMode,
        };
      }
      return {
        blockId,
        sourceTitle: "Materialized block",
        heading: fallback.heading,
        snippet: fallback.contentPreview,
        primaryBucket: fallback.bucket,
        supportCanonicalSections: fallback.supportSections,
        contributionMode,
        mappingConfidence: "low",
        reasoning: fallback.reason ? [fallback.reason] : undefined,
      };
    };

    const directBlocks = section.directContributors.map((item) =>
      convertContributor(item.blockId, "direct", {
        heading: item.heading,
        bucket: item.bucket,
        supportSections: item.supportSections,
        contentPreview: item.contentPreview,
        reason: item.reason,
      }),
    );
    const supportBlocks = section.supportContributors.map((item) =>
      convertContributor(item.blockId, "support", {
        heading: item.heading,
        bucket: item.bucket,
        supportSections: item.supportSections,
        contentPreview: item.contentPreview,
        reason: item.reason,
      }),
    );
    const descendantBlocks = section.descendantContributors.map((item) =>
      convertContributor(item.blockId, "descendant", {
        heading: item.heading,
        bucket: item.bucket,
        supportSections: item.supportSections,
        contentPreview: item.contentPreview,
        reason: item.reason,
      }),
    );

    const mappedBlocks = [...directBlocks, ...supportBlocks, ...descendantBlocks];

    return {
      sectionKey: section.sectionKey,
      title: section.title,
      contentLength: section.totalChars,
      mappedBlockCount: section.totalBlocks,
      directBlockCount: section.directContributors.length,
      supportBlockCount: section.supportContributors.length + section.descendantContributors.length,
      supportBuckets: Array.from(
        new Set(
          [...section.supportContributors, ...section.descendantContributors]
            .map((item) => item.bucket)
            .filter((bucket): bucket is string => Boolean(bucket)),
        ),
      ),
      mappingConfidence: summarizeMappingConfidence(mappedBlocks.map((block) => block.mappingConfidence)),
      health: "missing",
      rawScore: 0,
      adjustedScore: 0,
      reasons: section.notes,
      mappedBlocks,
    };
  });
}

export function buildAuditDebugInfo(
  audit: AuditResult,
  sources: SourceItem[],
  version?: GDDVersion,
): AuditDebugInfo {
  const sourceBlocks = collectSourceBlocks(sources);
  const sourceBlockMap = new Map(sourceBlocks.map((block) => [block.blockId, block]));
  const coverage =
    audit.parserCoverage ??
    version?.parserCoverage ??
    computeParserCoverage(
      sourceBlocks.map((block) => ({
        id: block.blockId,
        content: block.content,
        mappedSectionKey: block.mappedSectionKey,
        primaryCanonicalSection: block.primaryCanonicalSection,
        supportCanonicalSections: block.supportCanonicalSections,
        mappingConfidence: block.mappingConfidence,
        mappedBucket: block.primaryBucket,
      })),
    );

  const fromMaterialization = version ? buildFromMaterialization(version, sourceBlockMap) : undefined;

  const canonicalSections: CanonicalSectionDebug[] = GDD_SECTION_TEMPLATES.map((template) => {
    const finding = audit.findings.find((item) => item.sectionKey === template.key);
    const materialized = fromMaterialization?.find((section) => section.sectionKey === template.key);

    if (materialized) {
      const reasons = [...materialized.reasons];
      if (finding?.gaps?.length) reasons.push(...finding.gaps);
      if (finding?.health === "weak" || finding?.health === "missing") {
        reasons.push("Section needs more specific, source-backed detail.");
      }

      return {
        ...materialized,
        health: finding?.health ?? materialized.health,
        rawScore: finding?.score ?? materialized.rawScore,
        adjustedScore: finding?.score ?? materialized.adjustedScore,
        reasons: reasons.length > 0 ? reasons : ["No major issues detected in this section."],
      };
    }

    const direct = sourceBlocks.filter(
      (block) => block.primaryCanonicalSection === template.key || block.mappedSectionKey === template.key,
    );
    const support = sourceBlocks.filter(
      (block) => !direct.some((item) => item.blockId === block.blockId) && block.supportCanonicalSections.includes(template.key),
    );

    const mappedBlocks: MappedBlockDebug[] = [
      ...direct.map((block) => asDebugBlock(block, "direct")),
      ...support.map((block) => asDebugBlock(block, "support")),
    ];

    const reasons: string[] = [...(finding?.gaps ?? [])];
    if (direct.length === 0 && support.length === 0) {
      reasons.push("Insufficient mapped content for this section.");
    }
    if (support.length > 0) {
      reasons.push(
        `Support-bucket contributions: ${Array.from(
          new Set(support.map((block) => block.primaryBucket).filter((bucket): bucket is string => Boolean(bucket))),
        )
          .map((bucket) => SUPPORT_BUCKET_LABELS[bucket as keyof typeof SUPPORT_BUCKET_LABELS] ?? bucket)
          .join(", ")}`,
      );
    }
    if (mappedBlocks.some((block) => block.mappingConfidence === "low" || block.mappingConfidence === "unmapped")) {
      reasons.push("Low parser confidence in one or more contributing blocks.");
    }
    if (finding?.health === "weak" || finding?.health === "missing") {
      reasons.push("Section needs more specific, source-backed detail.");
    }

    return {
      sectionKey: template.key,
      title: template.title,
      contentLength: Math.max(0, mappedBlocks.reduce((sum, block) => sum + block.snippet.length, 0)),
      mappedBlockCount: mappedBlocks.length,
      directBlockCount: direct.length,
      supportBlockCount: support.length,
      supportBuckets: Array.from(
        new Set(support.map((block) => block.primaryBucket).filter((bucket): bucket is string => Boolean(bucket))),
      ),
      mappingConfidence: summarizeMappingConfidence(mappedBlocks.map((block) => block.mappingConfidence)),
      health: finding?.health ?? "missing",
      rawScore: finding?.score ?? 0,
      adjustedScore: finding?.score ?? 0,
      reasons: reasons.length > 0 ? reasons : ["No major issues detected in this section."],
      mappedBlocks,
    };
  });

  const missingSections = canonicalSections.filter((item) => item.health === "missing").map((item) => item.sectionKey);

  const unsupportedCount = audit.findings.reduce((sum, item) => sum + item.unsupportedClaims.length, 0);
  const contradictionCount = audit.findings.reduce((sum, item) => sum + item.contradictions.length, 0);
  const unsupportedPenalty = audit.findings.reduce(
    (sum, item) =>
      sum +
      (item.scoreBreakdown?.penalties.find((penalty) => penalty.type === "unsupported_claim_penalty")?.amount ?? 0),
    0,
  );
  const contradictionPenalty = audit.findings.reduce(
    (sum, item) =>
      sum +
      (item.scoreBreakdown?.penalties.find((penalty) => penalty.type === "contradiction_penalty")?.amount ?? 0),
    0,
  );

  const missingByImportance = missingSections.reduce(
    (acc, sectionKey) => {
      const importance = SECTION_IMPORTANCE[sectionKey as keyof typeof SECTION_IMPORTANCE];
      if (importance === "critical") acc.critical += 1;
      if (importance === "important") acc.important += 1;
      if (importance === "supporting") acc.supporting += 1;
      return acc;
    },
    { critical: 0, important: 0, supporting: 0 },
  );

  const missingPenalty =
    Math.min(
      CALIBRATION_PENALTIES.missingCriticalPenaltyCap,
      missingByImportance.critical * CALIBRATION_PENALTIES.missingCriticalPenalty,
    ) +
    Math.min(
      CALIBRATION_PENALTIES.missingImportantPenaltyCap,
      missingByImportance.important * CALIBRATION_PENALTIES.missingImportantPenalty,
    ) +
    Math.min(
      CALIBRATION_PENALTIES.missingSupportingPenaltyCap,
      missingByImportance.supporting * CALIBRATION_PENALTIES.missingSupportingPenalty,
    );

  const globalUnsupportedPenalty = Math.min(
    CALIBRATION_PENALTIES.globalUnsupportedPenaltyCap,
    unsupportedCount * CALIBRATION_PENALTIES.globalUnsupportedPenaltyFactor,
  );
  const globalContradictionPenalty = Math.min(
    CALIBRATION_PENALTIES.globalContradictionPenaltyCap,
    contradictionCount * CALIBRATION_PENALTIES.globalContradictionPenaltyFactor,
  );

  const penalties: AuditPenaltyDebug[] = [
    {
      type: "unsupported_claim_penalty",
      label: "Unsupported claim penalty",
      amount: unsupportedPenalty + globalUnsupportedPenalty,
      reason: "Applied per unsupported claim detected in section content.",
      affectedSections: audit.findings.filter((item) => item.unsupportedClaims.length > 0).map((item) => item.sectionKey),
    },
    {
      type: "contradiction_penalty",
      label: "Contradiction penalty",
      amount: contradictionPenalty + globalContradictionPenalty,
      reason: "Applied when contradiction heuristics detect conflicting statements.",
      affectedSections: audit.findings.filter((item) => item.contradictions.length > 0).map((item) => item.sectionKey),
    },
    {
      type: "missing_section_penalty",
      label: "Missing section pressure",
      amount: missingPenalty,
      reason: "Moderate penalty weighted by section importance for truly missing sections.",
      affectedSections: missingSections,
    },
    {
      type: "parser_uncertainty_adjustment",
      label: "Parser uncertainty adjustment",
      amount: Math.max(
        0,
        Math.min(CALIBRATION_PENALTIES.parserUncertaintyPenaltyCap, Math.round((100 - coverage.mappedPercent) / 12)),
      ),
      reason: "Small cap adjustment. Parser coverage impacts confidence more than score.",
    },
  ];

  const weightedParts = canonicalSections.reduce(
    (acc, section) => {
      const weight = IMPORTANCE_WEIGHTS[SECTION_IMPORTANCE[section.sectionKey as keyof typeof SECTION_IMPORTANCE]];
      return {
        sum: acc.sum + section.rawScore * weight,
        weight: acc.weight + weight,
      };
    },
    { sum: 0, weight: 0 },
  );
  const weightedAverage = weightedParts.weight > 0 ? weightedParts.sum / weightedParts.weight : 0;

  const overallAuditConfidence = deriveAuditConfidence({
    mappedPercent: coverage.mappedPercent,
    emptySections: coverage.emptySections,
    lowConfidenceBlocks: coverage.lowConfidenceBlocks,
    totalBlocks: coverage.totalBlocks,
  });

  const notes: string[] = [
    "Audit Debug helps explain how the current score was derived.",
    "Calibrated mode keeps score and confidence separate: parser coverage affects confidence more than score.",
    "Use this view to compare structure, mapping, and scoring logic across tools.",
  ];
  if (version?.materializationDebug) {
    notes.push("Audit section evidence is aligned with canonical section materialization output.");
  }
  if (overallAuditConfidence === "low") {
    notes.push("A low score may reflect weak source-to-section mapping, not only weak document quality.");
  }

  return {
    canonicalSections,
    unmappedBlocks: sourceBlocks
      .filter((block) => !block.primaryCanonicalSection && block.primaryBucket === "unknown_unmapped")
      .map((block) => asDebugBlock(block, "direct")),
    lowConfidenceBlocks: sourceBlocks
      .filter((block) => block.mappingConfidence === "low" || block.mappingConfidence === "unmapped")
      .map((block) => asDebugBlock(block, "direct")),
    parserCoverage: {
      totalBlocks: coverage.totalBlocks,
      mappedBlocks: coverage.mappedBlocks,
      unmappedBlocks: coverage.unmappedBlocks,
      coveragePercent: coverage.mappedPercent,
      sectionsWithMappedContent: coverage.sourceBackedSections,
      emptySections: coverage.emptySections,
    },
    penalties,
    aggregation: {
      method: "Weighted average of canonical section scores + moderate global adjustments",
      explanation:
        "Section scores use calibrated health bands and quality signals. Final score applies section-importance weighting and moderate penalties for true missing content, contradictions, unsupported claims, and parser uncertainty.",
      rawAverage: Math.round(
        canonicalSections.reduce((sum, section) => sum + section.rawScore, 0) / Math.max(1, canonicalSections.length),
      ),
      weightedAverage: Math.round(weightedAverage),
      finalScore: audit.overallScore,
    },
    overallAuditConfidence,
    notes,
  };
}
