import { describe, expect, it } from "vitest";
import type { CrossSourceStrategicEvent } from "./multi-source";
import type { IntelligenceSnapshot } from "@/persistence/history-store";
import { synthesizeInvestigation } from "./synthesis";

const event = (id: string, sourceFamily: CrossSourceStrategicEvent["sourceFamily"], sourceType: CrossSourceStrategicEvent["sourceType"], entityName?: string, amount?: number): CrossSourceStrategicEvent => ({ id, sourceFamily, sourceRecordId: id, eventType: sourceType ?? "OBSERVATION", sourceType, entityName, amount, currency: amount ? "USD" : undefined, jurisdiction: sourceFamily === "TED_EU" ? "EU" : "USA", funnelStageCandidate: sourceType === "SOLICITATION" ? 1 : sourceType === "AWARD" || sourceType === "CONTRACT" ? 5 : null, evidenceLevel: "CONFIRMED", sourceUrl: `https://official.example/${id}`, retrievedAt: "2026-08-22T00:00:00Z", rawProvenanceHash: id, rawData: {} });
const snapshot = (events: CrossSourceStrategicEvent[]): IntelligenceSnapshot => ({ id: "snapshot", queryKey: "fixture", query: "fixture", dimension: "TECHNOLOGY", retrievedAt: "2026-08-22T00:00:00Z", firstSeen: "2026-08-22T00:00:00Z", lastSeen: "2026-08-22T00:00:00Z", providers: [], events, energyObservations: [], tradeObservations: [], relationships: [] });

describe("deterministic intelligence synthesis", () => {
  it("sums confirmed money by currency and ranks cross-source companies", () => {
    const result = synthesizeInvestigation(snapshot([event("a", "SAM", "SOLICITATION", "Fixture Co"), event("b", "USASPENDING", "AWARD", "Fixture Co", 100), event("c", "TED_EU", "CONTRACT", "Other Co", 50)]));
    expect(result.assertionClass).toBe("DERIVED_SIGNAL");
    expect(result.moneyFlow.confirmedAmounts).toEqual([{ currency: "USD", amount: 150 }]);
    expect(result.companies[0]).toMatchObject({ company: "Fixture Co", independentSourceCount: 2 });
    expect(result.confidence).toBe("MEDIUM");
  });

  it("does not claim acceleration without comparable history", () => {
    const result = synthesizeInvestigation(snapshot([event("a", "SAM", "SOLICITATION")]));
    expect(result.acceleration.status).toBe("INSUFFICIENT_HISTORY");
    expect(result.whatWouldChangeConclusion).toContain("A comparable stored snapshot from a later observation window to measure change over time.");
  });
});
