import type { PoliticalTransaction, ReportedValueRange } from "@/domain/political-capital";
import { providerHealth, type ProviderHealth } from "@/sources/provider";
import { getSource } from "@/sources/registry";
import { sha256 } from "@/sources/usaspending/hash";
import type { HouseDisclosureIngestionResult, HouseDisclosureRow } from "./types";

const amounts = (label: string): ReportedValueRange => { const values = [...label.matchAll(/[\d,]+/g)].map((match) => Number(match[0].replaceAll(",", ""))).filter(Number.isFinite); return { label, minimum: values[0], maximum: /over/i.test(label) ? undefined : values[1], currency: "USD" }; };
const transactionType = (value: string): PoliticalTransaction["transactionType"] => /purchase/i.test(value) ? "PURCHASE" : /sale/i.test(value) ? "SALE" : /exchange/i.test(value) ? "EXCHANGE" : "OTHER";
export class HouseDisclosureProvider {
  readonly id = "provider:house-disclosures"; readonly name = "U.S. House Financial Disclosures"; readonly source = getSource("source:house-disclosures");
  constructor(private readonly now: () => Date = () => new Date()) {}
  async testConnection(): Promise<ProviderHealth> { return { ...providerHealth(this.id, "PARTIAL", "Official House disclosure batch normalizer is ready. No official REST API or automatic PDF extraction is claimed."), mode: "DATASET", authenticationRequired: false }; }
  ingest(rows: HouseDisclosureRow[]): HouseDisclosureIngestionResult { const retrievedAt = this.now().toISOString(); const byId = new Map<string, PoliticalTransaction>(); let duplicatesBlocked = 0; for (const row of rows) { if (!row.filingId || !row.filer || !row.asset || !row.valueRange || !row.sourceUrl.startsWith("https://disclosures-clerk.house.gov/")) continue; const id = `house-transaction:${sha256(`${row.filingId}:${row.transactionDate ?? ""}:${row.asset}:${row.transactionType}:${row.valueRange}`).slice(0, 24)}`; if (byId.has(id)) { duplicatesBlocked += 1; continue; } byId.set(id, { id, chamber: "HOUSE", filer: row.filer, filingId: row.filingId, filingType: row.filingType, transactionDate: row.transactionDate, disclosureDate: row.disclosureDate, asset: row.asset, assetType: row.assetType, transactionType: transactionType(row.transactionType), valueRange: amounts(row.valueRange), owner: row.owner, sourceUrl: row.sourceUrl, retrievedAt, evidenceLevel: "CONFIRMED", mappedCompany: row.mappedCompany, mappedTicker: row.mappedTicker, mappedSector: row.mappedSector, technologyTags: row.technologyTags ?? [], mappingConfidence: row.mappingConfidence, mappingEvidence: row.mappingEvidence }); } const records = [...byId.values()]; return { status: records.length ? "WORKING" : "EMPTY", records, duplicatesBlocked, retrievedAt }; }
}
