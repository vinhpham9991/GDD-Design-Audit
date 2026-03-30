import { CANONICAL_HEADING_SYNONYMS } from "@/domain/config/headingSynonyms";
import { HEADING_FAMILIES } from "@/domain/config/headingFamilies";
import {
  SUPPORT_BUCKET_CONFIG,
  type BucketCategory,
  type SupportBucket,
} from "@/domain/config/supportBuckets";
import type { MappingConfidence, ParsedBlock } from "@/domain/models";
import type { GddSectionKey } from "@/domain/models/constants";
import { normalizeHeading } from "@/domain/services/mapSections";

export type SemanticBucketClassification = {
  primaryBucket: string;
  bucketCategory: BucketCategory;
  confidence: MappingConfidence;
  reasons: string[];
  primaryCanonicalSection?: GddSectionKey;
};

function tokenize(input: string): Set<string> {
  return new Set(normalizeHeading(input).split(" ").filter(Boolean));
}

function similarity(a: string, b: string): number {
  const na = normalizeHeading(a);
  const nb = normalizeHeading(b);
  if (!na || !nb) return 0;
  if (na === nb) return 1;
  if (na.includes(nb) || nb.includes(na)) return 0.84;
  const sa = tokenize(na);
  const sb = tokenize(nb);
  let overlap = 0;
  sa.forEach((t) => {
    if (sb.has(t)) overlap += 1;
  });
  return overlap / Math.max(1, Math.max(sa.size, sb.size));
}

function confidenceFromScore(score: number): MappingConfidence {
  if (score >= 0.9) return "high";
  if (score >= 0.68) return "medium";
  if (score >= 0.45) return "low";
  return "unmapped";
}

function inferHeadingFamily(heading: string, content: string): string | undefined {
  const source = `${heading} ${content}`;
  let best: { family?: string; score: number } = { score: 0 };
  for (const family of HEADING_FAMILIES) {
    for (const cue of family.cues) {
      const score = similarity(source, cue);
      if (score > best.score) {
        best = { family: family.family, score };
      }
    }
  }
  return best.score >= 0.55 ? best.family : undefined;
}

function classifyCanonical(heading: string, content: string): {
  key?: GddSectionKey;
  score: number;
  reason?: string;
} {
  const source = `${heading} ${content}`.trim();
  let best: { key?: GddSectionKey; score: number; reason?: string } = { score: 0 };
  for (const [key, synonyms] of Object.entries(CANONICAL_HEADING_SYNONYMS) as Array<
    [GddSectionKey, string[]]
  >) {
    for (const synonym of synonyms) {
      const score = similarity(source, synonym);
      if (score > best.score) {
        best = { key, score, reason: `canonical:${synonym}` };
      }
    }
  }
  return best;
}

function classifySupportBucket(heading: string, content: string): {
  key: SupportBucket;
  score: number;
  reason: string;
} {
  const source = `${heading} ${content}`.trim();
  let best: { key: SupportBucket; score: number; reason: string } = {
    key: "unknown_unmapped",
    score: 0,
    reason: "no_support_bucket_match",
  };

  for (const [key, cfg] of Object.entries(SUPPORT_BUCKET_CONFIG) as Array<
    [SupportBucket, (typeof SUPPORT_BUCKET_CONFIG)[SupportBucket]]
  >) {
    if (key === "unknown_unmapped") continue;

    for (const cue of cfg.headingCues) {
      const score = similarity(heading || source, cue);
      if (score > best.score) {
        best = { key, score, reason: `support_heading:${cue}` };
      }
    }
    for (const cue of cfg.contentCues) {
      const score = similarity(content || source, cue) * 0.92;
      if (score > best.score) {
        best = { key, score, reason: `support_content:${cue}` };
      }
    }
  }

  return best;
}

export function classifySemanticBucket(block: ParsedBlock): SemanticBucketClassification {
  if (block.manualMapping) {
    const primaryBucket =
      block.mappedBucket ?? block.primaryBucket ?? block.mappedSectionKey ?? "unknown_unmapped";
    const canonical = block.mappedSectionKey as GddSectionKey | undefined;
    return {
      primaryBucket,
      bucketCategory: canonical
        ? "canonical"
        : primaryBucket === "unknown_unmapped"
          ? "unknown"
          : "support",
      confidence: block.mappingConfidence ?? "medium",
      reasons: [...(block.mappingReasons ?? []), "manual_override"],
      primaryCanonicalSection: canonical,
    };
  }

  const heading = block.heading ?? "";
  const content = block.content.slice(0, 1200);
  const family = inferHeadingFamily(heading, content);

  const canonical = classifyCanonical(heading, content);
  const support = classifySupportBucket(heading, content);

  if (canonical.key && canonical.score >= Math.max(0.48, support.score + 0.05)) {
    return {
      primaryBucket: canonical.key,
      bucketCategory: "canonical",
      confidence: confidenceFromScore(canonical.score),
      reasons: [canonical.reason ?? "canonical_match", family ? `family:${family}` : ""].filter(Boolean),
      primaryCanonicalSection: canonical.key,
    };
  }

  if (support.key !== "unknown_unmapped" && support.score >= 0.44) {
    return {
      primaryBucket: support.key,
      bucketCategory: SUPPORT_BUCKET_CONFIG[support.key].category,
      confidence: confidenceFromScore(support.score),
      reasons: [support.reason, family ? `family:${family}` : ""].filter(Boolean),
      primaryCanonicalSection: SUPPORT_BUCKET_CONFIG[support.key].canonicalHint,
    };
  }

  if (block.isAppendix) {
    return {
      primaryBucket: "appendix_notes",
      bucketCategory: "support",
      confidence: "medium",
      reasons: ["appendix_fallback", family ? `family:${family}` : ""].filter(Boolean),
      primaryCanonicalSection: SUPPORT_BUCKET_CONFIG.appendix_notes.canonicalHint,
    };
  }

  return {
    primaryBucket: "unknown_unmapped",
    bucketCategory: "unknown",
    confidence: "unmapped",
    reasons: [family ? `family:${family}` : "no_reliable_match"],
  };
}
