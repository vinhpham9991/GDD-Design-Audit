import { classifySemanticBucket } from "@/domain/services/classifySemanticBucket";
import type { MappingConfidence, ParsedBlock } from "@/domain/models";

export type BlockBucketClassification = {
  bucket: string;
  bucketCategory: "canonical" | "non_canonical" | "unknown";
  confidence: MappingConfidence;
  reasons: string[];
  primaryCanonicalSection?: string;
};

export function classifyBlockBucket(block: ParsedBlock): BlockBucketClassification {
  const result = classifySemanticBucket(block);
  return {
    bucket: result.primaryBucket,
    bucketCategory: result.bucketCategory === "support" ? "non_canonical" : result.bucketCategory,
    confidence: result.confidence,
    reasons: result.reasons,
    primaryCanonicalSection: result.primaryCanonicalSection,
  };
}
