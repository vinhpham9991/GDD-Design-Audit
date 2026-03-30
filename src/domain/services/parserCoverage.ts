import { GDD_SECTION_TEMPLATES } from "@/domain/models/constants";
import type { ParsedBlock, ParserCoverageSummary } from "@/domain/models";

export function computeParserCoverage(blocks: ParsedBlock[]): ParserCoverageSummary {
  const totalBlocks = blocks.length;
  const mappedBlocks = blocks.filter(
    (block) =>
      Boolean(block.primaryCanonicalSection) ||
      Boolean(block.mappedSectionKey) ||
      Boolean(block.mappedBucket && block.mappedBucket !== "unknown_unmapped") ||
      Boolean(block.supportCanonicalSections?.length),
  ).length;
  const unmappedBlocks = totalBlocks - mappedBlocks;
  const mappedPercent = totalBlocks === 0 ? 0 : Math.round((mappedBlocks / totalBlocks) * 100);

  const sectionKeys = new Set<string>();
  blocks.forEach((block) => {
    if (block.primaryCanonicalSection) sectionKeys.add(block.primaryCanonicalSection);
    if (block.mappedSectionKey) sectionKeys.add(block.mappedSectionKey);
    (block.supportCanonicalSections ?? []).forEach((key) => sectionKeys.add(key));
  });

  const sourceBackedSections = sectionKeys.size;
  const emptySections = Math.max(0, GDD_SECTION_TEMPLATES.length - sourceBackedSections);
  const lowConfidenceBlocks = blocks.filter(
    (block) => block.mappingConfidence === "low" || block.mappingConfidence === "unmapped",
  ).length;

  return {
    totalBlocks,
    mappedBlocks,
    unmappedBlocks,
    mappedPercent,
    sourceBackedSections,
    emptySections,
    lowConfidenceBlocks,
  };
}

export function getParserCoverageWarning(coverage: ParserCoverageSummary): string | undefined {
  if (coverage.totalBlocks === 0) {
    return "Audit confidence is limited because no structured source blocks were available.";
  }
  if (coverage.mappedPercent < 50) {
    return `Audit confidence is limited because only ${coverage.mappedPercent}% of parsed source blocks were mapped into canonical or support buckets.`;
  }
  if (coverage.mappedPercent < 70 || coverage.lowConfidenceBlocks > coverage.mappedBlocks / 2) {
    return "Audit confidence is moderate. Review mapped sections, support-bucket contributions, and unknown blocks before final decisions.";
  }
  return undefined;
}
