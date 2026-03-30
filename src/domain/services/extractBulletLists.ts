import type { BulletListElement } from "@/domain/models";

export function extractBulletListElement(list: HTMLUListElement): BulletListElement | undefined {
  const items = Array.from(list.querySelectorAll(":scope > li"))
    .map((item) => item.textContent?.replace(/\s+/g, " ").trim() ?? "")
    .filter(Boolean);

  if (items.length === 0) {
    return undefined;
  }

  return {
    type: "bullet_list",
    items,
    flattenedText: items.map((item) => `- ${item}`).join("\n"),
  };
}
