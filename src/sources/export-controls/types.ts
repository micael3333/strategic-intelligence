export const CSL_JSON_URL = "https://data.trade.gov/downloadable_consolidated_screening_list/v1/consolidated.json";
export type ExportControlMatchStatus = "CONFIRMED_MATCH" | "POSSIBLE_MATCH" | "NO_MATCH" | "SNAPSHOT_REQUIRED";
import type { CrossSourceStrategicEvent } from "@/domain/multi-source";
export interface ExportControlMatch { status: ExportControlMatchStatus; query: string; matchedName?: string; aliases?: string[]; country?: string; sourceList?: string; sourceInformationUrl?: string; confidence: number; relationshipStatus?: "CONFIRMED" | "CANDIDATE"; explanation: string; retrievedAt?: string; event?: CrossSourceStrategicEvent; }
