import { strongestEvidenceLevel } from "./evidence";
import type { FunnelStage, StrategicEvent } from "./models";

export const FUNNEL_STAGES: ReadonlyArray<{ stage: FunnelStage; name: string; shortName: string }> = [
  { stage: 0, name: "Strategic Need / Problem", shortName: "Need" },
  { stage: 1, name: "Government Demand Formation", shortName: "Demand" },
  { stage: 2, name: "R&D / Early Funding", shortName: "R&D" },
  { stage: 3, name: "Prototype / Company Selection", shortName: "Prototype" },
  { stage: 4, name: "Validation", shortName: "Validation" },
  { stage: 5, name: "First Operational Procurement", shortName: "Procurement" },
  { stage: 6, name: "Production", shortName: "Production" },
  { stage: 7, name: "Structural Scale", shortName: "Scale" },
];

export interface FunnelAssessment {
  stage: FunnelStage | null;
  supportingEvents: StrategicEvent[];
  excludedEvents: StrategicEvent[];
  explanation: string;
}

export function calculateFunnelStage(events: StrategicEvent[]): FunnelAssessment {
  const supported = events.filter((event): event is StrategicEvent & { stage: FunnelStage } => {
    const level = strongestEvidenceLevel(event.evidence);
    return event.stage !== null && level !== null && level !== "SPECULATIVE";
  });
  const supportedIds = new Set(supported.map((event) => event.id));
  const excludedEvents = events.filter((event) => !supportedIds.has(event.id));

  if (!supported.length) {
    return {
      stage: null,
      supportingEvents: [],
      excludedEvents,
      explanation: "No stage assigned: no event has non-speculative supporting evidence.",
    };
  }

  const stage = Math.max(...supported.map((event) => event.stage)) as FunnelStage;
  const supportingEvents = supported.filter((event) => event.stage === stage);
  const label = FUNNEL_STAGES.find((item) => item.stage === stage)?.name ?? `Stage ${stage}`;
  return {
    stage,
    supportingEvents,
    excludedEvents,
    explanation: `Stage ${stage} (${label}) is supported by ${supportingEvents.length} event(s).`,
  };
}
