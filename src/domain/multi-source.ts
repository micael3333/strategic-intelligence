import type { EvidenceLevel, FunnelStage } from "./models";

export type ProcurementSourceFamily = "USASPENDING" | "SAM" | "SBIR_STTR" | "AFWERX_SPACEWERX" | "GRANTS_GOV" | "DARPA";
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
