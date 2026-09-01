import { getSource } from "@/sources/registry";
import { providerHealth, type ProviderHealth } from "@/sources/provider";
import { sha256 } from "@/sources/usaspending/hash";
import { normalizeSAMOpportunity, samDeduplicationKey } from "./normalize";
import { SAM_OPPORTUNITIES_URL, type SAMRawResponse, type SAMSearchQuery, type SAMSearchResult } from "./types";

export class SAMProviderError extends Error {}

function apiDate(value: string): string {
  const [year, month, day] = value.split("-");
  return `${month}/${day}/${year}`;
}

export class SAMProvider {
  readonly id = "provider:sam";
  readonly name = "SAM.gov Opportunities";
  readonly source = getSource("source:sam");
  private readonly seen = new Set<string>();
  constructor(private readonly options: { apiKey?: string; fetchImplementation?: typeof fetch; now?: () => Date; timeoutMs?: number } = {}) {}

  private get apiKey() { return this.options.apiKey ?? process.env.SAM_API_KEY; }
  private get fetchImplementation() { return this.options.fetchImplementation ?? fetch; }
  private get now() { return this.options.now ?? (() => new Date()); }

  async testConnection(): Promise<ProviderHealth> {
    if (!this.apiKey) return { ...providerHealth(this.id, "AUTH_REQUIRED", "SAM_API_KEY is missing. USAspending and all other providers remain available."), mode: "LIVE_API", authenticationRequired: true, lastError: "SAM_API_KEY missing" };
    try {
      const today = this.now();
      const from = new Date(today.getTime() - 7 * 86_400_000);
      const result = await this.search({ postedFrom: from.toISOString().slice(0, 10), postedTo: today.toISOString().slice(0, 10), limit: 1 });
      return { ...providerHealth(this.id, "HEALTHY", "Official SAM Opportunities API returned successfully.", true), mode: "LIVE_API", authenticationRequired: true, lastSuccessfulRequest: result.provenance.retrievedAt, recordsRetrieved: result.records.length, lastRetrievalTimestamp: result.provenance.retrievedAt };
    } catch (error) {
      return { ...providerHealth(this.id, "UNAVAILABLE", error instanceof Error ? error.message : "SAM request failed.", true), mode: "LIVE_API", authenticationRequired: true, lastError: error instanceof Error ? error.message : "SAM request failed." };
    }
  }

  async search(query: SAMSearchQuery): Promise<SAMSearchResult> {
    if (!this.apiKey) throw new SAMProviderError("SAM_API_KEY is required for official SAM Opportunities requests.");
    const from = Date.parse(query.postedFrom); const to = Date.parse(query.postedTo);
    if (!Number.isFinite(from) || !Number.isFinite(to) || to < from || to - from > 366 * 86_400_000) throw new SAMProviderError("SAM posted date range must be valid and no longer than one year.");
    const params = new URLSearchParams({ api_key: this.apiKey, postedFrom: apiDate(query.postedFrom), postedTo: apiDate(query.postedTo), limit: String(Math.min(query.limit ?? 10, 1000)), offset: String(query.offset ?? 0) });
    if (query.organization) params.set("deptname", query.organization);
    for (const type of query.opportunityTypes ?? []) params.append("ptype", type);
    if (query.title) params.set("title", query.title);
    if (query.naicsCode) params.set("ncode", query.naicsCode);
    if (query.classificationCode) params.set("ccode", query.classificationCode);
    if (query.noticeId) params.set("noticeid", query.noticeId);
    if (query.solicitationNumber) params.set("solnum", query.solicitationNumber);
    const controller = new AbortController(); const timeout = setTimeout(() => controller.abort(), this.options.timeoutMs ?? 15_000);
    try {
      const response = await this.fetchImplementation(`${SAM_OPPORTUNITIES_URL}?${params}`, { headers: { Accept: "application/json" }, signal: controller.signal, cache: "no-store" });
      const text = await response.text();
      if (!response.ok) throw new SAMProviderError(`SAM returned HTTP ${response.status}: ${text.slice(0, 300)}`);
      const raw = JSON.parse(text) as SAMRawResponse;
      if (!Array.isArray(raw.opportunitiesData)) throw new SAMProviderError("SAM response did not contain opportunitiesData.");
      const retrievedAt = this.now().toISOString(); const rawResponseHash = sha256(raw); let duplicatesBlocked = 0;
      const records = raw.opportunitiesData.flatMap((item) => {
        try { const normalized = normalizeSAMOpportunity(item, retrievedAt, rawResponseHash); const key = samDeduplicationKey(normalized); if (this.seen.has(key)) { duplicatesBlocked += 1; return []; } this.seen.add(key); return [normalized]; } catch { return []; }
      });
      return { records, totalRecords: raw.totalRecords ?? records.length, duplicatesBlocked, provenance: { endpoint: SAM_OPPORTUNITIES_URL, requestParameters: query, retrievedAt, rawResponseHash, httpStatus: response.status } };
    } finally { clearTimeout(timeout); }
  }
}
