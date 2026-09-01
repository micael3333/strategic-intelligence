import type { CrossSourceStrategicEvent } from "./multi-source";

export interface DemandAcceleration {
  asOf: string;
  counts: { days30: number; days90: number; days365: number };
  normalizedMonthlyRates: { recent30: number; recent90: number; annual365: number };
  direction: "ACCELERATING" | "STABLE_OR_DECLINING" | "INSUFFICIENT_DATA";
  explanation: string;
}

export function calculateDemandAcceleration(events: CrossSourceStrategicEvent[], asOf = new Date()): DemandAcceleration {
  const demandEvents = events.filter((event) => event.sourceFamily === "SAM" && event.eventDate).map((event) => Date.parse(event.eventDate!)).filter(Number.isFinite);
  const now = asOf.getTime(); const count = (days: number) => demandEvents.filter((date) => date > now - days * 86_400_000 && date <= now).length;
  const days30 = count(30); const days90 = count(90); const days365 = count(365);
  const recent30 = days30; const recent90 = Math.round(days90 / 3 * 10) / 10; const annual365 = Math.round(days365 / 12 * 10) / 10;
  const direction = days90 < 3 ? "INSUFFICIENT_DATA" : recent30 > recent90 * 1.25 && recent30 > annual365 * 1.25 ? "ACCELERATING" : "STABLE_OR_DECLINING";
  return { asOf: asOf.toISOString(), counts: { days30, days90, days365 }, normalizedMonthlyRates: { recent30, recent90, annual365 }, direction, explanation: direction === "INSUFFICIENT_DATA" ? "Fewer than three 90-day demand observations; no acceleration claim is made." : `Recent monthly count ${recent30} versus 90-day monthly rate ${recent90} and annual monthly rate ${annual365}.` };
}

export function crossAgencyConvergence(events: CrossSourceStrategicEvent[]) {
  const agencies = [...new Set(events.map((event) => event.agency).filter(Boolean) as string[])];
  return { agencies, agencyCount: agencies.length, converging: agencies.length >= 2, explanation: `${agencies.length} distinct agency hierarchy value(s) observed across returned signals.` };
}
