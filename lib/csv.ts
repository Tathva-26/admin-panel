/**
 * Minimal CSV writing — enough for "give me that list as a spreadsheet",
 * which is what gets asked for a week before the fest.
 */

/**
 * Quotes a value if it could otherwise break the row, and doubles any quotes
 * inside it. Leading `=`, `+`, `-` and `@` are prefixed with an apostrophe:
 * spreadsheets treat those as formulas, and an event named "=cmd" should not
 * become one when someone opens the file.
 */
function escapeCell(value: string | number | null | undefined): string {
  if (value === null || value === undefined) return "";

  // Numbers can never be formulas, and prefixing them would turn a negative
  // amount into text that the spreadsheet refuses to sum.
  if (typeof value === "number") return String(value);

  let text = value;
  if (/^[=+\-@]/.test(text)) text = `'${text}`;

  return /[",\n\r]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
}

export function toCsv(
  headers: string[],
  rows: (string | number | null | undefined)[][],
): string {
  return [headers, ...rows]
    .map((row) => row.map(escapeCell).join(","))
    .join("\r\n");
}

/**
 * Triggers a download of `csv` as `filename`.
 *
 * Prefixed with a BOM so Excel reads it as UTF-8 — without it, event names
 * with accents or a ₹ sign come out mangled.
 */
export function downloadCsv(filename: string, csv: string): void {
  const blob = new Blob([`﻿${csv}`], {
    type: "text/csv;charset=utf-8;",
  });
  const url = URL.createObjectURL(blob);

  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();

  URL.revokeObjectURL(url);
}

/** `events-2026-09-07.csv` */
export function timestampedFilename(prefix: string): string {
  const today = new Date().toISOString().slice(0, 10);
  return `${prefix}-${today}.csv`;
}
