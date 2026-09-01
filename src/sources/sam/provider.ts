import { getSource } from "@/sources/registry";
import { providerHealth, type ProviderHealth, type ProviderHealthStatus } from "@/sources/provider";
import { sha256 } from "@/sources/usaspending/hash";
import { normalizeSAMOpportunity, samDeduplicationKey } from "./normalize";
import { SAM_OPPORTUNITIES_URL, type SAMProviderErrorDetails, type SAMProviderErrorStatus, type SAMRawOpportunity, type SAMRawResponse, type SAMSearchQuery, type SAMSearchResult } from "./types";

export class SAMProviderError extends Error {
  constructor(readonly details: SAMProviderErrorDetails) { super(details.message); this.name = "SAMProviderError"; }
}

function apiDate(value: string): string { const [year, month, day] = value.split("-"); return `${month}/${day}/${year}`; }
const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

function statusError(httpStatus: number): SAMProviderError {
  const mapping: Record<number, { status: SAMProviderErrorStatus; message: string; retryable: boolean }> = {
    401: { status: "AUTHENTICATION_ERROR", message: "SAM rejected the configured API credential (HTTP 401).", retryable: false },
    403: { status: "AUTHORIZATION_ERROR", message: "SAM denied this request (HTTP 403); the key may lack access or an upstream policy may be blocking it.", retryable: false },
    429: { status: "RATE_LIMITED", message: "SAM rate-limited this request (HTTP 429).", retryable: true },
  };
  const known = mapping[httpStatus];
  return new SAMProviderError(known ? { ...known, httpStatus } : { status: "UPSTREAM_ERROR", message: `SAM returned upstream HTTP ${httpStatus}.`, httpStatus, retryable: httpStatus >= 500 });
}

export class SAMProvider {
  readonly id = "provider:sam"; readonly name = "SAM.gov Opportunities"; readonly source = getSource("source:sam"); private readonly seen = new Set<string>();
  constructor(private readonly options: { apiKey?: string; fetchImplementation?: typeof fetch; now?: () => Date; timeoutMs?: number } = {}) {}
  private get apiKey() { return this.options.apiKey ?? process.env.SAM_API_KEY; }
  private get fetchImplementation() { return this.options.fetchImplementation ?? fetch; }
  private get now() { return this.options.now ?? (() => new Date()); }

  async testConnection(): Promise<ProviderHealth> {
    if (!this.apiKey) return { ...providerHealth(this.id, "AUTH_REQUIRED", "SAM_API_KEY is missing. Other providers remain available."), mode: "LIVE_API", authenticationRequired: true, lastError: "SAM_API_KEY missing" };
    try {
      const today = this.now(); const from = new Date(today.getTime() - 7 * 86_400_000);
      const result = await this.search({ postedFrom: from.toISOString().slice(0, 10), postedTo: today.toISOString().slice(0, 10), limit: 1 });
      return { ...providerHealth(this.id, "WORKING", result.resultState === "EMPTY" ? "SAM responded successfully with zero matching opportunities." : "Official SAM Opportunities API returned successfully.", true), mode: "LIVE_API", authenticationRequired: true, lastSuccessfulRequest: result.provenance.retrievedAt, recordsRetrieved: result.records.length, lastRetrievalTimestamp: result.provenance.retrievedAt };
    } catch (error) {
      const details = error instanceof SAMProviderError ? error.details : { status: "NETWORK_ERROR" as const, message: "SAM request failed.", retryable: true };
      const status: ProviderHealthStatus = details.status === "AUTHENTICATION_ERROR" || details.status === "NOT_CONFIGURED" ? "AUTH_REQUIRED" : details.status === "RATE_LIMITED" ? "RATE_LIMITED" : details.status === "UPSTREAM_ERROR" || details.status === "AUTHORIZATION_ERROR" ? "UPSTREAM_ERROR" : "UNAVAILABLE";
      return { ...providerHealth(this.id, status, details.message, true), mode: "LIVE_API", authenticationRequired: true, lastError: details.message };
    }
  }

