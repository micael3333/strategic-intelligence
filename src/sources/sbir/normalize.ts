import { sha256 } from "@/sources/usaspending/hash";
import type { NormalizedSBIRAward, SBIRRawAward } from "./types";

const number = (value: unknown): number | undefined => value === undefined || value === null || value === "" || !Number.isFinite(Number(value)) ? undefined : Number(value);

export function normalizeSBIRAward(raw: SBIRRawAward, retrievedAt: string, rawProvenanceHash: string, ingestionMode: "API" | "DATASET"): NormalizedSBIRAward {
  const sourceRecordId = String(raw.agency_tracking_number ?? raw.contract ?? "").trim();
  if (!sourceRecordId && !raw.award_title) throw new Error("SBIR award lacks a source identifier and title.");
  const identity = sourceRecordId || sha256([raw.firm, raw.award_title, raw.proposal_award_date, raw.topic_code]);
  const phase = String(raw.phase ?? "").trim(); const phaseTwo = /(?:II|2)/i.test(phase) && !/(?:III|3)/i.test(phase);
  const funnelStageCandidate = phaseTwo ? 3 : 2;
  const sourceUrl = raw.award_link || "https://www.sbir.gov/awards";
  const funnelInterpretation = phaseTwo ? "Official Phase II award: deeper development or prototype funding; successful validation and procurement are not implied." : "Official early R&D award; feasibility funding does not imply validation or operational procurement.";
  return {
    id: `sbir:${identity}`, firm: raw.firm, uei: raw.uei, duns: raw.duns, awardTitle: raw.award_title, agency: raw.agency, branch: raw.branch, phase, program: raw.program,
    trackingNumber: raw.agency_tracking_number, contract: raw.contract, awardDate: raw.proposal_award_date, contractEndDate: raw.contract_end_date,
    solicitationNumber: raw.solicitation_number, solicitationYear: number(raw.solicitation_year), topicCode: raw.topic_code, awardYear: number(raw.award_year),
    awardAmount: number(raw.award_amount), companyUrl: raw.company_url, researchKeywords: raw.research_area_keywords, abstract: raw.abstract, awardLink: raw.award_link,
    funnelInterpretation, funnelStageCandidate, evidenceLevel: "CONFIRMED", retrievedAt, rawProvenanceHash, ingestionMode, raw,
    event: { id: `event:sbir:${identity}`, sourceFamily: "SBIR_STTR", sourceRecordId: identity, eventType: phaseTwo ? "SBIR_PHASE_II" : "SBIR_PHASE_I", eventDate: raw.proposal_award_date, entityName: raw.firm, uei: raw.uei, duns: raw.duns, agency: raw.agency, program: raw.program, solicitationNumber: raw.solicitation_number, topicCode: raw.topic_code, funnelStageCandidate, evidenceLevel: "CONFIRMED", sourceUrl, retrievedAt, rawProvenanceHash },
  };
}
