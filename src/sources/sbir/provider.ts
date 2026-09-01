import { access } from "node:fs/promises";
import { providerHealth, type ProviderHealth } from "@/sources/provider";
import { getSource } from "@/sources/registry";
import { sha256 } from "@/sources/usaspending/hash";
import { loadSBIRDataset } from "./dataset";
import { normalizeSBIRAward } from "./normalize";
import { SBIR_AWARDS_API_URL, SBIR_COMPANIES_API_URL, SBIR_SOLICITATIONS_API_URL, type NormalizedSBIRAward, type SBIRApiRecords, type SBIRCompanyQuery, type SBIRRawAward, type SBIRRawCompany, type SBIRRawSolicitation, type SBIRSearchQuery, type SBIRSearchResult, type SBIRSolicitationQuery } from "./types";

export class SBIRProvider {
  readonly id = "provider:sbir"; readonly name = "SBIR / STTR"; readonly source = getSource("source:sbir"); private readonly seen = new Set<string>();
  constructor(private readonly options: { fetchImplementation?: typeof fetch; datasetPath?: string; now?: () => Date; timeoutMs?: number } = {}) {}
  private get datasetPath() { return this.options.datasetPath ?? process.env.SBIR_DATASET_PATH; }
  private get now() { return this.options.now ?? (() => new Date()); }
  private get fetchImplementation() { return this.options.fetchImplementation ?? fetch; }

  async datasetAvailable(): Promise<boolean> { if (!this.datasetPath) return false; try { await access(this.datasetPath); return true; } catch { return false; } }

  async testConnection(): Promise<ProviderHealth> {
    const datasetAvailable = await this.datasetAvailable();
    try {
      const controller = new AbortController(); const timeout = setTimeout(() => controller.abort(), this.options.timeoutMs ?? 10_000);
      const response = await this.fetchImplementation(`${SBIR_AWARDS_API_URL}?rows=1`, { signal: controller.signal, headers: { Accept: "application/json" }, cache: "no-store" }); clearTimeout(timeout);
      if (response.ok) return { ...providerHealth(this.id, datasetAvailable ? "DEGRADED" : "HEALTHY", datasetAvailable ? "Official API responded; dataset fallback is also configured." : "Official SBIR API responded.", true), mode: "LIVE_API", recordsRetrieved: 1 };
      return { ...providerHealth(this.id, "MAINTENANCE", `Official SBIR API returned HTTP ${response.status}.${datasetAvailable ? " Dataset fallback is available." : " No local dataset is configured."}`, true), mode: datasetAvailable ? "DATASET" : "LIVE_API", lastError: `HTTP ${response.status}` };
    } catch (error) {
      return { ...providerHealth(this.id, datasetAvailable ? "DEGRADED" : "MAINTENANCE", datasetAvailable ? "Official API is unavailable; official dataset fallback is available." : "Official API is unavailable and no dataset is configured.", true), mode: datasetAvailable ? "DATASET" : "LIVE_API", lastError: error instanceof Error ? error.message : "SBIR health check failed." };
    }
  }

  async search(query: SBIRSearchQuery): Promise<SBIRSearchResult> {
    try { return await this.searchApi(query); } catch (apiError) { if (await this.datasetAvailable()) return this.searchDataset(query); throw apiError; }
  }

  async searchCompanies(query: SBIRCompanyQuery): Promise<SBIRApiRecords<SBIRRawCompany>> {
    const params = new URLSearchParams({ rows: String(Math.min(query.limit ?? 100, 5000)), start: String(query.start ?? 0) });
    if (query.keyword) params.set("keyword", query.keyword); if (query.name) params.set("name", query.name); if (query.uei) params.set("uei", query.uei);
    return this.fetchOfficialRecords<SBIRRawCompany>(SBIR_COMPANIES_API_URL, params);
  }

  async searchSolicitations(query: SBIRSolicitationQuery): Promise<SBIRApiRecords<SBIRRawSolicitation>> {
    const params = new URLSearchParams({ rows: String(Math.min(query.limit ?? 25, 50)), start: String(query.start ?? 0) });
    if (query.keyword) params.set("keyword", query.keyword); if (query.agency) params.set("agency", query.agency); if (query.open) params.set("open", "1"); if (query.closed) params.set("closed", "1");
    return this.fetchOfficialRecords<SBIRRawSolicitation>(SBIR_SOLICITATIONS_API_URL, params);
  }

  private async fetchOfficialRecords<T extends Record<string, unknown>>(endpoint: string, params: URLSearchParams): Promise<SBIRApiRecords<T>> {
    const response = await this.fetchImplementation(`${endpoint}?${params}`, { headers: { Accept: "application/json" }, cache: "no-store" });
    const text = await response.text(); if (!response.ok) throw new Error(`SBIR API returned HTTP ${response.status}.`);
    const parsed = JSON.parse(text) as unknown; const records = Array.isArray(parsed) ? parsed : (parsed as { results?: T[] }).results;
    if (!Array.isArray(records)) throw new Error("SBIR API returned malformed records.");
    return { records, retrievedAt: this.now().toISOString(), rawResponseHash: sha256(parsed), endpoint };
  }

  private async searchApi(query: SBIRSearchQuery): Promise<SBIRSearchResult> {
    const params = new URLSearchParams({ rows: String(Math.min(query.limit ?? 25, 100)) });
    if (query.company) params.set("firm", query.company); if (query.agency) params.set("agency", query.agency); if (query.year) params.set("year", String(query.year));
    const response = await this.fetchImplementation(`${SBIR_AWARDS_API_URL}?${params}`, { headers: { Accept: "application/json" }, cache: "no-store" });
    const text = await response.text(); if (!response.ok) throw new Error(`SBIR API returned HTTP ${response.status}.`);
    const parsed = JSON.parse(text) as unknown; const raw = (Array.isArray(parsed) ? parsed : (parsed as { results?: SBIRRawAward[] }).results) ?? [];
    if (!Array.isArray(raw)) throw new Error("SBIR API returned malformed award data."); return this.normalize(raw, query, "API");
  }

  private async searchDataset(query: SBIRSearchQuery): Promise<SBIRSearchResult> { return this.normalize(await loadSBIRDataset(this.datasetPath!), query, "DATASET"); }

  private normalize(raw: SBIRRawAward[], query: SBIRSearchQuery, mode: "API" | "DATASET"): SBIRSearchResult {
    const retrievedAt = this.now().toISOString(); const rawResponseHash = sha256(raw); const needle = query.keyword?.toLowerCase(); let duplicatesBlocked = 0;
    const records = raw.flatMap((item) => { try { const record = normalizeSBIRAward(item, retrievedAt, rawResponseHash, mode); const text = `${record.awardTitle ?? ""} ${record.abstract ?? ""} ${record.researchKeywords ?? ""}`.toLowerCase(); if (needle && !text.includes(needle)) return []; if (query.company && !record.firm?.toLowerCase().includes(query.company.toLowerCase())) return []; if (query.agency && record.agency?.toLowerCase() !== query.agency.toLowerCase()) return []; if (query.year && record.awardYear !== query.year) return []; if (this.seen.has(record.id)) { duplicatesBlocked += 1; return []; } this.seen.add(record.id); return [record]; } catch { return []; } }).slice(0, query.limit ?? 25);
    return { records, mode, duplicatesBlocked, retrievedAt, rawResponseHash };
  }
}
