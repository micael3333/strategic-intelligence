import type { Evidence, EvidenceLevel, FunnelStage, StrategicEvent } from "@/domain/models";
import type { ProcurementEvent } from "@/domain/procurement";

export const USASPENDING_BASE_URL = "https://api.usaspending.gov";
export const USASPENDING_SPENDING_BY_AWARD_PATH = "/api/v2/search/spending_by_award/";
export const USASPENDING_SPENDING_BY_AWARD_URL = `${USASPENDING_BASE_URL}${USASPENDING_SPENDING_BY_AWARD_PATH}`;

export const CONTRACT_AWARD_TYPE_CODES = ["A", "B", "C", "D"] as const;
export type USAspendingAwardTypeCode =
  | (typeof CONTRACT_AWARD_TYPE_CODES)[number]
  | "02" | "03" | "04" | "05" | "06" | "07" | "08" | "09" | "10" | "11"
  | "IDV_A" | "IDV_B" | "IDV_B_A" | "IDV_B_B" | "IDV_B_C" | "IDV_C" | "IDV_D" | "IDV_E";

export type USAspendingSortField = "Award Amount" | "Start Date" | "End Date" | "Award ID" | "Recipient Name";

export interface USAspendingSearchQuery {
  startDate: string;
  endDate: string;
  keywords?: string[];
  agency?: string;
  recipientSearchText?: string;
  minimumAwardAmount?: number;
  maximumAwardAmount?: number;
  awardTypeCodes?: USAspendingAwardTypeCode[];
  naicsCodes?: string[];
  pscCodes?: string[];
  page?: number;
  limit?: number;
  sort?: USAspendingSortField;
  order?: "asc" | "desc";
}

export interface USAspendingUpstreamRequest {
  spending_level: "awards";
  subawards: false;
  fields: string[];
  filters: {
    time_period: Array<{ start_date: string; end_date: string; date_type: "new_awards_only" }>;
    award_type_codes: USAspendingAwardTypeCode[];
    keywords?: string[];
    agencies?: Array<{ type: "awarding"; tier: "toptier"; name: string }>;
    recipient_search_text?: string[];
    award_amounts?: Array<{ lower_bound?: number; upper_bound?: number }>;
    naics_codes?: { require: string[] };
    psc_codes?: string[];
  };
  page: number;
  limit: number;
  sort: USAspendingSortField;
  order: "asc" | "desc";
}

export interface USAspendingRawAward extends Record<string, unknown> {
  internal_id: number;
  "Award ID"?: string | null;
  generated_internal_id?: string | null;
  "Recipient Name"?: string | null;
  recipient_id?: string | null;
  prime_award_recipient_id?: string | null;
  "Recipient UEI"?: string | null;
  "Recipient DUNS Number"?: string | null;
  "Award Amount"?: number | null;
  "Start Date"?: string | null;
  "End Date"?: string | null;
  "Base Obligation Date"?: string | null;
  "Last Modified Date"?: string | null;
  "Contract Award Type"?: string | null;
  "Award Type"?: string | null;
  "Awarding Agency"?: string | null;
  "Awarding Agency Code"?: string | null;
  "Awarding Sub Agency"?: string | null;
  "Awarding Sub Agency Code"?: string | null;
  "Funding Agency"?: string | null;
  "Funding Agency Code"?: string | null;
  "Funding Sub Agency"?: string | null;
  "Funding Sub Agency Code"?: string | null;
  Description?: string | null;
  NAICS?: string | number | null;
  PSC?: string | number | null;
  "Primary Place of Performance"?: string | null;
  "Recipient Location"?: string | null;
}

export interface USAspendingUpstreamResponse {
  spending_level: "awards";
  limit: number;
  results: USAspendingRawAward[];
  page_metadata?: { page: number; hasNext: boolean; last_record_unique_id?: number; last_record_sort_value?: string };
  messages?: string[];
}

export interface RequestProvenance {
  provider: "usaspending";
  endpoint: typeof USASPENDING_SPENDING_BY_AWARD_URL;
  requestParameters: USAspendingUpstreamRequest;
  retrievedAt: string;
  httpStatus: number;
  responseHash: string;
  rawResponse: USAspendingUpstreamResponse;
}

export interface NormalizedUSAspendingAward {
  id: string;
  generatedInternalId?: string;
  awardId?: string;
  recipientName?: string;
  recipientIdentifier?: string;
  uei?: string;
  duns?: string;
  awardAmount?: number;
  startDate?: string;
  endDate?: string;
  baseObligationDate?: string;
  lastModifiedDate?: string;
  awardType?: string;
  awardingAgency?: string;
  awardingAgencyCode?: string;
  awardingSubagency?: string;
  awardingSubagencyCode?: string;
  fundingAgency?: string;
  fundingAgencyCode?: string;
  fundingSubagency?: string;
  fundingSubagencyCode?: string;
  description?: string;
  naics?: string;
  psc?: string;
  placeOfPerformance?: string;
  recipientLocation?: string;
  sourceProvider: "usaspending";
  sourceEndpoint: typeof USASPENDING_SPENDING_BY_AWARD_URL;
  retrievedAt: string;
  rawRecord: USAspendingRawAward;
}

export type EntityResolutionStatus = "RESOLVED_STRONG_ID" | "RESOLVED_EXACT_ALIAS" | "ENTITY_REVIEW_REQUIRED";

export interface ResolvedRecipient {
  id: string;
  canonicalName: string;
  aliases: string[];
  identifiers: { recipientId?: string; uei?: string; duns?: string };
  status: EntityResolutionStatus;
  explanation: string;
}

export interface ThemeMatch {
  themeId: string;
  themeName: string;
  matchedTerms: string[];
  evidenceLevel: Exclude<EvidenceLevel, "SPECULATIVE">;
  explanation: string;
}

export interface FunnelInterpretation {
  classification: "PROCUREMENT_EVENT";
  stage: FunnelStage | null;
  explanation: string;
  ruleId: string;
}

export interface ProcessedUSAspendingAward {
  raw: USAspendingRawAward;
  normalized: NormalizedUSAspendingAward;
  recipient: ResolvedRecipient;
  evidence: Evidence;
  themeMatch: ThemeMatch | null;
  funnel: FunnelInterpretation;
  procurementEvent: ProcurementEvent;
  strategicEvents: StrategicEvent[];
  deduplication: { key: string; isDuplicate: boolean };
}

export interface USAspendingSearchResult {
  query: USAspendingSearchQuery;
  provenance: RequestProvenance;
  awards: ProcessedUSAspendingAward[];
  summary: {
    rawAwardCount: number;
    newAwardCount: number;
    duplicateCount: number;
    resolvedRecipientCount: number;
    reviewRequiredCount: number;
    candidateSignalCount: number;
  };
}

export interface USAspendingErrorDetails {
  status: "TEMPORARILY_UNAVAILABLE" | "FAILED";
  message: string;
  httpStatus?: number;
  endpoint: typeof USASPENDING_SPENDING_BY_AWARD_URL;
}

export class USAspendingProviderError extends Error {
  constructor(readonly details: USAspendingErrorDetails) {
    super(details.message);
    this.name = "USAspendingProviderError";
  }
}
