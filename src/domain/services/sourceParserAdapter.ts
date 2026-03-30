import type { ParsedDocument } from "@/domain/models";
import type { SourceType } from "@/domain/models/constants";
import { inferSourceTypeFromFileName, parseDocxFile } from "@/domain/services/docxParser";
import { extractStructuredElements } from "@/domain/services/extractStructuredElements";
import { mapParsedBlocksToSections } from "@/domain/services/mapSections";
import { buildParserDiagnostics } from "@/domain/services/parserDiagnostics";
import { segmentStructuredBlocks } from "@/domain/services/segmentStructuredBlocks";

export interface ParsedSourcePayload {
  title: string;
  content: string;
  type?: SourceType;
  parsedDocument?: ParsedDocument;
}

export interface SourceParserAdapter {
  id: string;
  canParse: (fileName: string, mimeType: string) => boolean;
  parse: (file: File) => Promise<ParsedSourcePayload>;
}

export const textParserAdapter: SourceParserAdapter = {
  id: "text-adapter",
  canParse: (fileName, mimeType) => {
    const lower = fileName.toLowerCase();
    return (
      mimeType.includes("text") ||
      lower.endsWith(".txt") ||
      lower.endsWith(".md") ||
      lower.endsWith(".markdown")
    );
  },
  parse: async (file) => {
    const content = await file.text();
    const fallback = file.name.replace(/\.[^/.]+$/, "");
    const heading = content
      .split("\n")
      .find((line) => line.trim().startsWith("# "))
      ?.replace(/^#\s+/, "")
      .trim();

    const elements = extractStructuredElements(content);
    const blocks = mapParsedBlocksToSections(segmentStructuredBlocks(elements));
    return {
      title: heading || fallback || "Imported Source",
      content,
      parsedDocument: {
        title: heading || fallback || "Imported Source",
        rawText: content,
        elements,
        blocks,
        appendixBlocks: blocks.filter((block) => block.isAppendix),
        unmappedBlocks: blocks.filter(
          (block) =>
            block.bucketCategory === "unknown" ||
            (!block.mappedSectionKey && !block.mappedBucket) ||
            block.mappedBucket === "unknown_unmapped",
        ),
        diagnostics: buildParserDiagnostics(elements, blocks),
      },
    };
  },
};

export const docxParserAdapter: SourceParserAdapter = {
  id: "docx-adapter",
  canParse: (fileName, mimeType) => {
    const lower = fileName.toLowerCase();
    return (
      mimeType ===
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
      lower.endsWith(".docx")
    );
  },
  parse: async (file) => {
    const { text, inferredType, parsedDocument } = await parseDocxFile(file);
    return {
      title: file.name,
      content: text,
      type: inferredType ?? inferSourceTypeFromFileName(file.name),
      parsedDocument,
    };
  },
};

export const sourceParserAdapters: SourceParserAdapter[] = [textParserAdapter, docxParserAdapter];
