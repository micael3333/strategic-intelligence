import { PROVIDER_ECONOMICS } from "@/config/provider-economics";
import { matchTechnologyTaxonomy } from "@/config/technology-clusters";
import { providerHealth, type ProviderHealth } from "@/sources/provider";
import { getSource } from "@/sources/registry";
import { ProviderControlError, RequestController } from "@/sources/runtime/request-control";
import { sha256 } from "@/sources/usaspending/hash";
import { SAM_CONTRACT_AWARDS_URL, type NormalizedSAMContractAward, type SAMContractAwardQuery, type SAMContractAwardRaw, type SAMContractAwardResult } from "./types";

const controller = new RequestController(PROVIDER_ECONOMICS.samContractAwards);
const stringAt = (object: unknown, ...paths: string[][]): string | undefined => { for (const path of paths) { let value: unknown = object; for (const key of path) value = value && typeof value === "object" ? (value as Record<string, unknown>)[key] : undefined; if (typeof value === "string" && value.trim()) return value.trim(); } return undefined; };
const numberAt = (object: unknown, ...paths: string[][]): number | undefined => { for (const path of paths) { let value: unknown = object; for (const key of path) value = value && typeof value === "object" ? (value as Record<string, unknown>)[key] : undefined; const number = typeof value === "number" ? value : typeof value === "string" && value.trim() ? Number(value) : undefined; if (number !== undefined && Number.isFinite(number)) return number; } return undefined; };
const apiDate = (value: string) => { const [year, month, day] = value.split("-"); return `${month}/${day}/${year}`; };

export class SAMContractAwardsError extends Error { constructor(readonly status: "AUTH_REQUIRED" | "RATE_LIMITED" | "UPSTREAM_ERROR" | "INVALID_RESPONSE" | "BUDGET_EXHAUSTED", message: string) { super(message); this.name = "SAMContractAwardsError"; } }

export class SAMContractAwardsProvider {
  readonly id = "provider:sam-contract-awards"; readonly name = "SAM.gov Contract Awards"; readonly source = getSource("source:sam-contract-awards");
  constructor(private readonly options: { apiKey?: string; fetchImplementation?: typeof fetch; now?: () => Date; timeoutMs?: number; requestController?: RequestController } = {}) {}
  private get apiKey() { return this.options.apiKey ?? process.env.SAM_API_KEY; } private get fetchImplementation() { return this.options.fetchImplementation ?? fetch; } private get now() { return this.options.now ?? (() => new Date()); } private get requestController() { return this.options.requestController ?? controller; }

  async testConnection(): Promise<ProviderHealth> {
    if (!this.apiKey) return { ...providerHealth(this.id, "AUTH_REQUIRED", "SAM_API_KEY is not configured; no request was attempted."), mode: "LIVE_API", authenticationRequired: true };
    const budget = this.requestController.state(); if (budget.dailyRequestBudget !== undefined && budget.budgetUsed >= budget.dailyRequestBudget) return { ...providerHealth(this.id, "BUDGET_EXHAUSTED", "Local Contract Awards request budget is exhausted; no request was attempted."), mode: "LIVE_API", authenticationRequired: true };
    return { ...providerHealth(this.id, "PARTIAL", "Credential is configured. Scarce live checks run only for explicit searches."), mode: "LIVE_API", authenticationRequired: true };
  }

  async search(query: SAMContractAwardQuery): Promise<SAMContractAwardResult> {
    if (!this.apiKey) throw new SAMContractAwardsError("AUTH_REQUIRED", "SAM_API_KEY is required for Contract Awards.");
    const safeQuery = { ...query, limit: Math.min(Math.max(query.limit ?? 10, 1), 25), offset: Math.max(query.offset ?? 0, 0) };
    try {
      const controlled = await this.requestController.run(`sam-contract-awards:${JSON.stringify(safeQuery)}`, () => this.fetchAndNormalize(safeQuery), (error) => error instanceof SAMContractAwardsError && error.status === "RATE_LIMITED");
      const state = this.requestController.state(); return { ...controlled.value, cacheHit: controlled.cacheHit, requestExecuted: controlled.requestExecuted, budget: { used: state.budgetUsed, limit: state.dailyRequestBudget } };
    } catch (error) { if (error instanceof ProviderControlError) throw new SAMContractAwardsError(error.status, error.message); throw error; }
  }

