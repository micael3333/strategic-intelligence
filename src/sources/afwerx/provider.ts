import { providerHealth, type ProviderHealth } from "@/sources/provider";
import { getSource } from "@/sources/registry";
import { parseAFWERXFundingPage } from "./parser";
import { AFWERX_FUNDING_URL, type AFWERXSearchResult } from "./types";

interface CacheEntry { html: string; retrievedAt: string; expiresAt: number; }
let cache: CacheEntry | undefined;

export class AFWERXProvider {
  readonly id = "provider:afwerx"; readonly name = "AFWERX Official Web"; readonly source = getSource("source:afwerx"); private lastFetch = 0;
  constructor(private readonly options: { fetchImplementation?: typeof fetch; now?: () => Date; cacheTtlMs?: number; minimumIntervalMs?: number } = {}) {}
  private get now() { return this.options.now ?? (() => new Date()); } private get fetchImplementation() { return this.options.fetchImplementation ?? fetch; }

  async testConnection(): Promise<ProviderHealth> {
    try { const result = await this.search(); return { ...providerHealth(this.id, "HEALTHY", "Official AFWERX funding page returned parseable opportunities.", true), mode: "OFFICIAL_WEB", lastSuccessfulRequest: result.retrievedAt, recordsRetrieved: result.records.length, lastRetrievalTimestamp: result.retrievedAt }; }
    catch (error) { return { ...providerHealth(this.id, "UNAVAILABLE", error instanceof Error ? error.message : "AFWERX official-source request failed.", true), mode: "OFFICIAL_WEB", lastError: error instanceof Error ? error.message : "AFWERX parser failed." }; }
  }

  async search(keyword?: string): Promise<AFWERXSearchResult> {
    const now = this.now(); let html: string; let retrievedAt: string; let cacheHit = false;
    if (cache && cache.expiresAt > now.getTime()) { html = cache.html; retrievedAt = cache.retrievedAt; cacheHit = true; }
    else {
      const waitMs = Math.max(0, (this.options.minimumIntervalMs ?? 1_000) - (Date.now() - this.lastFetch)); if (waitMs) await new Promise((resolve) => setTimeout(resolve, waitMs));
      const response = await this.fetchImplementation(AFWERX_FUNDING_URL, { headers: { Accept: "text/html", "User-Agent": "StrategicIntelligence/0.1 local research adapter" }, cache: "no-store" }); this.lastFetch = Date.now();
      if (!response.ok) throw new Error(`AFWERX official page returned HTTP ${response.status}.`); html = await response.text(); retrievedAt = now.toISOString(); cache = { html, retrievedAt, expiresAt: now.getTime() + (this.options.cacheTtlMs ?? 15 * 60_000) };
    }
    let records = parseAFWERXFundingPage(html, retrievedAt); if (!records.length) throw new Error("AFWERX page was retrieved but no official funding opportunities matched the deterministic parser.");
    if (keyword) { const needle = keyword.toLowerCase(); records = records.filter((record) => `${record.title} ${record.description ?? ""}`.toLowerCase().includes(needle)); }
    return { records, retrievedAt, rawSourceHash: records[0]?.rawSourceHash ?? "", sourceUrl: AFWERX_FUNDING_URL, cacheHit };
  }
}
