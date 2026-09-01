import type { CrossSourceStrategicEvent } from "@/domain/multi-source";

export const SAM_OPPORTUNITIES_URL = "https://api.sam.gov/opportunities/v2/search";

export const SAM_OPPORTUNITY_TYPES = {
  r: "SOURCES_SOUGHT",
  p: "PRESOLICITATION",
  o: "SOLICITATION",
  k: "COMBINED_SYNOPSIS_SOLICITATION",
  s: "SPECIAL_NOTICE",
  a: "AWARD_NOTICE",
} as const;
export type SAMOpportunityTypeCode = keyof typeof SAM_OPPORTUNITY_TYPES;

export interface SAMSearchQuery {
  postedFrom: string;
  postedTo: string;
  organization?: string;
  opportunityTypes?: SAMOpportunityTypeCode[];
  title?: string;
  naicsCode?: string;
  classificationCode?: string;
  noticeId?: string;
  solicitationNumber?: string;
  limit?: number;
  offset?: number;
  pageSize?: number;
  maxRecords?: number;
}

export interface SAMRawOpportunity extends Record<string, unknown> {
  noticeId?: string;
  title?: string;
  solicitationNumber?: string;
  postedDate?: string;
  responseDeadLine?: string;
  type?: string;
  baseType?: string;
  department?: string;
  subTier?: string;
  office?: string;
  fullParentPathName?: string;
  fullParentPathCode?: string;
  naicsCode?: string;
  classificationCode?: string;
  setAside?: string;
  active?: string;
  description?: string;
  placeOfPerformance?: Readonly<Record<string, unknown>>;
  pointOfContact?: Array<Readonly<Record<string, unknown>>>;
  uiLink?: string;
  links?: Array<{ href?: string; rel?: string }>;
  award?: { number?: string; amount?: number; date?: string; awardee?: { name?: string; ueiSAM?: string } };
}

export interface SAMRawResponse { totalRecords?: number; limit?: number; offset?: number; opportunitiesData?: SAMRawOpportunity[]; }

export interface NormalizedSAMOpportunity {
  id: string;
  noticeId: string;
  title?: string;
  solicitationNumber?: string;
  postedDate?: string;
  responseDeadline?: string;
  typeCode?: SAMOpportunityTypeCode;
  type: string;
  baseType?: string;
  department?: string;
  subTier?: string;
  office?: string;
  organizationHierarchy?: string;
  organizationCodeHierarchy?: string;
  naicsCode?: string;
  classificationCode?: string;
  setAside?: string;
  active?: string;
  description?: string;
  placeOfPerformance?: Readonly<Record<string, unknown>>;
  sourceUrl: string;
  resourceLinks: string[];
  award?: { number?: string; amount?: number; date?: string; awardeeName?: string; awardeeUei?: string };
  funnelInterpretation: string;
  funnelStageCandidate: 1 | 5;
  evidenceLevel: "CONFIRMED";
  retrievedAt: string;
  rawProvenanceHash: string;
  raw: SAMRawOpportunity;
  event: CrossSourceStrategicEvent;
}

export interface SAMSearchResult {
  records: NormalizedSAMOpportunity[];
  totalRecords: number;
  duplicatesBlocked: number;
  skippedMalformedRecords: number;
  resultState: "SUCCESS" | "EMPTY";
  pagination: { pagesFetched: number; recordsRequested: number; recordsReturned: number; truncated: boolean; nextOffset?: number };
  provenance: { endpoint: typeof SAM_OPPORTUNITIES_URL; requestParameters: Omit<SAMSearchQuery, never>; retrievedAt: string; rawResponseHash: string; httpStatus: number; pages: Array<{ offset: number; limit: number; httpStatus: number; rawResponseHash: string }> };
}

export type SAMProviderErrorStatus = "AUTHENTICATION_ERROR" | "AUTHORIZATION_ERROR" | "RATE_LIMITED" | "UPSTREAM_ERROR" | "NETWORK_ERROR" | "INVALID_RESPONSE" | "INVALID_QUERY" | "NOT_CONFIGURED";

export interface SAMProviderErrorDetails { status: SAMProviderErrorStatus; message: string; httpStatus?: number; retryable: boolean; }
