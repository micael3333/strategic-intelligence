import { PROVIDER_ECONOMICS } from "@/config/provider-economics";
import { calculateObservationTrends, type EnergyObservation } from "@/domain/physical-economy";
import { providerHealth, type ProviderHealth } from "@/sources/provider";
import { getSource } from "@/sources/registry";
import { RequestController } from "@/sources/runtime/request-control";
import { sha256 } from "@/sources/usaspending/hash";
import { EIA_BASE_URL, EIA_DOMAIN_CATALOG, EIA_PRESETS, type EIAObservationQuery, type EIAObservationResult } from "./types";

const controller = new RequestController(PROVIDER_ECONOMICS.eia);
export class EIAProviderError extends Error { constructor(readonly status: "AUTH_REQUIRED" | "RATE_LIMITED" | "UPSTREAM_ERROR" | "INVALID_RESPONSE", message: string) { super(message); this.name = "EIAProviderError"; } }

export class EIAProvider {
  readonly id = "provider:eia"; readonly name = "U.S. Energy Information Administration"; readonly source = getSource("source:eia");
  constructor(private readonly options: { apiKey?: string; fetchImplementation?: typeof fetch; now?: () => Date; timeoutMs?: number; requestController?: RequestController } = {}) {}
  private get apiKey() { return this.options.apiKey ?? process.env.EIA_API_KEY; } private get fetchImplementation() { return this.options.fetchImplementation ?? fetch; } private get now() { return this.options.now ?? (() => new Date()); } private get requestController() { return this.options.requestController ?? controller; }

  async testConnection(): Promise<ProviderHealth> {
    if (!this.apiKey) return { ...providerHealth(this.id, "AUTH_REQUIRED", "EIA_API_KEY is not configured; no request was attempted."), mode: "LIVE_API", authenticationRequired: true };
    try { const result = await this.metadata(); return { ...providerHealth(this.id, "WORKING", `Official EIA API v2 returned ${result.routes.length} top-level domains.`, true), mode: "LIVE_API", authenticationRequired: true, recordsRetrieved: result.routes.length, lastSuccessfulRequest: result.retrievedAt }; }
    catch (error) { return { ...providerHealth(this.id, error instanceof EIAProviderError && error.status === "RATE_LIMITED" ? "RATE_LIMITED" : "UPSTREAM_ERROR", error instanceof Error ? error.message : "EIA request failed.", true), mode: "LIVE_API", authenticationRequired: true, lastError: error instanceof Error ? error.message : "EIA request failed." }; }
  }

  async metadata(category?: keyof typeof EIA_DOMAIN_CATALOG): Promise<{ routes: Array<{ id: string; name: string; description?: string }>; retrievedAt: string }> {
    if (!this.apiKey) throw new EIAProviderError("AUTH_REQUIRED", "EIA_API_KEY is required."); const route = category ? `${EIA_DOMAIN_CATALOG[category].route}/` : "";
    const response = await this.request(`${EIA_BASE_URL}/${route}?api_key=${encodeURIComponent(this.apiKey)}`); const parsed = response as { response?: { routes?: Array<{ id: string; name: string; description?: string }> } }; if (!Array.isArray(parsed.response?.routes)) throw new EIAProviderError("INVALID_RESPONSE", "EIA metadata response omitted routes."); return { routes: parsed.response.routes, retrievedAt: this.now().toISOString() };
  }

  async observations(query: EIAObservationQuery): Promise<EIAObservationResult> {
    if (!this.apiKey) throw new EIAProviderError("AUTH_REQUIRED", "EIA_API_KEY is required."); const preset = EIA_PRESETS[query.preset]; if (!preset) throw new EIAProviderError("INVALID_RESPONSE", "Unknown EIA observation preset."); const safe = { preset: query.preset, start: query.start, end: query.end, limit: Math.min(Math.max(query.limit ?? 500, 1), 5000) };
    const controlled = await this.requestController.run(`eia:${JSON.stringify(safe)}`, async () => {
      const params = new URLSearchParams({ api_key: this.apiKey!, frequency: preset.frequency, offset: "0", length: String(safe.limit) }); params.append("data[0]", preset.data); params.append("sort[0][column]", "period"); params.append("sort[0][direction]", "asc"); if (safe.start) params.set("start", safe.start); if (safe.end) params.set("end", safe.end); for (const [facet, value] of Object.entries(preset.facets)) params.append(`facets[${facet}][]`, value);
      const raw = await this.request(`${EIA_BASE_URL}/${preset.route}/data/?${params}`) as { response?: { data?: Array<Record<string, unknown>> } }; if (!Array.isArray(raw.response?.data)) throw new EIAProviderError("INVALID_RESPONSE", "EIA data response omitted records."); const retrievedAt = this.now().toISOString(); const rawResponseHash = sha256(raw); const sourceUrl = `${EIA_BASE_URL}/${preset.route}/data/`;
      const records = raw.response.data.flatMap((row): EnergyObservation[] => { const period = typeof row.period === "string" ? row.period : undefined; const value = Number(row[preset.data]); if (!period || !Number.isFinite(value)) return []; const geography = preset.geography ?? Object.values(preset.facets).join(" · "); return [{ id: `eia:${sha256(`${query.preset}:${period}:${geography}`).slice(0, 24)}`, source: "EIA", series: `${preset.route}:${preset.data}`, category: preset.category, period, geography, unit: preset.unit, value, frequency: preset.frequency === "daily" ? "DAILY" : "MONTHLY", retrievedAt, sourceUrl, rawProvenanceHash: rawResponseHash }]; });
      return { status: records.length ? "WORKING" as const : "EMPTY" as const, preset: query.preset, records, trends: calculateObservationTrends(records, preset.frequency === "daily" ? "DAILY" : "MONTHLY"), retrievedAt, rawResponseHash };
    }, (error) => error instanceof EIAProviderError && error.status === "RATE_LIMITED");
    return { ...controlled.value, cacheHit: controlled.cacheHit, requestExecuted: controlled.requestExecuted };
  }

  private async request(url: string): Promise<unknown> {
    const abort = new AbortController(); const timeout = setTimeout(() => abort.abort(), this.options.timeoutMs ?? 25_000); let response: Response;
    try { response = await this.fetchImplementation(url, { headers: { Accept: "application/json" }, signal: abort.signal, cache: "no-store" }); } catch { throw new EIAProviderError("UPSTREAM_ERROR", "EIA network request failed."); } finally { clearTimeout(timeout); }
    if (response.status === 401 || response.status === 403) throw new EIAProviderError("AUTH_REQUIRED", `EIA rejected access (HTTP ${response.status}).`); if (response.status === 429) throw new EIAProviderError("RATE_LIMITED", "EIA rate-limited the request."); if (!response.ok) throw new EIAProviderError("UPSTREAM_ERROR", `EIA returned HTTP ${response.status}.`); try { return await response.json(); } catch { throw new EIAProviderError("INVALID_RESPONSE", "EIA returned invalid JSON."); }
  }
}