  async search(query: SAMSearchQuery): Promise<SAMSearchResult> {
    if (!this.apiKey) throw new SAMProviderError({ status: "NOT_CONFIGURED", message: "SAM_API_KEY is required for official SAM Opportunities requests.", retryable: false });
    const from = Date.parse(query.postedFrom); const to = Date.parse(query.postedTo);
    if (!Number.isFinite(from) || !Number.isFinite(to) || to < from || to - from > 366 * 86_400_000) throw new SAMProviderError({ status: "INVALID_QUERY", message: "SAM posted date range must be valid and no longer than one year.", retryable: false });
    const recordsRequested = clamp(query.maxRecords ?? query.limit ?? 10, 1, 5000); const pageSize = clamp(query.pageSize ?? Math.min(recordsRequested, 1000), 1, 1000); let offset = Math.max(0, query.offset ?? 0);
    const rawRecords: SAMRawOpportunity[] = []; const pages: SAMSearchResult["provenance"]["pages"] = []; let totalRecords = 0; let finalStatus = 200;
    while (rawRecords.length < recordsRequested) {
      const limit = Math.min(pageSize, recordsRequested - rawRecords.length); const page = await this.fetchPage(query, offset, limit); finalStatus = page.httpStatus; totalRecords = page.raw.totalRecords ?? totalRecords;
      pages.push({ offset, limit, httpStatus: page.httpStatus, rawResponseHash: page.hash }); rawRecords.push(...page.raw.opportunitiesData!);
      if (!page.raw.opportunitiesData!.length || page.raw.opportunitiesData!.length < limit || offset + page.raw.opportunitiesData!.length >= totalRecords) break;
      offset += page.raw.opportunitiesData!.length;
    }
    const retrievedAt = this.now().toISOString(); const rawResponseHash = sha256(pages.map((page) => page.rawResponseHash)); let duplicatesBlocked = 0; let skippedMalformedRecords = 0;
    const records = rawRecords.flatMap((item) => { try { const normalized = normalizeSAMOpportunity(item, retrievedAt, rawResponseHash); const key = samDeduplicationKey(normalized); if (this.seen.has(key)) { duplicatesBlocked += 1; return []; } this.seen.add(key); return [normalized]; } catch { skippedMalformedRecords += 1; return []; } });
    const recordsReturned = rawRecords.length; const truncated = recordsReturned < totalRecords && recordsReturned >= recordsRequested;
    return { records, totalRecords, duplicatesBlocked, skippedMalformedRecords, resultState: recordsReturned ? "SUCCESS" : "EMPTY", pagination: { pagesFetched: pages.length, recordsRequested, recordsReturned, truncated, nextOffset: truncated ? (query.offset ?? 0) + recordsReturned : undefined }, provenance: { endpoint: SAM_OPPORTUNITIES_URL, requestParameters: query, retrievedAt, rawResponseHash, httpStatus: finalStatus, pages } };
  }

  private async fetchPage(query: SAMSearchQuery, offset: number, limit: number): Promise<{ raw: SAMRawResponse; hash: string; httpStatus: number }> {
    const params = new URLSearchParams({ api_key: this.apiKey!, postedFrom: apiDate(query.postedFrom), postedTo: apiDate(query.postedTo), limit: String(limit), offset: String(offset) });
    if (query.organization) params.set("deptname", query.organization); for (const type of query.opportunityTypes ?? []) params.append("ptype", type);
    if (query.title) params.set("title", query.title); if (query.naicsCode) params.set("ncode", query.naicsCode); if (query.classificationCode) params.set("ccode", query.classificationCode); if (query.noticeId) params.set("noticeid", query.noticeId); if (query.solicitationNumber) params.set("solnum", query.solicitationNumber);
    const controller = new AbortController(); const timeout = setTimeout(() => controller.abort(), this.options.timeoutMs ?? 30_000);
    try {
      const response = await this.fetchImplementation(`${SAM_OPPORTUNITIES_URL}?${params}`, { headers: { Accept: "application/json" }, signal: controller.signal, cache: "no-store" });
      const text = await response.text(); if (!response.ok) throw statusError(response.status);
      let raw: SAMRawResponse; try { raw = JSON.parse(text) as SAMRawResponse; } catch { throw new SAMProviderError({ status: "INVALID_RESPONSE", message: "SAM returned invalid JSON.", httpStatus: response.status, retryable: false }); }
      if (!Array.isArray(raw.opportunitiesData)) throw new SAMProviderError({ status: "INVALID_RESPONSE", message: "SAM response did not contain opportunitiesData.", httpStatus: response.status, retryable: false });
      return { raw, hash: sha256(raw), httpStatus: response.status };
    } catch (error) {
      if (error instanceof SAMProviderError) throw error;
      const aborted = error instanceof Error && error.name === "AbortError"; const unsafe = error instanceof Error ? error.message : "unknown network failure"; const safe = this.apiKey ? unsafe.replaceAll(this.apiKey, "[REDACTED]") : unsafe;
      throw new SAMProviderError({ status: "NETWORK_ERROR", message: aborted ? `SAM request timed out after ${this.options.timeoutMs ?? 30_000}ms.` : `SAM network request failed: ${safe}`, retryable: true });
    } finally { clearTimeout(timeout); }
  }
}
