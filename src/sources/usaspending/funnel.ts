import type { Evidence, StrategicEvent } from "@/domain/models";
import type { ProcurementEvent } from "@/domain/procurement";
import { sha256 } from "./hash";
import type { FunnelInterpretation, NormalizedUSAspendingAward, ResolvedRecipient } from "./types";

export function interpretProcurementFunnel(award: NormalizedUSAspendingAward, recipientHistory: NormalizedUSAspendingAward[]): FunnelInterpretation {
  const chronological = [...recipientHistory].filter((item) => item.startDate || item.baseObligationDate).sort((a, b) => (a.startDate ?? a.baseObligationDate ?? "").localeCompare(b.startDate ?? b.baseObligationDate ?? ""));
  if (chronological.length < 2) {
    return { classification: "PROCUREMENT_EVENT", stage: null, ruleId: "usaspending:single-award-no-promotion", explanation: "A confirmed federal award is downstream spending, but one award alone does not establish operational adoption, production, or scale." };
  }
  const firstDate = chronological[0]?.startDate ?? chronological[0]?.baseObligationDate;
  const lastDate = chronological.at(-1)?.startDate ?? chronological.at(-1)?.baseObligationDate;
  const spanDays = firstDate && lastDate ? (Date.parse(lastDate) - Date.parse(firstDate)) / 86_400_000 : 0;
  const productionLanguage = recipientHistory.some((item) => /\b(production|manufactur(?:e|ing)|full[- ]rate production)\b/i.test(item.description ?? ""));
  if (chronological.length >= 3 && spanDays >= 365 && productionLanguage) {
    return { classification: "PROCUREMENT_EVENT", stage: 6, ruleId: "usaspending:repeat-multiyear-production-language", explanation: `${chronological.length} awards span ${Math.round(spanDays)} days and official descriptions include production/manufacturing language. This supports production, not structural scale.` };
  }
  return { classification: "PROCUREMENT_EVENT", stage: 5, ruleId: "usaspending:repeat-procurement", explanation: `${chronological.length} confirmed awards for the resolved recipient support repeat operational procurement. USAspending alone does not prove production or structural scale.` };
}

export function createProcurementEvent(award: NormalizedUSAspendingAward, recipient: ResolvedRecipient, evidence: Evidence, funnel: FunnelInterpretation): ProcurementEvent {
  return {
    id: `procurement-event:${sha256(award.id)}`,
    type: "PROCUREMENT_EVENT",
    awardId: award.id,
    recipientId: recipient.id,
    occurredAt: award.startDate ?? award.baseObligationDate,
    amount: award.awardAmount,
    agency: award.awardingAgency,
    evidence: [evidence],
    funnelStage: funnel.stage,
    interpretationRuleId: funnel.ruleId,
    interpretationExplanation: funnel.explanation,
  };
}

export function createStrategicEvents(award: NormalizedUSAspendingAward, recipient: ResolvedRecipient, evidence: Evidence, funnel: FunnelInterpretation): StrategicEvent[] {
  const events: StrategicEvent[] = [{
    id: `event:usaspending:federal-award:${sha256(award.id)}`,
    type: "FEDERAL_AWARD_DETECTED",
    stage: null,
    subjectEntityIds: [recipient.id, award.id],
    occurredAt: award.startDate ?? award.baseObligationDate,
    amount: award.awardAmount,
    evidence: [evidence],
  }];
  if (funnel.stage !== null) {
    events.push({
      id: `event:usaspending:repeat-award:${sha256(recipient.id + award.id)}`,
      type: "REPEAT_AWARD",
      stage: funnel.stage,
      subjectEntityIds: [recipient.id, award.id],
      occurredAt: award.startDate ?? award.baseObligationDate,
      amount: award.awardAmount,
      evidence: [evidence],
    });
  }
  return events;
}
