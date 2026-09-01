import type { Evidence, FunnelStage, StableId } from "./models";

export interface ProcurementEvent {
  id: StableId;
  type: "PROCUREMENT_EVENT";
  awardId: StableId;
  recipientId: StableId;
  occurredAt?: string;
  amount?: number;
  agency?: string;
  evidence: Evidence[];
  funnelStage: FunnelStage | null;
  interpretationRuleId: string;
  interpretationExplanation: string;
}
