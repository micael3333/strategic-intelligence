import type { ConcentrationMetric, TradeFlow, TradeObservation, TrendMetric } from "@/domain/physical-economy";
export const CENSUS_IMPORTS_HS_URL = "https://api.census.gov/data/timeseries/intltrade/imports/hs";
export const CENSUS_EXPORTS_HS_URL = "https://api.census.gov/data/timeseries/intltrade/exports/hs";
export interface CensusTradeQuery { flow: TradeFlow; hsCode: string; start: string; end: string; countryCode?: string; }
export interface SupplierSubstitution { status: "DETECTED" | "NOT_DETECTED" | "INSUFFICIENT_HISTORY"; previousLeader?: string; currentLeader?: string; explanation: string; }
export interface CensusTradeResult { status: "WORKING" | "EMPTY"; records: TradeObservation[]; totalByPeriod: Array<{ period: string; value: number }>; trends: TrendMetric[]; concentration: ConcentrationMetric; supplierSubstitution: SupplierSubstitution; retrievedAt: string; rawResponseHash: string; cacheHit: boolean; requestExecuted: boolean; }
