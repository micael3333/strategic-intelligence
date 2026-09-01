import { calculateAcceleration, type TransparentScore } from "@/domain/scoring";
import type { NormalizedUSAspendingAward } from "./types";

export interface USAspendingAccelerationMetrics {
  awardCount12m: number;
  awardCountPrevious12m: number;
  awardValue12m: number;
  awardValuePrevious12m: number;
  largestAward12m: number;
  largestAwardPrevious12m: number;
  numberOfAgencies12m: number;
  numberOfAgenciesPrevious12m: number;
  newAgencyCustomers: number;
  averageTimeBetweenAwards: number | null;
}

export interface USAspendingAccelerationAnalysis {
  metrics: USAspendingAccelerationMetrics;
  score: TransparentScore;
  label: "ACCELERATING GOVERNMENT ADOPTION" | "INSUFFICIENT OR NON-ACCELERATING DATA";
  explanation: string;
}

const awardDate = (award: NormalizedUSAspendingAward) => award.startDate ?? award.baseObligationDate;
const sum = (awards: NormalizedUSAspendingAward[]) => awards.reduce((total, award) => total + (award.awardAmount ?? 0), 0);
const largest = (awards: NormalizedUSAspendingAward[]) => Math.max(0, ...awards.map((award) => award.awardAmount ?? 0));
const agencies = (awards: NormalizedUSAspendingAward[]) => new Set(awards.map((award) => award.awardingAgency).filter(Boolean) as string[]);

export function calculateRecipientAcceleration(awards: NormalizedUSAspendingAward[], asOf = new Date()): USAspendingAccelerationAnalysis {
  const now = asOf.getTime();
  const oneYearAgo = now - 365 * 86_400_000;
  const twoYearsAgo = now - 730 * 86_400_000;
  const current = awards.filter((award) => { const date = awardDate(award); if (!date) return false; const time = Date.parse(date); return time > oneYearAgo && time <= now; });
  const previous = awards.filter((award) => { const date = awardDate(award); if (!date) return false; const time = Date.parse(date); return time > twoYearsAgo && time <= oneYearAgo; });
  const currentAgencies = agencies(current);
  const previousAgencies = agencies(previous);
  const newAgencyCustomers = [...currentAgencies].filter((agency) => !previousAgencies.has(agency)).length;
  const dated = [...current].map(awardDate).filter(Boolean).map((date) => Date.parse(date!)).sort((a, b) => a - b);
  const gaps = dated.slice(1).map((date, index) => (date - dated[index]) / 86_400_000);
  const averageTimeBetweenAwards = gaps.length ? gaps.reduce((a, b) => a + b, 0) / gaps.length : null;
  const metrics: USAspendingAccelerationMetrics = {
    awardCount12m: current.length,
    awardCountPrevious12m: previous.length,
    awardValue12m: sum(current),
    awardValuePrevious12m: sum(previous),
    largestAward12m: largest(current),
    largestAwardPrevious12m: largest(previous),
    numberOfAgencies12m: currentAgencies.size,
    numberOfAgenciesPrevious12m: previousAgencies.size,
    newAgencyCustomers,
    averageTimeBetweenAwards,
  };
  const score = calculateAcceleration({
    awardCount12m: metrics.awardCount12m,
    awardCountPrevious12m: metrics.awardCountPrevious12m,
    awardValue12m: metrics.awardValue12m,
    awardValuePrevious12m: metrics.awardValuePrevious12m,
    largestAward: metrics.largestAward12m,
    numberOfAgencies: metrics.numberOfAgencies12m,
    numberOfPrograms: 0,
    numberOfPrimeRelationships: 0,
    averageTimeBetweenAwardsDays: metrics.averageTimeBetweenAwards ?? undefined,
    newAgencyCustomers,
    evidenceReferences: current.map((award) => `evidence:usaspending:${award.id}`),
  });
  const countGrowthRatio = previous.length > 0 ? current.length / previous.length : 0;
  const valueGrowthRatio = metrics.awardValuePrevious12m > 0 ? metrics.awardValue12m / metrics.awardValuePrevious12m : 0;
  const accelerating = current.length >= 2 && previous.length >= 1 && countGrowthRatio >= 1.5 && valueGrowthRatio >= 1.5;
  return {
    metrics,
    score,
    label: accelerating ? "ACCELERATING GOVERNMENT ADOPTION" : "INSUFFICIENT OR NON-ACCELERATING DATA",
    explanation: accelerating
      ? `${current.length} awards versus ${previous.length} previously (${countGrowthRatio.toFixed(2)}×), while award value rose from ${metrics.awardValuePrevious12m} to ${metrics.awardValue12m} (${valueGrowthRatio.toFixed(2)}×). Both exceed the 1.5× quantitative threshold.`
      : "The label requires at least two current-period awards, at least one prior-period award, and 1.5× or greater growth in both award count and award value.",
  };
}
