export type EnergyCategory = "ELECTRICITY" | "NATURAL_GAS" | "PETROLEUM" | "NUCLEAR" | "TOTAL_ENERGY" | "STEO";

export interface EnergyObservation {
  id: string;
  source: "EIA";
  series: string;
  category: EnergyCategory;
  period: string;
  geography?: string;
  unit: string;
  value: number;
  frequency: "DAILY" | "MONTHLY" | "QUARTERLY" | "ANNUAL";
  retrievedAt: string;
  sourceUrl: string;
  rawProvenanceHash: string;
}

export type TradeFlow = "IMPORT" | "EXPORT";

export interface TradeObservation {
  id: string;
  source: "CENSUS_TRADE";
  flow: TradeFlow;
  hsCode: string;
  productLabel?: string;
  countryCode: string;
  countryName?: string;
  period: string;
  value: number;
  quantity?: number;
  quantityUnit?: string;
  share?: number;
  retrievedAt: string;
  sourceUrl: string;
  rawProvenanceHash: string;
}

export interface TrendMetric {
  metric: "MOM" | "YOY" | "THREE_MONTH" | "TWELVE_MONTH";
  percentChange?: number;
  direction: "ACCELERATING" | "DECELERATING" | "STABLE" | "INSUFFICIENT_HISTORY";
  periodsCompared: string[];
  explanation: string;
}

function percentChange(current: number, previous: number): number | undefined { return previous === 0 ? undefined : ((current - previous) / Math.abs(previous)) * 100; }
function direction(value?: number): TrendMetric["direction"] { if (value === undefined) return "INSUFFICIENT_HISTORY"; if (value > 5) return "ACCELERATING"; if (value < -5) return "DECELERATING"; return "STABLE"; }

export function calculateObservationTrends(observations: Array<{ period: string; value: number }>, frequency: "DAILY" | "MONTHLY" = "MONTHLY"): TrendMetric[] {
  const sorted = [...observations].filter((item) => Number.isFinite(item.value)).sort((a, b) => a.period.localeCompare(b.period));
  const latest = sorted.at(-1);
  const compare = (metric: TrendMetric["metric"], offset: number): TrendMetric => {
    const previous = sorted.at(-(offset + 1)); const change = latest && previous ? percentChange(latest.value, previous.value) : undefined;
    return { metric, percentChange: change, direction: direction(change), periodsCompared: latest && previous ? [previous.period, latest.period] : [], explanation: change === undefined ? "Insufficient comparable observations." : `${metric.replaceAll("_", " ")} change is ${change.toFixed(1)}%.` };
  };
  const rolling = (metric: TrendMetric["metric"], months: number): TrendMetric => {
    if (sorted.length < months * 2) return { metric, direction: "INSUFFICIENT_HISTORY", periodsCompared: [], explanation: `At least ${months * 2} observations are required.` };
    const recent = sorted.slice(-months); const previous = sorted.slice(-months * 2, -months); const recentAverage = recent.reduce((sum, item) => sum + item.value, 0) / months; const previousAverage = previous.reduce((sum, item) => sum + item.value, 0) / months; const change = percentChange(recentAverage, previousAverage);
    return { metric, percentChange: change, direction: direction(change), periodsCompared: [previous[0].period, recent.at(-1)!.period], explanation: change === undefined ? "The prior average is zero." : `${months}-period average changed ${change.toFixed(1)}%.` };
  };
  const monthOffset = frequency === "DAILY" ? 30 : 1;
  const yearOffset = frequency === "DAILY" ? 365 : 12;
  const threeMonthWindow = frequency === "DAILY" ? 90 : 3;
  const twelveMonthWindow = frequency === "DAILY" ? 365 : 12;
  return [compare("MOM", monthOffset), compare("YOY", yearOffset), rolling("THREE_MONTH", threeMonthWindow), rolling("TWELVE_MONTH", twelveMonthWindow)];
}

export interface ConcentrationMetric { hhi?: number; topCountryShare?: number; topCountry?: string; status: "CALCULATED" | "INSUFFICIENT_EVIDENCE"; explanation: string; }
export function calculateCountryConcentration(observations: TradeObservation[]): ConcentrationMetric {
  const latestPeriod = observations.map((item) => item.period).sort().at(-1); const current = observations.filter((item) => item.period === latestPeriod && item.value >= 0); const total = current.reduce((sum, item) => sum + item.value, 0);
  if (!latestPeriod || current.length < 2 || total <= 0) return { status: "INSUFFICIENT_EVIDENCE", explanation: "At least two country observations with positive trade value are required." };
  const shares = current.map((item) => ({ item, share: item.value / total })).sort((a, b) => b.share - a.share); const hhi = shares.reduce((sum, entry) => sum + entry.share ** 2, 0) * 10_000;
  return { status: "CALCULATED", hhi: Math.round(hhi), topCountryShare: shares[0].share, topCountry: shares[0].item.countryName ?? shares[0].item.countryCode, explanation: `Latest-period concentration uses ${current.length} country observations and no inferred technology mapping.` };
}
