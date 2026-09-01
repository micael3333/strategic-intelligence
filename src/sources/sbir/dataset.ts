import { readFile } from "node:fs/promises";
import { extname } from "node:path";
import type { SBIRRawAward } from "./types";

function parseCsvRows(content: string): string[][] {
  const rows: string[][] = []; let row: string[] = []; let field = ""; let quoted = false;
  for (let index = 0; index < content.length; index += 1) {
    const character = content[index];
    if (character === '"') { if (quoted && content[index + 1] === '"') { field += '"'; index += 1; } else quoted = !quoted; }
    else if (character === "," && !quoted) { row.push(field); field = ""; }
    else if ((character === "\n" || character === "\r") && !quoted) { if (character === "\r" && content[index + 1] === "\n") index += 1; row.push(field); if (row.some(Boolean)) rows.push(row); row = []; field = ""; }
    else field += character;
  }
  if (field || row.length) { row.push(field); rows.push(row); }
  return rows;
}

export function parseSBIRDataset(content: string, extension: string): SBIRRawAward[] {
  const format = extension.toLowerCase();
  if (format === ".json") {
    const parsed = JSON.parse(content) as unknown;
    const records = Array.isArray(parsed) ? parsed : (parsed as { results?: unknown[]; awards?: unknown[] }).results ?? (parsed as { awards?: unknown[] }).awards;
    if (!Array.isArray(records)) throw new Error("SBIR JSON dataset must contain an array, results, or awards.");
    return records.filter((record): record is SBIRRawAward => Boolean(record && typeof record === "object"));
  }
  if (format === ".csv") {
    const [headers, ...rows] = parseCsvRows(content);
    if (!headers?.length) return [];
    return rows.map((row) => Object.fromEntries(headers.map((header, index) => [header.trim(), row[index] ?? ""]))) as SBIRRawAward[];
  }
  if (format === ".xls" || format === ".xlsx") throw new Error("XLS/XLSX ingestion requires conversion to official CSV or JSON in this dependency-light build.");
  throw new Error(`Unsupported SBIR dataset format: ${format}`);
}

export async function loadSBIRDataset(path: string): Promise<SBIRRawAward[]> {
  return parseSBIRDataset(await readFile(path, "utf8"), extname(path));
}
