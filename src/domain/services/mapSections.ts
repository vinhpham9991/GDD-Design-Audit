import { CANONICAL_HEADING_SYNONYMS } from "@/domain/config/headingSynonyms";
import { applyCrossSectionSupport } from "@/domain/services/applyCrossSectionSupport";
import { classifySemanticBucket } from "@/domain/services/classifySemanticBucket";
import type { MappingConfidence, ParsedBlock } from "@/domain/models";
import type { GddSectionKey } from "@/domain/models/constants";

type MappingResult = {
  sectionKey?: GddSectionKey;
  confidence: MappingConfidence;
};

export function normalizeHeading(value: string): string {
  return value
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .replace(/[^\w\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function canonicalMatchFromText(text: string): MappingResult {
  const normalized = normalizeHeading(text);
  let best: { key?: GddSectionKey; score: number } = { score: 0 };

  (Object.entries(CANONICAL_HEADING_SYNONYMS) as Array<[GddSectionKey, string[]]>).forEach(
    ([key, synonyms]) => {
      synonyms.forEach((synonym) => {
        const s = normalizeHeading(synonym);
        if (!s) return;
        let score = 0;
        if (normalized === s) score = 1;
        else if (normalized.includes(s) || s.includes(normalized)) score = 0.82;
        else {
          const a = new Set(normalized.split(" ").filter(Boolean));
          const b = new Set(s.split(" ").filter(Boolean));
          let overlap = 0;
          a.forEach((token) => {
            if (b.has(token)) overlap += 1;
          });
          score = overlap / Math.max(a.size || 1, b.size || 1);
        }
        if (score > best.score) best = { key, score };
      });
    },
  );

  if (!best.key || best.score < 0.4) return { confidence: "unmapped" };
  if (best.score >= 0.9) return { sectionKey: best.key, confidence: "high" };
  if (best.score >= 0.68) return { sectionKey: best.key, confidence: "medium" };
  return { sectionKey: best.key, confidence: "low" };
}

export function mapHeadingToSection(heading?: string, content?: string): MappingResult {
  const fromHeading = canonicalMatchFromText(heading ?? "");
  if (fromHeading.sectionKey) return fromHeading;
  if (content?.trim()) return canonicalMatchFromText(content);
  return { confidence: "unmapped" };
}

export function mapParsedBlocksToSections(blocks: ParsedBlock[]): ParsedBlock[] {
  return blocks.map((block) => {
    const semantic = classifySemanticBucket(block);

    const mappedSectionKey = semantic.primaryCanonicalSection;
    const support = applyCrossSectionSupport({
      ...block,
      primaryBucket: semantic.primaryBucket,
      primaryCanonicalSection: semantic.primaryCanonicalSection,
      mappedBucket: semantic.primaryBucket,
      mappedSectionKey,
      mappingConfidence: semantic.confidence,
      mappingReasons: semantic.reasons,
    });

    const bucketCategory =
      semantic.bucketCategory === "support"
        ? ("non_canonical" as const)
        : semantic.bucketCategory;

    return {
      ...block,
      normalizedHeading: block.heading ? normalizeHeading(block.heading) : block.normalizedHeading,
      mappedSectionKey,
      mappedBucket: semantic.primaryBucket,
      primaryBucket: semantic.primaryBucket,
      primaryCanonicalSection: semantic.primaryCanonicalSection,
      supportCanonicalSections: support.supportCanonicalSections,
      bucketCategory,
      mappingConfidence: semantic.confidence,
      mappingReasons: semantic.reasons,
      isDocumentFraming:
        bucketCategory === "non_canonical" &&
        ["document_purpose", "document_scope", "document_metadata", "current_direction_summary"].includes(
          semantic.primaryBucket,
        ),
    };
  });
}
