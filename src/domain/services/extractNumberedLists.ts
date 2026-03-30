import type { NumberedListElement } from "@/domain/models";

export function extractNumberedListElement(list: HTMLOListElement): NumberedListElement | undefined {
  const items = Array.from(list.querySelectorAll(":scope > li"))
    .map((item) => item.textContent?.replace(/\s+/g, " ").trim() ?? "")
    .filter(Boolean);

  if (items.length === 0) {
    return undefined;
  }

  return {
    type: "numbered_list",
    items,
    flattenedText: items.map((item, idx) => `${idx + 1}. ${item}`).join("\n"),
  };
}
