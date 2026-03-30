import type { ParsedDocument } from "@/domain/models";
import { extractStructuredElements } from "@/domain/services/extractStructuredElements";
import type { SourceType } from "@/domain/models/constants";
import { mapParsedBlocksToSections } from "@/domain/services/mapSections";
import { buildParserDiagnostics } from "@/domain/services/parserDiagnostics";
import { segmentStructuredBlocks } from "@/domain/services/segmentStructuredBlocks";

export type DocxParseResult = {
  text: string;
  parsedDocument: ParsedDocument;
  inferredType: SourceType;
};

type MammothModule = {
  extractRawText: (input: { arrayBuffer: ArrayBuffer }) => Promise<{ value: string }>;
  convertToHtml: (input: { arrayBuffer: ArrayBuffer }) => Promise<{ value: string }>;
};

const typeByFileName: Array<{ pattern: RegExp; type: SourceType }> = [
  { pattern: /\bgdd\b/i, type: "gdd" },
  { pattern: /\boverview\b/i, type: "overview" },
  { pattern: /\bbenchmark\b/i, type: "benchmark" },
  { pattern: /\bgameplay\b/i, type: "gameplay reference" },
  { pattern: /\bstore\b/i, type: "store page" },
  { pattern: /\bbalanc/i, type: "balancing notes" },
  { pattern: /\blevel\b/i, type: "level notes" },
  { pattern: /\bwireframe\b/i, type: "wireframe" },
  { pattern: /\bfeedback\b/i, type: "feedback" },
  { pattern: /\basset\b/i, type: "asset reference" },
];

export function inferSourceTypeFromFileName(fileName: string): SourceType {
  const match = typeByFileName.find((item) => item.pattern.test(fileName));
  return match?.type ?? "other";
}

export async function parseDocxFile(file: File): Promise<DocxParseResult> {
  const lower = file.name.toLowerCase();
  if (!lower.endsWith(".docx")) {
    throw new Error("Invalid file type. Please upload a .docx file.");
  }

  const mammoth = (await import("mammoth/mammoth.browser")) as unknown as MammothModule;
  let rawText = "";
  let htmlText = "";
  try {
    const arrayBuffer = await file.arrayBuffer();
    const result = await mammoth.extractRawText({ arrayBuffer });
    const htmlResult = await mammoth.convertToHtml({ arrayBuffer });
    rawText = result.value;
    htmlText = htmlResult.value;
  } catch {
    throw new Error("Could not parse DOCX file. The file may be corrupted.");
  }

  const text = rawText
    .replace(/\r\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();

  if (!text) {
    throw new Error("DOCX file has no extractable text content.");
  }

  const elements = extractStructuredElements(text, htmlText);
  const segmented = segmentStructuredBlocks(elements);
  const mappedBlocks = mapParsedBlocksToSections(segmented);
  const appendixBlocks = mappedBlocks.filter((block) => block.isAppendix);
  const unmappedBlocks = mappedBlocks.filter(
    (block) =>
      block.bucketCategory === "unknown" ||
      (!block.mappedSectionKey && !block.mappedBucket) ||
      block.mappedBucket === "unknown_unmapped",
  );
  const diagnostics = buildParserDiagnostics(elements, mappedBlocks);
  const parsedDocument: ParsedDocument = {
    title: file.name.replace(/\.[^/.]+$/, ""),
    rawText: text,
    elements,
    blocks: mappedBlocks,
    appendixBlocks,
    unmappedBlocks,
    diagnostics,
  };

  return {
    text,
    parsedDocument,
    inferredType: inferSourceTypeFromFileName(file.name),
  };
}
