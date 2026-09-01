import type { Evidence, EvidenceLevel, StrategicEvent, StrategicEventType } from "@/domain/models";

export function makeEvidence(level: EvidenceLevel = "CONFIRMED", overrides: Partial<Evidence> = {}): Evidence {
  return {
    id: `evidence:${level.toLowerCase()}`,
    sourceId: "source:test-fixture",
    retrievedAt: "2026-08-31T00:00:00.000Z",
    payload: { fixture: true },
    evidenceLevel: level,
    confidence: 1,
    notes: "Deterministic test fixture; not a real-world claim.",
    ...overrides,
  };
}

export function makeEvent(type: StrategicEventType, stage: StrategicEvent["stage"], evidence: Evidence[]): StrategicEvent {
  return {
    id: `event:${type.toLowerCase()}`,
    type,
    stage,
    subjectEntityIds: ["entity:test-fixture"],
    evidence,
  };
}
