import type { ParsedBlock } from "@/domain/models";
import { normalizeHeading } from "@/domain/services/mapSections";

function headingLevelFromNumbering(line: string): number | undefined {
  const match = line.match(/^(\d+(?:\.\d+){0,3})[).\s-]+/);
  if (!match) {
    return undefined;
  }
  return match[1].split(".").length;
}

function isMostlyUppercase(line: string): boolean {
  const letters = line.replace(/[^A-Za-z]/g, "");
  if (letters.length < 4) {
    return false;
  }
  const upper = letters.replace(/[^A-Z]/g, "").length;
  return upper / letters.length >= 0.8;
}

const headingKeywordHints = [
  "overview",
  "goal",
  "audience",
  "pillar",
  "loop",
  "control",
  "mechanic",
  "meta",
  "monetization",
  "art",
  "aesthetic",
  "ftue",
  "tutorial",
  "economy",
  "live ops",
  "risk",
  "assumption",
  "tong quan",
  "muc tieu",
  "doi tuong",
  "tru cot",
  "vong lap",
  "dieu khien",
  "co che",
  "kiem tien",
  "my thuat",
  "tan thu",
  "nen kinh te",
  "su kien",
  "rui ro",
  "gia dinh",
];

function looksLikeHeading(line: string): boolean {
  const trimmed = line.trim();
  if (!trimmed) {
    return false;
  }
  if (/^#{1,6}\s+\S/.test(trimmed)) {
    return true;
  }
  if (/^\d+(?:\.\d+){0,3}[).\s-]+\S/.test(trimmed) && trimmed.length <= 90) {
    return true;
  }
  if (trimmed.endsWith(":") && trimmed.length <= 80) {
    return true;
  }
  if (isMostlyUppercase(trimmed) && trimmed.length <= 80) {
    return true;
  }

  if (trimmed.length <= 65 && !/[.!?]$/.test(trimmed)) {
    const normalized = normalizeHeading(trimmed);
    if (headingKeywordHints.some((hint) => normalized.includes(hint))) {
      return true;
    }
  }
  return false;
}

function cleanHeading(line: string): string {
  return line
    .replace(/^#{1,6}\s+/, "")
    .replace(/^\d+(?:\.\d+){0,3}[).\s-]+/, "")
    .replace(/:\s*$/, "")
    .trim();
}

export function segmentDocumentByHeadings(rawText: string): ParsedBlock[] {
  const lines = rawText.replace(/\r\n/g, "\n").split("\n");
  const blocks: ParsedBlock[] = [];

  let current: ParsedBlock | undefined;
  let blockStartLine = 1;

  const commitCurrent = (endLine: number) => {
    if (!current) {
      return;
    }
    const content = current.content.trim();
    if (current.heading || content) {
      blocks.push({
        ...current,
        content,
        sourceRange: `${blockStartLine}-${endLine}`,
      });
    }
    current = undefined;
  };

  lines.forEach((line, index) => {
    const lineNumber = index + 1;
    const trimmed = line.trim();

    if (looksLikeHeading(trimmed)) {
      commitCurrent(Math.max(blockStartLine, lineNumber - 1));
      blockStartLine = lineNumber;
      const cleaned = cleanHeading(trimmed);
      current = {
        id: `pblk_${crypto.randomUUID()}`,
        heading: cleaned || trimmed,
        normalizedHeading: cleaned ? normalizeHeading(cleaned) : undefined,
        level: trimmed.startsWith("#")
          ? trimmed.match(/^#+/)?.[0].length
          : headingLevelFromNumbering(trimmed),
        content: "",
      };
      return;
    }

    if (!current) {
      current = {
        id: `pblk_${crypto.randomUUID()}`,
        content: trimmed ? `${trimmed}\n` : "",
      };
      blockStartLine = lineNumber;
      return;
    }

    current.content = current.content ? `${current.content}${line}\n` : `${line}\n`;
  });

  commitCurrent(lines.length);

  const nonEmpty = blocks.filter((block) => block.heading || block.content.trim());
  if (nonEmpty.length > 1) {
    return nonEmpty;
  }

  const paragraphBlocks = rawText
    .split(/\n{2,}/)
    .map((chunk, idx) => ({
      id: `pblk_para_${idx}_${crypto.randomUUID()}`,
      content: chunk.trim(),
    }))
    .filter((block) => block.content.length > 0);

  return paragraphBlocks.length > 0 ? paragraphBlocks : nonEmpty;
}