  private async fetchAndNormalize(query: SAMContractAwardQuery & { limit: number; offset: number }): Promise<Omit<SAMContractAwardResult, "cacheHit" | "requestExecuted" | "budget">> {
    const params = new URLSearchParams({ api_key: this.apiKey!, limit: String(query.limit), offset: String(query.offset), includeSections: "contractId,coreData,awardDetails,awardeeData" });
    if (query.query) params.set("q", query.query); if (query.lastModifiedFrom || query.lastModifiedTo) params.set("lastModifiedDate", `[${query.lastModifiedFrom ? apiDate(query.lastModifiedFrom) : ""},${query.lastModifiedTo ? apiDate(query.lastModifiedTo) : ""}]`); if (query.contractingDepartmentCode) params.set("contractingDepartmentCode", query.contractingDepartmentCode); if (query.awardeeName) params.set("awardeeName", query.awardeeName); if (query.awardeeUei) params.set("awardeeUniqueEntityId", query.awardeeUei);
    const controllerAbort = new AbortController(); const timeout = setTimeout(() => controllerAbort.abort(), this.options.timeoutMs ?? 30_000); let response: Response;
    try { response = await this.fetchImplementation(`${SAM_CONTRACT_AWARDS_URL}?${params}`, { headers: { Accept: "application/json" }, signal: controllerAbort.signal, cache: "no-store" }); }
    catch { throw new SAMContractAwardsError("UPSTREAM_ERROR", "SAM Contract Awards network request failed."); } finally { clearTimeout(timeout); }
    if (response.status === 204) return { status: "EMPTY", records: [], totalRecords: 0, retrievedAt: this.now().toISOString(), rawResponseHash: sha256({ empty: true }) };
    if (response.status === 403 || response.status === 401) throw new SAMContractAwardsError("AUTH_REQUIRED", `SAM Contract Awards rejected access (HTTP ${response.status}).`); if (response.status === 429) throw new SAMContractAwardsError("RATE_LIMITED", "SAM Contract Awards rate-limited the request."); if (!response.ok) throw new SAMContractAwardsError("UPSTREAM_ERROR", `SAM Contract Awards returned HTTP ${response.status}.`);
    let raw: unknown; try { raw = await response.json(); } catch { throw new SAMContractAwardsError("INVALID_RESPONSE", "SAM Contract Awards returned invalid JSON."); }
    const envelope = raw as { awardSummary?: SAMContractAwardRaw[]; totalRecords?: number; total?: number }; if (!Array.isArray(envelope.awardSummary)) throw new SAMContractAwardsError("INVALID_RESPONSE", "SAM Contract Awards response omitted awardSummary.");
    const retrievedAt = this.now().toISOString(); const rawResponseHash = sha256(raw); const records = envelope.awardSummary.flatMap((item): NormalizedSAMContractAward[] => {
      const piid = stringAt(item, ["contractId", "piid"]); if (!piid) return [];
      const modificationNumber = stringAt(item, ["contractId", "modificationNumber"]); const transactionNumber = stringAt(item, ["contractId", "transactionNumber"]); const recordId = sha256(`${piid}:${modificationNumber ?? ""}:${transactionNumber ?? ""}`).slice(0, 24);
      const awardeeName = stringAt(item, ["awardeeData", "awardee", "legalBusinessName"], ["awardeeData", "awardeeName"], ["awardeeData", "legalBusinessName"]); const awardeeUei = stringAt(item, ["awardeeData", "awardee", "uniqueEntityId"], ["awardeeData", "uniqueEntityId"]); const description = stringAt(item, ["awardDetails", "productOrService", "description"], ["awardDetails", "description"]); const taxonomy = matchTechnologyTaxonomy(description, query.query);
      const sourceUrl = "https://sam.gov/content/contract-awards"; const dateSigned = stringAt(item, ["awardDetails", "dates", "dateSigned"]); const actionObligation = numberAt(item, ["awardDetails", "dollars", "actionObligation"]); const totalContractValue = numberAt(item, ["awardDetails", "dollars", "baseAndAllOptionsValue"], ["awardDetails", "dollars", "totalContractValue"]);
      return [{ id: `sam-award:${recordId}`, piid, modificationNumber, transactionNumber, awardType: stringAt(item, ["coreData", "awardOrIDVType", "name"]), awardeeName, awardeeUei, contractingDepartment: stringAt(item, ["contractId", "department", "name"]), contractingSubtier: stringAt(item, ["contractId", "subtier", "name"]), contractingOffice: stringAt(item, ["contractId", "contractingOffice", "name"]), dateSigned, actionObligation, totalContractValue, description, sourceUrl, retrievedAt, rawProvenanceHash: rawResponseHash, raw: item,
        event: { id: `event:sam-award:${recordId}`, sourceFamily: "SAM_CONTRACT_AWARDS", sourceRecordId: piid, ingestionMethod: "API", sourceType: "CONTRACT", eventType: "CONTRACT_AWARD", title: description ?? piid, description, eventDate: dateSigned, entityName: awardeeName, uei: awardeeUei, agency: stringAt(item, ["contractId", "department", "name"]), subAgency: stringAt(item, ["contractId", "subtier", "name"]), office: stringAt(item, ["contractId", "contractingOffice", "name"]), amount: actionObligation, solicitationNumber: stringAt(item, ["coreData", "solicitationId"]), technologyTags: taxonomy.technologyTags, capabilityTags: taxonomy.matchedTerms, materialTags: taxonomy.technologyTags.includes("CRITICAL_MINERALS") ? taxonomy.matchedTerms : [], strategicTags: ["PROCUREMENT_DETAIL"], funnelStageCandidate: 5, evidenceLevel: "CONFIRMED", sourceUrl, retrievedAt, rawProvenanceHash: rawResponseHash, rawData: item } }];
    });
    return { status: records.length ? "WORKING" : "EMPTY", records, totalRecords: envelope.totalRecords ?? envelope.total ?? records.length, retrievedAt, rawResponseHash };
  }
}
