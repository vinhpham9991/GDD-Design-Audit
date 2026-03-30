import { GDD_SECTION_TEMPLATES, type GddSectionKey } from "@/domain/models/constants";
import type {
  GDDSection,
  GddSectionBuildMeta,
  MappingConfidence,
  MaterializationContributor,
  MaterializationDebugInfo,
  MaterializationRejectedCandidate,
  ParsedBlock,
  SectionMaterializationDebug,
} from "@/domain/models";
import { deriveSectionStatus } from "@/domain/services/gddStatusService";
import { computeParserCoverage } from "@/domain/services/parserCoverage";

type MaterializeResult = {
  sections: GDDSection[];
  sectionBuildMeta: Record<string, GddSectionBuildMeta>;
  unmappedBlocks: ParsedBlock[];
  parserCoverage: ReturnType<typeof computeParserCoverage>;
  debugInfo: MaterializationDebugInfo;
};

function preview(content: string): string {
  return content.replace(/\s+/g, " ").trim().slice(0, 220);
}

function contributorConfidence(confidence?: MappingConfidence): "high" | "medium" | "low" {
  if (confidence === "high") return "high";
  if (confidence === "medium") return "medium";
  return "low";
}

function toMetaConfidence(value: "high" | "medium" | "low" | "empty"): MappingConfidence {
  if (value === "empty") return "unmapped";
  return value;
}

