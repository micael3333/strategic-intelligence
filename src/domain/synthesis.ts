import type { CrossSourceStrategicEvent } from "./multi-source";
import type { IntelligenceSnapshot } from "@/persistence/history-store";

export type SynthesisConfidence = "HIGH" | "MEDIUM" | "LOW" | "INSUFFICIENT_DATA";
export interface RankedCompanySignal { company: string; evidenceCount: number; independentSourceCount: number; sourceFamilies: string[]; confirmedAmount?: number; currencies: string[]; explanation: string; evidenceReferences: string[]; }
export interface IntelligenceSynthesis {
  assertionClass: "DERIVED_SIGNAL";
  whatIsHappening: string;
  whyItMatters: string;
  moneyFlow: { confirmedAmounts: Array<{ currency: string; amount: number }>; awardEvents: number; solicitationEvents: number; explanation: string };
  companies: RankedCompanySignal[];
  crossSourceConfirmation: { independentProviderCount: number; sourceFamilies: string[]; jurisdictions: string[]; explanation: string };
  acceleration: { status: "ACCELERATING" | "COOLING" | "STABLE" | "INSUFFICIENT_HISTORY"; currentEvidenceCount: number; previousEvidenceCount?: number; explanation: string };
  confidence: SynthesisConfidence;
  confidenceExplanation: string;
  evidenceReferences: string[];
  whatWouldChangeConclusion: string[];
  caveat: string;
}

const uniqueEvents = (events: CrossSourceStrategicEvent[]) => [...new Map(events.map((event) => [event.id, event])).values()];
const isAward = (event: CrossSourceStrategicEvent) => event.sourceType === "AWARD" || event.sourceType === "CONTRACT" || /AWARD|PROCUREMENT|PRODUCTION/i.test(event.eventType);
const isDemand = (event: CrossSourceStrategicEvent) => event.sourceType === "SOLICITATION" || /SOLICITATION|TENDER|PLANNING|NOTICE/i.test(event.eventType);

export function synthesizeInvestigation(snapshot: IntelligenceSnapshot, previous?: IntelligenceSnapshot): IntelligenceSynthesis {
  const events = uniqueEvents(snapshot.events); const sourceFamilies = [...new Set(events.map((event) => event.sourceFamily))].sort(); const jurisdictions = [...new Set(events.map((event) => event.jurisdiction).filter(Boolean) as string[])].sort();
  const confirmed = events.filter((event) => event.evidenceLevel === "CONFIRMED"); const awards = confirmed.filter(isAward); const solicitations = confirmed.filter(isDemand);
  const amounts = new Map<string, number>(); for (const event of awards) if (event.amount !== undefined && Number.isFinite(event.amount)) amounts.set(event.currency ?? "UNSPECIFIED", (amounts.get(event.currency ?? "UNSPECIFIED") ?? 0) + event.amount);
  const companyGroups = new Map<string, CrossSourceStrategicEvent[]>(); for (const event of confirmed) if (event.entityName) companyGroups.set(event.entityName, [...(companyGroups.get(event.entityName) ?? []), event]);
  const companies = [...companyGroups].map(([company, items]): RankedCompanySignal => { const families = [...new Set(items.map((item) => item.sourceFamily))].sort(); const currencies = [...new Set(items.map((item) => item.currency).filter(Boolean) as string[])]; const amount = items.filter(isAward).reduce((sum, item) => sum + (item.amount ?? 0), 0); return { company, evidenceCount: items.length, independentSourceCount: families.length, sourceFamilies: families, confirmedAmount: amount || undefined, currencies, explanation: `${items.length} confirmed event${items.length === 1 ? "" : "s"} across ${families.length} independent source famil${families.length === 1 ? "y" : "ies"}.`, evidenceReferences: items.map((item) => item.id) }; }).sort((a, b) => b.independentSourceCount - a.independentSourceCount || b.evidenceCount - a.evidenceCount || a.company.localeCompare(b.company)).slice(0, 10);
  const previousCount = previous ? uniqueEvents(previous.events).length : undefined; const currentEvidenceCount = events.length; const acceleration = previousCount === undefined ? "INSUFFICIENT_HISTORY" : currentEvidenceCount > previousCount ? "ACCELERATING" : currentEvidenceCount < previousCount ? "COOLING" : "STABLE";
  const confidence: SynthesisConfidence = confirmed.length === 0 ? "INSUFFICIENT_DATA" : sourceFamilies.length >= 3 && confirmed.length >= 4 ? "HIGH" : sourceFamilies.length >= 2 ? "MEDIUM" : "LOW";
  const dominant = sourceFamilies.slice(0, 4).join(", "); const whatIsHappening = events.length ? `${events.length} unique evidence record${events.length === 1 ? "" : "s"} connect the investigation to ${sourceFamilies.length} source famil${sourceFamilies.length === 1 ? "y" : "ies"}${dominant ? ` (${dominant})` : ""}.` : "No normalized evidence was returned for this investigation.";
  const whyItMatters = awards.length && solicitations.length ? "Confirmed demand formation and confirmed capital deployment coexist, which is consistent with movement through the procurement funnel; it does not by itself prove production scale." : awards.length ? "Confirmed capital deployment is present, but the stored evidence does not yet establish the full path from demand formation to structural scale." : solicitations.length ? "Confirmed demand formation is present, but no confirmed operational award is attached to this result." : "The available records do not yet establish confirmed procurement demand or capital deployment.";
  const missing: string[] = []; if (sourceFamilies.length < 2) missing.push("A second independent official source confirming the same entity, program, or technology."); if (!awards.length) missing.push("A confirmed award, contract, or production event with traceable provenance."); if (!companies.length) missing.push("A primary-source entity identifier linking the signal to a company."); if (!previous) missing.push("A comparable stored snapshot from a later observation window to measure change over time."); if (!jurisdictions.length) missing.push("Jurisdiction metadata on the underlying official records.");
  return { assertionClass: "DERIVED_SIGNAL", whatIsHappening, whyItMatters, moneyFlow: { confirmedAmounts: [...amounts].map(([currency, amount]) => ({ currency, amount })), awardEvents: awards.length, solicitationEvents: solicitations.length, explanation: amounts.size ? "Amounts sum unique confirmed award/contract events by currency; currencies are never converted or combined." : "No confirmed monetary award amount is present; no monetary total was inferred." }, companies, crossSourceConfirmation: { independentProviderCount: sourceFamilies.length, sourceFamilies, jurisdictions, explanation: `${sourceFamilies.length} independent source famil${sourceFamilies.length === 1 ? "y" : "ies"} and ${jurisdictions.length} explicit jurisdiction${jurisdictions.length === 1 ? "" : "s"} are represented.` }, acceleration: { status: acceleration, currentEvidenceCount, previousEvidenceCount: previousCount, explanation: previousCount === undefined ? "Acceleration requires a prior comparable stored snapshot." : `Unique normalized evidence changed from ${previousCount} to ${currentEvidenceCount}; this is breadth change, not a causal or investment conclusion.` }, confidence, confidenceExplanation: `${confirmed.length} of ${events.length} unique events are confirmed across ${sourceFamilies.length} independent source families.`, evidenceReferences: confirmed.map((event) => event.id), whatWouldChangeConclusion: missing, caveat: "Deterministic research synthesis only. It is not an investment recommendation and does not transform derived relationships into confirmed facts." };
}
