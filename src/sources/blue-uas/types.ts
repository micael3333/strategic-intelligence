import type { CrossSourceStrategicEvent } from "@/domain/multi-source";
export const BLUE_UAS_URL = "https://bluelist.dcma.mil/";
export interface BlueUASRawRecord { id: string; product: string; company: string; recordType: "PLATFORM" | "COMPONENT" | "CAPABILITY" | "SOFTWARE"; category?: string; approvalStatus?: string; sourceUrl: string; }
export interface BlueUASRecord extends BlueUASRawRecord { retrievedAt: string; rawProvenanceHash: string; event: CrossSourceStrategicEvent; }
export interface BlueUASResult { status: "WORKING" | "EMPTY"; records: BlueUASRecord[]; retrievedAt: string; cacheHit: boolean; requestExecuted: boolean; }
