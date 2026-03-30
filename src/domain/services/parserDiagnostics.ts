import type { ParsedBlock, ParsedElement, ParserDiagnostics } from "@/domain/models";

export function buildParserDiagnostics(
  elements: ParsedElement[],
  blocks: ParsedBlock[],
): ParserDiagnostics {
  const tableCount = elements.filter((element) => element.type === "table").length;
  const bulletListCount = elements.filter((element) => element.type === "bullet_list").length;
  const numberedListCount = elements.filter((element) => element.type === "numbered_list").length;
  const headingCount = elements.filter((element) => element.type === "heading").length;
  const appendixCount = blocks.filter((block) => block.isAppendix).length;
  const emptyBlockCount = blocks.filter((block) => block.content.trim().length === 0).length;
  const canonicalMappedCount = blocks.filter((block) => block.bucketCategory === "canonical").length;
  const nonCanonicalMappedCount = blocks.filter((block) => block.bucketCategory === "non_canonical").length;
  const unknownUnmappedCount = blocks.filter(
    (block) => block.bucketCategory === "unknown" || block.mappedBucket === "unknown_unmapped",
  ).length;
  const tableContainingBlocks = blocks.filter((block) => block.sourceTypeHints?.includes("table")).length;
  const bulletContainingBlocks = blocks.filter((block) =>
    block.sourceTypeHints?.includes("bullet_list"),
  ).length;
  const numberedContainingBlocks = blocks.filter((block) =>
    block.sourceTypeHints?.includes("numbered_list"),
  ).length;
  const appendixBlocks = blocks.filter((block) => block.isAppendix).length;
  const documentFramingBlocks = blocks.filter((block) => block.isDocumentFraming).length;

  return {
    totalElements: elements.length,
    totalBlocks: blocks.length,
    headingCount,
    tableCount,
    bulletListCount,
    numberedListCount,
    appendixCount,
    emptyBlockCount,
    canonicalMappedCount,
    nonCanonicalMappedCount,
    unknownUnmappedCount,
    tableContainingBlocks,
    bulletContainingBlocks,
    numberedContainingBlocks,
    appendixBlocks,
    documentFramingBlocks,
  };
}