function normalize(value: string): string {
  return value
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .replace(/[^\w\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function contributionLabel(type: "direct" | "support" | "descendant"): string {
  if (type === "direct") return "Direct";
  if (type === "support") return "Support-promoted";
  return "Descendant-derived";
}

function buildContributor(
  block: ParsedBlock,
  type: "direct" | "support" | "descendant",
  reason: string,
): MaterializationContributor {
  return {
    blockId: block.id,
    heading: block.heading,
    bucket: block.primaryBucket ?? block.mappedBucket,
    primarySection: block.primaryCanonicalSection ?? block.mappedSectionKey,
    supportSections: block.supportCanonicalSections ?? [],
    contentPreview: preview(block.content),
    charCount: block.content.trim().length,
    contributionType: type,
    confidence: contributorConfidence(block.mappingConfidence),
    reason,
  };
}

function parentHeadingFromOwnershipReason(reason?: string): string | undefined {
  if (!reason) return undefined;
  const prefix = "subsection_of:";
  if (!reason.startsWith(prefix)) return undefined;
  return reason.slice(prefix.length).trim();
}

function hasMeaningfulContent(block: ParsedBlock): boolean {
  const content = block.content.trim();
  if (content.length >= 40) return true;
  if (content.length >= 20 && (block.sourceTypeHints?.length ?? 0) > 0) return true;
  return false;
}

export function materializeCanonicalSections(mappedBlocks: ParsedBlock[]): MaterializeResult {
  const orderedBlocks = mappedBlocks.map((block, index) => ({ block, index }));
  const blockById = new Map(mappedBlocks.map((block) => [block.id, block]));

  const sectionBuildMeta: Record<string, GddSectionBuildMeta> = {};
  const sections: GDDSection[] = [];
  const sectionDebugs: SectionMaterializationDebug[] = [];

  for (const template of GDD_SECTION_TEMPLATES) {
    const sectionKey = template.key as GddSectionKey;

    const direct = orderedBlocks
      .filter(({ block }) => (block.primaryCanonicalSection ?? block.mappedSectionKey) === sectionKey)
      .map(({ block }) => block);

    const support = orderedBlocks
      .filter(({ block }) => {
        const isDirect = (block.primaryCanonicalSection ?? block.mappedSectionKey) === sectionKey;
        if (isDirect) return false;
        return (block.supportCanonicalSections ?? []).includes(sectionKey);
      })
      .map(({ block }) => block);

    const seedHeadings = new Set(
      [...direct, ...support]
        .map((block) => block.heading)
        .filter((heading): heading is string => Boolean(heading))
        .map((heading) => normalize(heading)),
    );

    const descendantCandidates = orderedBlocks
      .filter(({ block }) => !direct.some((d) => d.id === block.id) && !support.some((s) => s.id === block.id))
      .map(({ block }) => block)
      .filter((block) => {
        const parent = parentHeadingFromOwnershipReason(block.ownershipReason);
        if (!parent) return false;
        return seedHeadings.has(normalize(parent));
      });

    const descendants: ParsedBlock[] = [];
    const rejected: MaterializationRejectedCandidate[] = [];

    descendantCandidates.forEach((block) => {
      if (!hasMeaningfulContent(block)) {
        rejected.push({
          blockId: block.id,
          heading: block.heading,
          bucket: block.primaryBucket ?? block.mappedBucket,
          reason: "Descendant candidate rejected: content too short.",
        });
        return;
      }

      const competingPrimary = block.primaryCanonicalSection ?? block.mappedSectionKey;
      if (competingPrimary && competingPrimary !== sectionKey && block.mappingConfidence === "high") {
        rejected.push({
          blockId: block.id,
          heading: block.heading,
          bucket: block.primaryBucket ?? block.mappedBucket,
          reason: `Rejected: strongly mapped to different primary section (${competingPrimary}).`,
        });
        return;
      }

      descendants.push(block);
    });

    direct.forEach((block) => {
      if (block.content.trim().length === 0) {
        rejected.push({
          blockId: block.id,
          heading: block.heading,
          bucket: block.primaryBucket ?? block.mappedBucket,
          reason: "Direct candidate has empty body content.",
        });
      }
    });

    support.forEach((block) => {
      if (!hasMeaningfulContent(block)) {
        rejected.push({
          blockId: block.id,
          heading: block.heading,
          bucket: block.primaryBucket ?? block.mappedBucket,
          reason: "Support candidate below minimum content threshold.",
        });
      }
    });

    const directContributors = direct
      .filter((block) => block.content.trim().length > 0)
      .map((block) => buildContributor(block, "direct", "Primary section mapping"));
    const supportContributors = support
      .filter(hasMeaningfulContent)
      .map((block) => buildContributor(block, "support", "Support bucket promotion rule"));
    const descendantContributors = descendants.map((block) =>
      buildContributor(block, "descendant", "Inherited from heading container lineage"),
    );

    const includedContributorIds = new Set([
      ...directContributors.map((c) => c.blockId),
      ...supportContributors.map((c) => c.blockId),
      ...descendantContributors.map((c) => c.blockId),
    ]);

    const includedBlocks = orderedBlocks
      .filter(({ block }) => includedContributorIds.has(block.id))
      .sort((a, b) => a.index - b.index)
      .map(({ block }) => block);

    const assembledChunks = includedBlocks.map((block) => {
      const contributor =
        directContributors.find((item) => item.blockId === block.id) ??
        supportContributors.find((item) => item.blockId === block.id) ??
        descendantContributors.find((item) => item.blockId === block.id);
      const type = contributor?.contributionType ?? "support";
      const bucket = block.primaryBucket ?? block.mappedBucket ?? "unknown_unmapped";
      const prefix = `[${contributionLabel(type)}:${bucket}]`;
      return block.heading
        ? `${prefix} ${block.heading}\n${block.content.trim()}`
        : `${prefix}\n${block.content.trim()}`;
    });

    const sectionContent = assembledChunks.join("\n\n").trim();
    const totalChars = sectionContent.length;

    const confidence: "high" | "medium" | "low" | "empty" =
      includedBlocks.length === 0
        ? "empty"
        : (includedBlocks.some((block) => block.mappingConfidence === "high")
            ? "high"
            : includedBlocks.some((block) => block.mappingConfidence === "medium")
              ? "medium"
              : "low");

    const notes: string[] = [];
    if (includedBlocks.length === 0) {
      notes.push("No direct, support, or descendant contributors met inclusion criteria.");
    } else {
      notes.push(
        `Materialized from ${directContributors.length} direct, ${supportContributors.length} support, and ${descendantContributors.length} descendant contributors.`,
      );
      if (directContributors.length === 0 && supportContributors.length > 0) {
        notes.push("No direct contributors found; section populated through support-bucket promotion.");
      }
      if (descendantContributors.length > 0) {
        notes.push("Container heading aggregation contributed child/subsection content.");
      }
    }

    const section: GDDSection = {
      id: `sec_${crypto.randomUUID()}`,
      key: sectionKey,
      title: template.title,
      content: sectionContent,
      status: deriveSectionStatus(sectionContent),
    };
    sections.push(section);

    sectionBuildMeta[sectionKey] = {
      blockCount: includedBlocks.length,
      mappedContentLength: totalChars,
      confidenceSummary: toMetaConfidence(confidence),
      directContributorCount: directContributors.length,
      supportContributorCount: supportContributors.length,
      descendantContributorCount: descendantContributors.length,
    };

    sectionDebugs.push({
      sectionKey,
      title: template.title,
      totalChars,
      totalBlocks: includedBlocks.length,
      confidence,
      directContributors,
      supportContributors,
      descendantContributors,
      rejectedCandidates: rejected,
      notes,
    });
  }

  const includedBlockIds = new Set(
    sectionDebugs.flatMap((section) => [
      ...section.directContributors.map((item) => item.blockId),
      ...section.supportContributors.map((item) => item.blockId),
      ...section.descendantContributors.map((item) => item.blockId),
    ]),
  );

  const unmappedBlocks = mappedBlocks.filter((block) => {
    if (includedBlockIds.has(block.id)) return false;
    if ((block.primaryBucket ?? block.mappedBucket) === "unknown_unmapped") return true;
    const hasNoCanonicalTouch =
      !(block.primaryCanonicalSection ?? block.mappedSectionKey) &&
      !(block.supportCanonicalSections?.length ?? 0);
    return hasNoCanonicalTouch;
  });

  const populatedSections = sectionDebugs.filter((section) => section.totalBlocks > 0).length;
  const emptySections = sectionDebugs.length - populatedSections;

  const debugInfo: MaterializationDebugInfo = {
    sections: sectionDebugs,
    totalCanonicalSections: GDD_SECTION_TEMPLATES.length,
    populatedSections,
    emptySections,
    notes: [
      "Canonical section materialization combines direct mappings, support promotion, and descendant aggregation.",
      "Use section-level rejected candidates to diagnose why expected blocks were excluded.",
    ],
  };

  return {
    sections,
    sectionBuildMeta,
    unmappedBlocks: unmappedBlocks.map((block) => blockById.get(block.id) ?? block),
    parserCoverage: computeParserCoverage(mappedBlocks),
    debugInfo,
  };
}
