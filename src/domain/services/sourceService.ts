import { SOURCE_TYPES, type SourceType } from "@/domain/models/constants";
import type { ParsedDocument, Reliability, SourceItem } from "@/domain/models";
import { sourceParserAdapters } from "@/domain/services/sourceParserAdapter";

export interface SourceInput {
  projectId?: string;
  title: string;
  content?: string;
  url?: string;
  type: SourceType;
  reliability?: Reliability;
  tags?: string;
  parsedDocument?: ParsedDocument;
}

export function normalizeSource(input: SourceInput, existing?: SourceItem): SourceItem {
  const now = new Date().toISOString();

  return {
    id: existing?.id ?? `src_${crypto.randomUUID()}`,
    projectId: input.projectId ?? existing?.projectId,
    title: input.title.trim() || "Untitled Source",
    type: SOURCE_TYPES.includes(input.type) ? input.type : "other",
    content: input.content?.trim() || undefined,
    url: input.url?.trim() || undefined,
    reliability: input.reliability,
    tags: normalizeTags(input.tags),
    parsedDocument: input.parsedDocument ?? existing?.parsedDocument,
    createdAt: existing?.createdAt ?? now,
    updatedAt: now,
  };
}

export function normalizeTags(raw?: string): string[] {
  if (!raw) {
    return [];
  }

  return Array.from(
    new Set(
      raw
        .split(",")
        .map((tag) => tag.trim().toLowerCase())
        .filter(Boolean),
    ),
  );
}

export async function parseSourceFile(file: File) {
  const adapter = sourceParserAdapters.find((item) => item.canParse(file.name, file.type));
  if (!adapter) {
    throw new Error("Unsupported file type. Accepted formats: .txt, .md, .markdown, .docx.");
  }

  return adapter.parse(file);
}
