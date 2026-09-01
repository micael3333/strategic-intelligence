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
}

export interface SAMRawOpportunity extends Record<string, unknown> {
  noticeId?: string;
  title?: string;
  solicitationNumber?: string;
  postedDate?: string;
  responseDeadLine?: string;
  type?: string;
  baseType?: string;
  fullParentPathName?: string;
  fullParentPathCode?: string;
  naicsCode?: string;
  classificationCode?: string;
  setAside?: string;
  active?: string;
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
  organizationHierarchy?: string;
  organizationCodeHierarchy?: string;
  naicsCode?: string;
  classificationCode?: string;
  setAside?: string;
  active?: string;
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
  provenance: { endpoint: typeof SAM_OPPORTUNITIES_URL; requestParameters: Omit<SAMSearchQuery, never>; retrievedAt: string; rawResponseHash: string; httpStatus: number };
}
