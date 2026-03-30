import type { ParsedBlock, ParsedElement } from "@/domain/models";
import { attachContentToHeading } from "@/domain/services/attachContentToHeading";

export function segmentStructuredBlocks(elements: ParsedElement[]): ParsedBlock[] {
  return attachContentToHeading(elements);
}
