import type { ParsedBlock, ParsedElement } from "@/domain/models";
import { isAppendixHeading } from "@/domain/services/detectAppendixBlocks";
import { normalizeHeading } from "@/domain/services/mapSections";

function elementText(element: ParsedElement): string {
  if (element.type === "paragraph") return element.text;
  if (element.type === "heading") return element.text;
  if (element.type === "table") return element.flattenedText;
  if (element.type === "bullet_list") return element.flattenedText;
  if (element.type === "numbered_list") return element.flattenedText;
  if (element.type === "appendix") return element.text;
  return element.text;
}

function newBlock(heading?: string, headingLevel?: number, ownershipReason?: string): ParsedBlock {
  return {
    id: `pblk_${crypto.randomUUID()}`,
    heading,
    normalizedHeading: heading ? normalizeHeading(heading) : undefined,
    level: headingLevel,
    headingLevel,
    content: "",
    contentParts: [],
    isAppendix: heading ? isAppendixHeading(heading) : false,
    appendixLabel: heading && isAppendixHeading(heading) ? heading : undefined,
    ownershipReason,
    ownershipHeading: heading,
  };
}

function appendContent(block: ParsedBlock, element: ParsedElement) {
  const text = elementText(element).trim();
  if (text) {
    block.content = block.content ? `${block.content}\n${text}` : text;
  }
  block.contentParts = [...(block.contentParts ?? []), element];
  if (element.type === "table") {
    block.sourceTypeHints = Array.from(new Set([...(block.sourceTypeHints ?? []), "table"]));
  }
  if (element.type === "bullet_list") {
    block.sourceTypeHints = Array.from(new Set([...(block.sourceTypeHints ?? []), "bullet_list"]));
  }
  if (element.type === "numbered_list") {
    block.sourceTypeHints = Array.from(new Set([...(block.sourceTypeHints ?? []), "numbered_list"]));
  }
  if (element.type === "appendix") {
    block.sourceTypeHints = Array.from(new Set([...(block.sourceTypeHints ?? []), "appendix"]));
    block.isAppendix = true;
  }
}

export function attachContentToHeading(elements: ParsedElement[]): ParsedBlock[] {
  const blocks: ParsedBlock[] = [];
  const headingStack: ParsedBlock[] = [];
  let current = newBlock(undefined, undefined, "initial_context");

  const flushCurrent = () => {
    if (!current) return;
    const hasSignal =
      Boolean(current.heading) ||
      current.content.trim().length > 0 ||
      (current.contentParts?.length ?? 0) > 0;
    if (hasSignal) {
      blocks.push({ ...current, content: current.content.trim() });
    }
  };

  elements.forEach((element) => {
    if (element.type === "heading") {
      flushCurrent();

      const newLevel = element.level ?? 2;
      while (headingStack.length > 0) {
        const top = headingStack[headingStack.length - 1];
        if ((top.headingLevel ?? 2) >= newLevel) {
          headingStack.pop();
        } else {
          break;
        }
      }

      const parent = headingStack[headingStack.length - 1];
      current = newBlock(
        element.text,
        newLevel,
        parent
          ? `subsection_of:${parent.heading ?? "unknown"}`
          : "new_heading_boundary_same_or_higher",
      );
      current.contentParts = [...(current.contentParts ?? []), element];
      headingStack.push(current);
      return;
    }

    if (element.type === "appendix") {
      if (!current.heading && !current.content) {
        current = newBlock(element.heading ?? "Appendix", 2, "appendix_inferred_heading");
      }
      current.isAppendix = true;
      current.appendixLabel = current.appendixLabel ?? element.heading ?? "Appendix";
      appendContent(current, element);
      return;
    }

    // Global ownership rule: keep attaching content to the active heading context.
    appendContent(current, element);
  });

  flushCurrent();
  return blocks;
}
