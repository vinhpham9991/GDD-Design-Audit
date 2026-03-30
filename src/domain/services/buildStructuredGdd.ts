import type {
  GDDVersion,
  ParsedBlock,
  SourceItem,
} from "@/domain/models";
import { mapHeadingToSection, mapParsedBlocksToSections } from "@/domain/services/mapSections";
import { materializeCanonicalSections } from "@/domain/services/materializeCanonicalSections";


function synthesizeBlocksFromSource(source: SourceItem): ParsedBlock[] {
  const content = (source.content ?? source.url ?? "").trim();
  if (!content) {
    return [];
  }
  const mapped = mapHeadingToSection(source.title, content);
  return [
    {
      id: `pblk_fallback_${source.id}`,
      heading: source.title,
      content,
      mappedSectionKey: mapped.sectionKey,
      primaryCanonicalSection: mapped.sectionKey,
      supportCanonicalSections: [],
      mappingConfidence: mapped.confidence,
      sourceTypeHints: [source.type],
    },
  ];
}

export function extractStructuredBlocksFromSources(sources: SourceItem[]): ParsedBlock[] {
  const blocks: ParsedBlock[] = [];
  for (const source of sources) {
    if (source.parsedDocument?.blocks?.length) {
      source.parsedDocument.blocks.forEach((block) => {
        blocks.push({ ...block });
      });
    } else {
      blocks.push(...synthesizeBlocksFromSource(source));
    }
  }
  return mapParsedBlocksToSections(blocks);
}

export function buildGddFromStructuredSources(
  projectId: string,
  versionName: string,
  sources: SourceItem[],
): GDDVersion {
  const mappedBlocks = extractStructuredBlocksFromSources(sources);
  const materialized = materializeCanonicalSections(mappedBlocks);

  return {
    id: `gdd_${crypto.randomUUID()}`,
    projectId,
    name: versionName,
    createdAt: new Date().toISOString(),
    summary:
      "Starter GDD built from canonical + support-bucket mappings (multi-bucket cross-section reconstruction).",
    sections: materialized.sections,
    sectionBuildMeta: materialized.sectionBuildMeta,
    unmappedBlocks: materialized.unmappedBlocks,
    parserCoverage: materialized.parserCoverage,
    materializationDebug: materialized.debugInfo,
  };
}
