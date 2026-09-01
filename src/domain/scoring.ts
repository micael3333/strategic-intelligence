import {
  ACCELERATION_WEIGHTS,
  EVIDENCE_CONFIDENCE_WEIGHTS,
  EVIDENCE_LEVEL_MULTIPLIERS,
  STRATEGIC_SIGNAL_WEIGHTS,
} from "@/config/scoring";
import { effectiveEvidenceLevel, strongestEvidenceLevel } from "./evidence";
import type { Evidence, StrategicEvent } from "./models";

export interface ScoreFactor {
  key: string;
  label: string;
  points: number;
  detail: string;
  evidenceReferences: string[];
}

export interface TransparentScore {
  score: number;
  factors: ScoreFactor[];
  explanation: string;
  evidenceReferences: string[];
}

const clamp = (value: number, min = 0, max = 100) => Math.min(max, Math.max(min, value));
const round = (value: number) => Math.round(value * 10) / 10;

export function calculateStrategicSignal(events: StrategicEvent[]): TransparentScore {
  const factors = events.map((event): ScoreFactor => {
    const base = STRATEGIC_SIGNAL_WEIGHTS[event.type];
    const level = strongestEvidenceLevel(event.evidence) ?? "SPECULATIVE";
    const points = round(base * EVIDENCE_LEVEL_MULTIPLIERS[level]);
    return {
      key: event.id,
      label: event.type.replaceAll("_", " ").toLowerCase(),
      points,
      detail: `${base} base points × ${EVIDENCE_LEVEL_MULTIPLIERS[level]} (${level.toLowerCase()} evidence).`,
      evidenceReferences: event.evidence.map((item) => item.id),
    };
  });
  const score = round(clamp(factors.reduce((total, factor) => total + factor.points, 0)));
  const evidenceReferences = [...new Set(factors.flatMap((factor) => factor.evidenceReferences))];
  return {
    score,
    factors,
    explanation: `Transparent weighted sum of ${factors.length} strategic event(s), capped at 100.`,
    evidenceReferences,
  };
}

export interface AccelerationMetrics {
  awardCount12m: number;
  awardCountPrevious12m: number;
  awardValue12m: number;
  awardValuePrevious12m: number;
  largestAward: number;
  numberOfAgencies: number;
  numberOfPrograms: number;
  numberOfPrimeRelationships: number;
  averageTimeBetweenAwardsDays?: number;
  previousAverageTimeBetweenAwardsDays?: number;
  newAgencyCustomers: number;
  evidenceReferences: string[];
}

function growthSignal(current: number, previous: number): number {
  if (current <= 0) return 0;
  if (previous <= 0) return 1;
  return clamp((current / previous - 1) / 2, 0, 1);
}

export function calculateAcceleration(metrics: AccelerationMetrics): TransparentScore {
  const countGrowth = growthSignal(metrics.awardCount12m, metrics.awardCountPrevious12m);
  const valueGrowth = growthSignal(metrics.awardValue12m, metrics.awardValuePrevious12m);
  const cadence =
    metrics.averageTimeBetweenAwardsDays && metrics.previousAverageTimeBetweenAwardsDays
      ? clamp(1 - metrics.averageTimeBetweenAwardsDays / metrics.previousAverageTimeBetweenAwardsDays, 0, 1)
      : 0;
  const inputs = [
    ["award-count-growth", "Award count growth", countGrowth * ACCELERATION_WEIGHTS.awardCountGrowth],
    ["award-value-growth", "Award value growth", valueGrowth * ACCELERATION_WEIGHTS.awardValueGrowth],
    ["new-agencies", "New agency customers", Math.min(metrics.newAgencyCustomers / 2, 1) * ACCELERATION_WEIGHTS.newAgencyCustomers],
    ["agency-breadth", "Agency breadth", Math.min(metrics.numberOfAgencies / 4, 1) * ACCELERATION_WEIGHTS.agencyBreadth],
    ["program-breadth", "Program breadth", Math.min(metrics.numberOfPrograms / 5, 1) * ACCELERATION_WEIGHTS.programBreadth],
    ["prime-links", "Prime relationships", Math.min(metrics.numberOfPrimeRelationships / 3, 1) * ACCELERATION_WEIGHTS.primeRelationships],
    ["cadence", "Award cadence improvement", cadence * ACCELERATION_WEIGHTS.cadenceImprovement],
  ] as const;
  const factors: ScoreFactor[] = inputs.map(([key, label, points]) => ({
    key,
    label,
    points: round(points),
    detail: "Rule-based contribution from the supplied comparison-period metric.",
    evidenceReferences: metrics.evidenceReferences,
  }));
  const score = round(clamp(factors.reduce((sum, factor) => sum + factor.points, 0)));
  return {
    score,
    factors,
    explanation: "Measures period-over-period adoption change, customer breadth, program breadth, prime links, and award cadence; award size alone cannot dominate.",
    evidenceReferences: [...new Set(metrics.evidenceReferences)],
  };
}

export function calculateEvidenceConfidence(evidence: Evidence[]): TransparentScore {
  if (!evidence.length) {
    return { score: 0, factors: [], explanation: "No evidence supplied.", evidenceReferences: [] };
  }
  const factors = evidence.map((item): ScoreFactor => {
    const level = effectiveEvidenceLevel(item);
    const points = round(EVIDENCE_CONFIDENCE_WEIGHTS[level] * item.confidence);
    return {
      key: item.id,
      label: `${level.toLowerCase()} evidence`,
      points,
      detail: `${EVIDENCE_CONFIDENCE_WEIGHTS[level]} level weight × ${item.confidence} record confidence.`,
      evidenceReferences: [item.id],
    };
  });
  const score = round(factors.reduce((sum, factor) => sum + factor.points, 0) / factors.length);
  return {
    score,
    factors,
    explanation: "Average of evidence-level strength adjusted by per-record confidence; AI-confirmed claims are downgraded to inferred.",
    evidenceReferences: evidence.map((item) => item.id),
  };
}

export interface ExecutionRiskScorePlaceholder {
  status: "NOT_IMPLEMENTED";
  rationale: string;
}

export const executionRiskScore: ExecutionRiskScorePlaceholder = {
  status: "NOT_IMPLEMENTED",
  rationale: "Reserved for Phase 2+ after financial, delivery, dilution, concentration, and capital-requirement evidence is modeled.",
};
