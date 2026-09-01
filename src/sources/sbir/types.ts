import type { CrossSourceStrategicEvent } from "@/domain/multi-source";

export const SBIR_AWARDS_API_URL = "https://api.www.sbir.gov/public/api/awards";
export const SBIR_COMPANIES_API_URL = "https://api.www.sbir.gov/public/api/firm";
export const SBIR_SOLICITATIONS_API_URL = "https://api.www.sbir.gov/public/api/solicitations";

export interface SBIRSearchQuery { keyword?: string; company?: string; agency?: string; year?: number; limit?: number; }
export interface SBIRRawAward extends Record<string, unknown> {
  firm?: string; uei?: string; duns?: string; award_title?: string; agency?: string; branch?: string; phase?: string; program?: string;
  agency_tracking_number?: string; contract?: string; proposal_award_date?: string; contract_end_date?: string; solicitation_number?: string;
  solicitation_year?: string | number; topic_code?: string; award_year?: string | number; award_amount?: string | number; company_url?: string;
  research_area_keywords?: string; abstract?: string; award_link?: string;
}
export interface SBIRRawCompany extends Record<string, unknown> { firm_nid?: string; company_name?: string; sbir_url?: string; uei?: string; duns?: string; address1?: string; address2?: string; city?: string; state?: string; zip?: string; company_url?: string; number_awards?: string | number; }
export interface SBIRRawTopic extends Record<string, unknown> { topic_title?: string; branch?: string; topic_number?: string; topic_description?: string; sbir_topic_link?: string; subtopics?: Array<Record<string, unknown>>; }
export interface SBIRRawSolicitation extends Record<string, unknown> { solicitation_title?: string; solicitation_number?: string; program?: string; phase?: string; agency?: string; branch?: string; solicitation_year?: string | number; release_date?: string; open_date?: string; close_date?: string; application_due_date?: string[]; occurrence_number?: string | number; solicitation_agency_url?: string; current_status?: string; solicitation_topics?: SBIRRawTopic[]; }
export interface SBIRCompanyQuery { keyword?: string; name?: string; uei?: string; limit?: number; start?: number; }
export interface SBIRSolicitationQuery { keyword?: string; agency?: string; open?: boolean; closed?: boolean; limit?: number; start?: number; }
export interface SBIRApiRecords<T> { records: T[]; retrievedAt: string; rawResponseHash: string; endpoint: string; }
export interface NormalizedSBIRAward {
  id: string; firm?: string; uei?: string; duns?: string; awardTitle?: string; agency?: string; branch?: string; phase?: string; program?: string;
  trackingNumber?: string; contract?: string; awardDate?: string; contractEndDate?: string; solicitationNumber?: string; solicitationYear?: number;
  topicCode?: string; awardYear?: number; awardAmount?: number; companyUrl?: string; researchKeywords?: string; abstract?: string; awardLink?: string;
  funnelInterpretation: string; funnelStageCandidate: 2 | 3; evidenceLevel: "CONFIRMED"; retrievedAt: string; rawProvenanceHash: string;
  ingestionMode: "API" | "DATASET"; raw: SBIRRawAward; event: CrossSourceStrategicEvent;
}
export interface SBIRSearchResult { records: NormalizedSBIRAward[]; mode: "API" | "DATASET"; duplicatesBlocked: number; retrievedAt: string; rawResponseHash: string; }
