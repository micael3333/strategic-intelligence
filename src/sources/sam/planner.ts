import { PROVIDER_ECONOMICS, SAM_CLUSTER_QUERY_TERMS } from "@/config/provider-economics";
import { TECHNOLOGY_CLUSTERS, matchTechnologyTaxonomy, type TechnologyCluster } from "@/config/technology-clusters";
import { ProviderControlError, RequestController } from "@/sources/runtime/request-control";
import { SAMProvider, SAMProviderError } from "./provider";
import type { NormalizedSAMOpportunity } from "./types";

export interface SAMQueryPlan { cluster?: TechnologyCluster; terms: string[]; maxRequests: number; explanation: string; }
export interface SAMPlannedResult { status: "WORKING" | "EMPTY" | "PARTIAL" | "RATE_LIMITED" | "BUDGET_EXHAUSTED"; plan: SAMQueryPlan; records: NormalizedSAMOpportunity[]; apiRequestsExecuted: number; cacheHits: number; errors: string[]; }

const controller = new RequestController(PROVIDER_ECONOMICS.samOpportunities);
const safeSingleTerm = (value: string) => value.toLowerCase().replace(/[^a-z0-9]/g, " ").split(/\s+/).filter((term) => term.length >= 4).sort((a, b) => b.length - a.length)[0];

export function createSAMQueryPlan(query: string, requestedCluster?: TechnologyCluster): SAMQueryPlan {
  const cluster = requestedCluster ?? matchTechnologyTaxonomy(query).technologyTags[0];
  const configured = cluster ? [...SAM_CLUSTER_QUERY_TERMS[cluster]] : [];
  const fallback = safeSingleTerm(query); const terms = [...new Set([...configured, ...(fallback ? [fallback] : [])])].slice(0, PROVIDER_ECONOMICS.samOpportunities.maxTermsPerPlan);
  return { cluster, terms, maxRequests: PROVIDER_ECONOMICS.samOpportunities.maxTermsPerPlan, explanation: cluster ? `Selected ${terms.length} high-information SAM-compatible terms for ${cluster.replaceAll("_", " ")}; taxonomy synonyms are filtered locally.` : `Selected one normalized SAM-compatible term; no synonym fan-out was performed.` };
}

export class SAMQueryPlanner {
  constructor(private readonly providerFactory: () => SAMProvider = () => new SAMProvider(), private readonly requestController = controller) {}

  async search(input: { query: string; cluster?: TechnologyCluster; postedFrom: string; postedTo: string; limit?: number }): Promise<SAMPlannedResult> {
    const plan = createSAMQueryPlan(input.query, input.cluster); if (!plan.terms.length) return { status: "EMPTY", plan, records: [], apiRequestsExecuted: 0, cacheHits: 0, errors: [] };
    let apiRequestsExecuted = 0; let cacheHits = 0; const errors: string[] = []; let rateLimited = false; let budgetExhausted = false;
    const settled = await Promise.all(plan.terms.map(async (term) => {
      try {
        const controlled = await this.requestController.run(`sam-opportunities:${input.postedFrom}:${input.postedTo}:${term}:${input.limit ?? 25}`, () => this.providerFactory().search({ postedFrom: input.postedFrom, postedTo: input.postedTo, title: term, maxRecords: Math.min(input.limit ?? 25, 50) }), (error) => error instanceof SAMProviderError && error.details.status === "RATE_LIMITED");
        apiRequestsExecuted += controlled.requestExecuted ? 1 : 0; cacheHits += controlled.cacheHit ? 1 : 0; return controlled.value.records;
      } catch (error) {
        if (error instanceof ProviderControlError) { rateLimited ||= error.status === "RATE_LIMITED"; budgetExhausted ||= error.status === "BUDGET_EXHAUSTED"; errors.push(error.message); return []; }
        if (error instanceof SAMProviderError && error.details.status === "RATE_LIMITED") rateLimited = true;
        errors.push(error instanceof Error ? error.message : "SAM planned request failed."); return [];
      }
    }));
    const byId = new Map(settled.flat().map((record) => [record.noticeId, record])); let records = [...byId.values()];
    if (plan.cluster) { const clusterTerms = TECHNOLOGY_CLUSTERS[plan.cluster]; records = records.filter((record) => { const text = `${record.title ?? ""} ${record.description ?? ""}`.toLowerCase(); return clusterTerms.some((term) => text.includes(term)); }); }
    const status = budgetExhausted ? "BUDGET_EXHAUSTED" : rateLimited && !records.length ? "RATE_LIMITED" : errors.length ? "PARTIAL" : records.length ? "WORKING" : "EMPTY";
    return { status, plan, records, apiRequestsExecuted, cacheHits, errors };
  }

  economics() { return this.requestController.state(); }
}
