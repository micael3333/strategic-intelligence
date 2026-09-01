import type { CrossSourceStrategicEvent } from "@/domain/multi-source";

export const GRANTS_SEARCH_URL = "https://api.grants.gov/v1/api/search2";

export interface GrantsSearchQuery {
  keyword: string;
  agencies?: string;
  opportunityStatuses?: string;
  limit?: number;
  offset?: number;
}

export interface GrantsRawHit extends Record<string, unknown> {
  id?: string | number;
  number?: string;
  title?: string;
  agencyCode?: string;
  agencyName?: string;
  openDate?: string;
  closeDate?: string;
  oppStatus?: string;
  docType?: string;
  alnist?: string[];
}

export interface NormalizedGrantOpportunity {
  id: string;
  opportunityId: string;
  opportunityNumber?: string;
  title?: string;
  agencyCode?: string;
  agencyName?: string;
  openDate?: string;
  closeDate?: string;
  status?: string;
  documentType?: string;
  assistanceListingNumbers: string[];
  sourceUrl: string;
  retrievedAt: string;
  rawProvenanceHash: string;
  evidenceLevel: "CONFIRMED";
  raw: GrantsRawHit;
  event: CrossSourceStrategicEvent;
}

export interface GrantsSearchResult {
  records: NormalizedGrantOpportunity[];
  totalRecords: number;
  resultState: "SUCCESS" | "EMPTY";
  retrievedAt: string;
  rawResponseHash: string;
  endpoint: typeof GRANTS_SEARCH_URL;
}
