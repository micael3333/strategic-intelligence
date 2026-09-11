import type { EvidenceLevel, FunnelStage } from "./models";

export type ProcurementSourceFamily = "USASPENDING" | "SAM" | "SAM_CONTRACT_AWARDS" | "TED_EU" | "UK_FIND_A_TENDER" | "SBIR_STTR" | "AFWERX_SPACEWERX" | "DIU" | "BLUE_UAS" | "GRANTS_GOV" | "DARPA" | "EIA" | "CENSUS_TRADE" | "SEC_EDGAR" | "EXPORT_CONTROLS" | "HOUSE_DISCLOSURES";
export type IngestionMethod = "API" | "DATASET" | "OFFICIAL_WEB" | "RSS";
export type IntelligenceSourceType = "SOLICITATION" | "CONTRACT" | "AWARD" | "GRANT" | "SBIR" | "DARPA_PROGRAM" | "AFWERX_PROGRAM" | "R_AND_D" | "INDUSTRIAL_SIGNAL";

export interface CrossSourceStrategicEvent {
  id: string;
  sourceFamily: ProcurementSourceFamily;
  sourceRecordId: string;
  ingestionMethod?: IngestionMethod;
  sourceType?: IntelligenceSourceType;
  eventType: string;
  title?: string;
  description?: string;
  eventDate?: string;
  entityName?: string;
  uei?: string;
  duns?: string;
  agency?: string;
  subAgency?: string;
  office?: string;
  program?: string;
  solicitationNumber?: string;
  topicCode?: string;
  amount?: number;
  currency?: string;
  jurisdiction?: "USA" | "EU" | "UK" | "GLOBAL";
  country?: string;
  deadline?: string;
  naics?: string;
  classificationCode?: string;
  technologyTags?: string[];
  capabilityTags?: string[];
  materialTags?: string[];
  strategicTags?: string[];
  technologyThemeCandidate?: string;
  funnelStageCandidate: FunnelStage | null;
  evidenceLevel: EvidenceLevel;
  sourceUrl: string;
  retrievedAt: string;
  rawProvenanceHash: string;
  rawData?: Readonly<Record<string, unknown>>;
}

export type ProcurementStage = "PLANNING" | "TENDER" | "AWARD" | "CONTRACT" | "UNKNOWN";
export interface CrossJurisdictionProcurement {
  id: string;
  jurisdiction: "USA" | "EU" | "UK";
  buyer?: string;
  buyerCountry?: string;
  supplier?: string;
  procurementStage: ProcurementStage;
  category?: string;
  classificationCodes: string[];
  value?: number;
  currency?: string;
  publicationDate?: string;
  awardDate?: string;
  sourceFamily: Extract<ProcurementSourceFamily, "SAM" | "SAM_CONTRACT_AWARDS" | "USASPENDING" | "TED_EU" | "UK_FIND_A_TENDER">;
  sourceIdentifier: string;
  sourceUrl: string;
  retrievedAt: string;
  rawProvenanceHash: string;
  rawData: Readonly<Record<string, unknown>>;
  event: CrossSourceStrategicEvent;
}

export interface CrossSourceRelationship {
  id: string;
  fromEventId: string;
  toEventId: string;
  matchType: "UEI" | "SOLICITATION_NUMBER" | "TOPIC_CODE" | "KEYWORD_SIMILARITY";
  evidenceLevel: "CONFIRMED" | "INFERRED";
  explanation: string;
}

export function correlateEvents(events: CrossSourceStrategicEvent[]): CrossSourceRelationship[] {
  const relationships: CrossSourceRelationship[] = [];
  for (let leftIndex = 0; leftIndex < events.length; leftIndex += 1) {
    for (let rightIndex = leftIndex + 1; rightIndex < events.length; rightIndex += 1) {
      const left = events[leftIndex];
      const right = events[rightIndex];
      if (left.sourceFamily === right.sourceFamily) continue;
      const ueiMatch = left.uei && right.uei && left.uei === right.uei;
      const solicitationMatch = left.solicitationNumber && right.solicitationNumber && left.solicitationNumber === right.solicitationNumber;
      const topicMatch = left.topicCode && right.topicCode && left.topicCode === right.topicCode;
      if (!ueiMatch && !solicitationMatch && !topicMatch) continue;
      const matchType = ueiMatch ? "UEI" : solicitationMatch ? "SOLICITATION_NUMBER" : "TOPIC_CODE";
      relationships.push({
        id: `relationship:${left.id}:${right.id}:${matchType}`,
        fromEventId: left.id,
        toEventId: right.id,
        matchType,
        evidenceLevel: "CONFIRMED",
        explanation: `Exact ${matchType.toLowerCase().replaceAll("_", " ")} match across authoritative source records.`,
      });
    }
  }
  return relationships;
}

export function requiresEntityReview(leftName?: string, rightName?: string): boolean {
  if (!leftName || !rightName) return true;
  return leftName.trim().toUpperCase() !== rightName.trim().toUpperCase();
}
