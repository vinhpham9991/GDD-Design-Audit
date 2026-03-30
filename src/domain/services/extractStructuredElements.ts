import type {
  AppendixElement,
  HeadingElement,
  NumberedListElement,
  ParagraphElement,
  ParsedElement,
  UnknownElement,
} from "@/domain/models";
import { detectHeadingBoundary } from "@/domain/services/detectHeadingBoundaries";
import { isAppendixHeading } from "@/domain/services/detectAppendixBlocks";
import { extractBulletListElement } from "@/domain/services/extractBulletLists";
import { extractNumberedListElement } from "@/domain/services/extractNumberedLists";
import { normalizeHeading } from "@/domain/services/mapSections";
import { extractTableElement } from "@/domain/services/extractTableText";

function buildHeadingElement(text: string, level?: number): HeadingElement {
  return {
    type: "heading",
    text,
    normalizedText: normalizeHeading(text),
    level,
  };
}

export function extractStructuredElements(rawText: string, html?: string): ParsedElement[] {
  const elements: ParsedElement[] = [];

  if (html) {
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, "text/html");
    const blockNodes = Array.from(doc.body.querySelectorAll("h1,h2,h3,h4,h5,h6,table,ul,ol,p,div"));
    blockNodes.forEach((el) => {
      const closestTable = el.closest("table");
      if (el.closest("li")) {
        return;
      }
      if (closestTable && closestTable !== el) {
        return;
      }
      if (
        el.tagName.toLowerCase() === "div" &&
        el.querySelector("h1,h2,h3,h4,h5,h6,table,ul,ol,p")
      ) {
        return;
      }
      const tag = el.tagName.toLowerCase();
      const text = el.textContent?.replace(/\s+/g, " ").trim() ?? "";
      if (!text && tag !== "table" && tag !== "ul" && tag !== "ol") {
        return;
      }

      if (/^h[1-6]$/.test(tag)) {
        const level = Number(tag.replace("h", ""));
        const boundary = detectHeadingBoundary(text, Number.isNaN(level) ? undefined : level);
        elements.push(buildHeadingElement(text, boundary.level));
        return;
      }

      if (tag === "table") {
        const table = extractTableElement(el as HTMLTableElement);
        if (table) {
          elements.push(table);
        }
        return;
      }

      if (tag === "ul") {
        const bullet = extractBulletListElement(el as HTMLUListElement);
        if (bullet) {
          elements.push(bullet);
        }
        return;
      }

      if (tag === "ol") {
        const numbered = extractNumberedListElement(el as HTMLOListElement);
        if (numbered) {
          elements.push(numbered);
        }
        return;
      }

      if (isAppendixHeading(text)) {
        const appendix: AppendixElement = { type: "appendix", heading: text, text };
        elements.push(appendix);
        return;
      }

      const inferredBoundary = detectHeadingBoundary(text);
      if (inferredBoundary.isHeading) {
        elements.push(buildHeadingElement(text, inferredBoundary.level));
        return;
      }

      if (tag === "p" || tag === "div") {
        const numberedMatch = text.match(/^\d+(\.\d+){0,3}[).\s-]+(.+)/);
        if (numberedMatch && numberedMatch[2]) {
          const numbered: NumberedListElement = {
            type: "numbered_list",
            items: [numberedMatch[2].trim()],
            flattenedText: text,
          };
          elements.push(numbered);
          return;
        }

        const para: ParagraphElement = {
          type: "paragraph",
          text,
        };
        elements.push(para);
        return;
      }

      const unknown: UnknownElement = { type: "unknown", text };
      elements.push(unknown);
    });
  }

  if (elements.length > 0) {
    return elements;
  }

  // Graceful fallback for parser failures: keep content as paragraph-level elements.
  return rawText
    .split(/\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map<ParsedElement>((text) => {
      const heading = detectHeadingBoundary(text);
      if (heading.isHeading) {
        return buildHeadingElement(text, heading.level);
      }
      if (/^[-*•]\s+/.test(text)) {
        return {
          type: "bullet_list",
          items: [text.replace(/^[-*•]\s+/, "")],
          flattenedText: text,
        };
      }
      if (/^\d+(\.\d+){0,3}[).\s-]+/.test(text)) {
        return {
          type: "numbered_list",
          items: [text.replace(/^\d+(\.\d+){0,3}[).\s-]+/, "")],
          flattenedText: text,
        };
      }
      const para: ParagraphElement = { type: "paragraph", text };
      return para;
    });
}
