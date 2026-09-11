import type { EnergyCategory, EnergyObservation, TrendMetric } from "@/domain/physical-economy";

export const EIA_BASE_URL = "https://api.eia.gov/v2";
export const EIA_DOMAIN_CATALOG: Readonly<Record<EnergyCategory, { route: string; name: string; observationPreset: boolean }>> = {
  ELECTRICITY: { route: "electricity", name: "Electricity", observationPreset: true },
  NATURAL_GAS: { route: "natural-gas", name: "Natural Gas", observationPreset: false },
  PETROLEUM: { route: "petroleum", name: "Petroleum", observationPreset: false },
  NUCLEAR: { route: "nuclear-outages", name: "Nuclear Outages", observationPreset: true },
  TOTAL_ENERGY: { route: "total-energy", name: "Total Energy", observationPreset: false },
  STEO: { route: "steo", name: "Short-Term Energy Outlook", observationPreset: false },
};

export type EIAPresetId = "INDUSTRIAL_ELECTRICITY_SALES" | "NUCLEAR_OUTAGE_PERCENT";
export const EIA_PRESETS: Readonly<Record<EIAPresetId, { category: EnergyCategory; route: string; frequency: string; data: string; unit: string; facets: Record<string, string>; geography?: string }>> = {
  INDUSTRIAL_ELECTRICITY_SALES: { category: "ELECTRICITY", route: "electricity/retail-sales", frequency: "monthly", data: "sales", unit: "million kilowatt hours", facets: { stateid: "US", sectorid: "IND" }, geography: "United States · Industrial" },
  NUCLEAR_OUTAGE_PERCENT: { category: "NUCLEAR", route: "nuclear-outages/us-nuclear-outages", frequency: "daily", data: "percentOutage", unit: "percent", facets: {}, geography: "United States" },
};
export interface EIAObservationQuery { preset: EIAPresetId; start?: string; end?: string; limit?: number; }
export interface EIAObservationResult { status: "WORKING" | "EMPTY"; preset: EIAPresetId; records: EnergyObservation[]; trends: TrendMetric[]; retrievedAt: string; rawResponseHash: string; cacheHit: boolean; requestExecuted: boolean; }
