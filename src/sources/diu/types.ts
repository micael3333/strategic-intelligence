import type { CrossSourceStrategicEvent } from "@/domain/multi-source";
export const DIU_SOLICITATIONS_URL = "https://www.diu.mil/work-with-us/open-solicitations";
export interface DIURawRecord { id: string; title: string; description?: string; date?: string; url: string; recordType: "SOLICITATION" | "SELECTION" | "AWARD"; technologyArea?: string; programName?: string; selectedCompanies?: string[]; }
export interface NormalizedDIURecord extends DIURawRecord { sourceUrl: string; retrievedAt: string; rawProvenanceHash: string; event: CrossSourceStrategicEvent; }
export interface DIUSearchResult { status: "WORKING" | "EMPTY"; records: NormalizedDIURecord[]; retrievedAt: string; cacheHit: boolean; requestExecuted: boolean; }
