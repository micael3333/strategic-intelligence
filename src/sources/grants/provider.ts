import { matchTechnologyTaxonomy } from "@/config/technology-clusters";
import { providerHealth, type ProviderHealth } from "@/sources/provider";
import { getSource } from "@/sources/registry";
import { sha256 } from "@/sources/usaspending/hash";
import { GRANTS_SEARCH_URL, type GrantsRawHit, type GrantsSearchQuery, type GrantsSearchResult, type NormalizedGrantOpportunity } from "./types";

const toIsoDate = (value?: string) => {
  if (!value) return undefined;
  const match = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/.exec(value);
  return match ? `${match[3]}-${match[1].padStart(2, "0")}-${match[2].padStart(2, "0")}` : value;
};

export class GrantsProvider {
  readonly id = "provider:grants";
  readonly name = "Grants.gov";
  readonly source = getSource("source:grants");

  constructor(private readonly options: { fetchImplementation?: typeof fetch; now?: () => Date; timeoutMs?: number } = {}) {}
  private get now() { return this.options.now ?? (() => new Date()); }
  private get fetchImplementation() { return this.options.fetchImplementation ?? fetch; }

  async testConnection(): Promise<ProviderHealth> {
    try {
      const result = await this.search({ keyword: "critical minerals", limit: 1 });
      return { ...providerHealth(this.id, "WORKING", "Official keyless Grants.gov search API returned a valid response.", true), mode: "LIVE_API", recordsRetrieved: result.records.length, lastSuccessfulRequest: result.retrievedAt };
    } catch (error) {
      return { ...providerHealth(this.id, "UPSTREAM_ERROR", error instanceof Error ? error.message : "Grants.gov request failed.", true), mode: "LIVE_API", lastError: error instanceof Error ? error.message : "Grants.gov request failed." };
    }
  }

  async search(query: GrantsSearchQuery): Promise<GrantsSearchResult> {
    if (!query.keyword?.trim()) throw new Error("Grants.gov search requires a keyword.");
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), this.options.timeoutMs ?? 20_000);
    let response: Response;
    try {
      response = await this.fetchImplementation(GRANTS_SEARCH_URL, {
        method: "POST",
        headers: { Accept: "application/json", "Content-Type": "application/json" },
        body: JSON.stringify({ keyword: query.keyword.trim(), agencies: query.agencies ?? "", oppStatuses: query.opportunityStatuses ?? "forecasted|posted", rows: Math.min(Math.max(query.limit ?? 25, 1), 100), startRecordNum: Math.max(query.offset ?? 0, 0) }),
        signal: controller.signal,
        cache: "no-store",
      });
    } catch (error) {
      throw new Error(error instanceof Error && error.name === "AbortError" ? "Grants.gov request timed out." : "Grants.gov network request failed.");
    } finally { clearTimeout(timeout); }
    const text = await response.text();
    if (!response.ok) throw new Error(`Grants.gov returned HTTP ${response.status}.`);
    let parsed: unknown;
    try { parsed = JSON.parse(text); } catch { throw new Error("Grants.gov returned invalid JSON."); }
    const envelope = parsed as { errorcode?: number; msg?: string; data?: { hitCount?: number; oppHits?: GrantsRawHit[] } };
    if (envelope.errorcode !== 0 || !envelope.data || !Array.isArray(envelope.data.oppHits)) throw new Error(`Grants.gov returned an invalid response${envelope.msg ? `: ${envelope.msg}` : "."}`);
    const retrievedAt = this.now().toISOString();
    const rawResponseHash = sha256(parsed);
    const records = envelope.data.oppHits.flatMap((raw): NormalizedGrantOpportunity[] => {
      const opportunityId = String(raw.id ?? raw.number ?? "").trim();
      if (!opportunityId) return [];
      const sourceUrl = `https://www.grants.gov/search-results-detail/${encodeURIComponent(opportunityId)}`;
      const taxonomy = matchTechnologyTaxonomy(raw.title ?? "", `${raw.agencyName ?? ""} ${(raw.alnist ?? []).join(" ")}`);
      return [{
        id: `grant:${opportunityId}`, opportunityId, opportunityNumber: raw.number, title: raw.title, agencyCode: raw.agencyCode, agencyName: raw.agencyName,
        openDate: toIsoDate(raw.openDate), closeDate: toIsoDate(raw.closeDate), status: raw.oppStatus, documentType: raw.docType, assistanceListingNumbers: raw.alnist ?? [],
        sourceUrl, retrievedAt, rawProvenanceHash: rawResponseHash, evidenceLevel: "CONFIRMED", raw,
        event: { id: `event:grant:${opportunityId}`, sourceFamily: "GRANTS_GOV", sourceRecordId: opportunityId, ingestionMethod: "API", sourceType: "GRANT", eventType: raw.oppStatus ?? "GRANT_OPPORTUNITY", title: raw.title, agency: raw.agencyName, eventDate: toIsoDate(raw.openDate), deadline: toIsoDate(raw.closeDate), technologyTags: taxonomy.technologyTags, capabilityTags: taxonomy.matchedTerms, materialTags: taxonomy.technologyTags.includes("CRITICAL_MINERALS") ? taxonomy.matchedTerms : [], strategicTags: ["EARLY_PUBLIC_CAPITAL"], funnelStageCandidate: 2, evidenceLevel: "CONFIRMED", sourceUrl, retrievedAt, rawProvenanceHash: rawResponseHash, rawData: raw },
      }];
    });
    return { records, totalRecords: envelope.data.hitCount ?? records.length, resultState: records.length ? "SUCCESS" : "EMPTY", retrievedAt, rawResponseHash, endpoint: GRANTS_SEARCH_URL };
  }
}
