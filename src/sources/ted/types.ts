import type { CrossJurisdictionProcurement } from "@/domain/multi-source";

export const TED_SEARCH_URL = "https://api.ted.europa.eu/v3/notices/search";
export interface TEDSearchQuery { keywords?: string; cpv?: string; buyer?: string; country?: string; publicationFrom?: string; publicationTo?: string; noticeType?: string; page?: number; limit?: number; scope?: "ACTIVE" | "ALL"; }
export interface TEDSearchResult { status: "WORKING" | "EMPTY"; records: CrossJurisdictionProcurement[]; totalRecords: number; retrievedAt: string; cacheHit: boolean; requestExecuted: boolean; }
