import { CROSS_SECTION_SUPPORT_RULES } from "@/domain/config/crossSectionSupportRules";
import { SUPPORT_BUCKET_CONFIG, type SupportBucket } from "@/domain/config/supportBuckets";
import type { MappingConfidence, ParsedBlock } from "@/domain/models";
import type { GddSectionKey } from "@/domain/models/constants";

export type MappedBlock = {
  blockId: string;
  primaryBucket: string;
  primaryCanonicalSection?: GddSectionKey;
  supportCanonicalSections: GddSectionKey[];
  confidence: MappingConfidence;
  reasoning: string[];
};

function confidenceRank(confidence: MappingConfidence): number {
  if (confidence === "high") return 3;
  if (confidence === "medium") return 2;
  if (confidence === "low") return 1;
  return 0;
}

function mergeSupport(base: GddSectionKey[], extra: GddSectionKey[]): GddSectionKey[] {
  return Array.from(new Set([...base, ...extra]));
}

export function applyCrossSectionSupport(block: ParsedBlock): MappedBlock {
  const supportFromBlock = (block.supportCanonicalSections ?? []) as GddSectionKey[];
  const mappedPrimary = block.primaryCanonicalSection as GddSectionKey | undefined;
  const mappedSection = block.mappedSectionKey as GddSectionKey | undefined;
  const primaryCanonicalSection = mappedPrimary ?? mappedSection;

  const bucketKey = (block.primaryBucket ?? block.mappedBucket ?? "unknown_unmapped") as SupportBucket;
  const byRule = CROSS_SECTION_SUPPORT_RULES[bucketKey] ?? [];
  const ruleSupport = byRule
    .filter((item) => item.weight >= 0.45)
    .map((item) => item.section);

  const bucketHint = SUPPORT_BUCKET_CONFIG[bucketKey]?.supportCanonical ?? [];

  let supportCanonicalSections = mergeSupport(mergeSupport(ruleSupport, bucketHint), supportFromBlock);

  if (primaryCanonicalSection) {
    supportCanonicalSections = supportCanonicalSections.filter((key) => key !== primaryCanonicalSection);
  }

  const confidence = block.mappingConfidence ?? "unmapped";
  if (confidenceRank(confidence) <= 1) {
    supportCanonicalSections = supportCanonicalSections.slice(0, 2);
  }

  return {
    blockId: block.id,
    primaryBucket: bucketKey,
    primaryCanonicalSection,
    supportCanonicalSections,
    confidence,
    reasoning: [...(block.mappingReasons ?? [])],
  };
}
