import type { CrossSourceStrategicEvent } from "@/domain/multi-source";

export const AFWERX_FUNDING_URL = "https://afwerx.com/get-funded/";
export type AFWERXOpportunityType = "OPEN_TOPIC" | "SPECIFIC_TOPIC" | "SEQUENTIAL_OPPORTUNITY" | "OTHER_OFFICIAL_AFWERX_OPPORTUNITY";
export interface AFWERXOpportunity {
  id: string; title: string; release?: string; topicCode?: string; topicType: AFWERXOpportunityType; preReleaseDate?: string; openDate?: string; closeDate?: string;
  airForceRelevant: boolean; spaceForceRelevant: boolean; missionArea?: string; technologyArea?: string; phase?: string; directToPhaseTwo: boolean;
  officialSourceUrl: string; description?: string; governmentCustomer?: string; status: "UPCOMING" | "OPEN" | "CLOSED" | "UNKNOWN";
  retrievedAt: string; rawSourceHash: string; evidenceLevel: "CONFIRMED"; event: CrossSourceStrategicEvent;
}
export interface AFWERXSearchResult { records: AFWERXOpportunity[]; retrievedAt: string; rawSourceHash: string; sourceUrl: typeof AFWERX_FUNDING_URL; cacheHit: boolean; }
