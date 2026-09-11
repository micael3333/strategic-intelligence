import type { CrossJurisdictionProcurement } from "@/domain/multi-source";
export const UK_FTS_OCDS_URL = "https://www.find-tender.service.gov.uk/api/1.0/ocdsReleasePackages";
export interface UKFTSQuery { updatedFrom?: string; updatedTo?: string; stages?: Array<"planning" | "tender" | "award">; noticeId?: string; ocid?: string; cursor?: string; limit?: number; }
export interface UKFTSResult { status: "WORKING" | "EMPTY"; records: CrossJurisdictionProcurement[]; publishedDate?: string; nextCursor?: string; retrievedAt: string; cacheHit: boolean; requestExecuted: boolean; }
