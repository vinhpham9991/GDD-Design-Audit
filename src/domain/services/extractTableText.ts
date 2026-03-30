import type { TableElement } from "@/domain/models";

export function extractTableElement(table: HTMLTableElement): TableElement | undefined {
  const rows: string[][] = [];
  const rowNodes = Array.from(table.querySelectorAll("tr"));
  rowNodes.forEach((row) => {
    const cells = Array.from(row.querySelectorAll("th,td"))
      .map((cell) => cell.textContent?.replace(/\s+/g, " ").trim() ?? "")
      .filter(Boolean);
    if (cells.length > 0) {
      rows.push(cells);
    }
  });

  if (rows.length === 0) {
    return undefined;
  }

  const flattenedText = rows
    .map((row) =>
      row
        .map((cell, idx) => `C${idx + 1}: ${cell}`)
        .join(" | "),
    )
    .join("\n");

  return {
    type: "table",
    rows,
    flattenedText,
  };
}
