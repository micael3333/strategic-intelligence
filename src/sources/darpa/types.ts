import type { CrossSourceStrategicEvent } from "@/domain/multi-source";

export const DARPA_OPPORTUNITIES_RSS_URL = "https://www.darpa.mil/rss/opportunities.xml";

export interface DARPARawItem extends Record<string, unknown> {
  guid?: string;
  title?: string;
  description?: string;
  link?: string;
  publicationDate?: string;
}

export interface NormalizedDARPAOpportunity {
  id: string;
  title: string;
  description?: string;
  publicationDate?: string;
  sourceUrl: string;
  retrievedAt: string;
  rawProvenanceHash: string;
  evidenceLevel: "CONFIRMED";
  raw: DARPARawItem;
  event: CrossSourceStrategicEvent;
}

export interface DARPASearchResult {
  records: NormalizedDARPAOpportunity[];
  retrievedAt: string;
  rawSourceHash: string;
  sourceUrl: typeof DARPA_OPPORTUNITIES_RSS_URL;
  ingestionMethod: "RSS";
}
