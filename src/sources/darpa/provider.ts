import { matchTechnologyTaxonomy } from "@/config/technology-clusters";
import { providerHealth, type ProviderHealth } from "@/sources/provider";
import { getSource } from "@/sources/registry";
import { sha256 } from "@/sources/usaspending/hash";
import { DARPA_OPPORTUNITIES_RSS_URL, type DARPARawItem, type DARPASearchResult, type NormalizedDARPAOpportunity } from "./types";

const decode = (value: string) => value.replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1").replace(/<[^>]+>/g, " ").replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, "\"").replace(/&#39;|&apos;/g, "'").replace(/\s+/g, " ").trim();
const element = (xml: string, name: string) => {
  const match = new RegExp(`<${name}(?:\\s[^>]*)?>([\\s\\S]*?)<\\/${name}>`, "i").exec(xml);
  return match ? decode(match[1]) : undefined;
};

export function parseDARPAOpportunitiesRss(xml: string, retrievedAt: string): NormalizedDARPAOpportunity[] {
  const rawSourceHash = sha256(xml);
  const seen = new Set<string>();
  return [...xml.matchAll(/<item(?:\s[^>]*)?>([\s\S]*?)<\/item>/gi)].flatMap((match): NormalizedDARPAOpportunity[] => {
    const item = match[1];
    const raw: DARPARawItem = { guid: element(item, "guid"), title: element(item, "title"), description: element(item, "description"), link: element(item, "link"), publicationDate: element(item, "pubDate") };
    const title = raw.title?.trim();
    const sourceUrl = raw.link?.trim();
    const externalId = raw.guid?.trim() || sourceUrl || title;
    if (!title || !sourceUrl || !externalId || seen.has(externalId)) return [];
    seen.add(externalId);
    const recordId = sha256(externalId).slice(0, 24);
    const date = raw.publicationDate && !Number.isNaN(Date.parse(raw.publicationDate)) ? new Date(raw.publicationDate).toISOString() : undefined;
    const taxonomy = matchTechnologyTaxonomy(title, raw.description ?? "");
    return [{
      id: `darpa:${recordId}`, title, description: raw.description, publicationDate: date, sourceUrl, retrievedAt, rawProvenanceHash: rawSourceHash, evidenceLevel: "CONFIRMED", raw,
      event: { id: `event:darpa:${recordId}`, sourceFamily: "DARPA", sourceRecordId: externalId, ingestionMethod: "RSS", sourceType: "DARPA_PROGRAM", eventType: "R_AND_D_OPPORTUNITY", title, description: raw.description, eventDate: date, agency: "Defense Advanced Research Projects Agency", technologyTags: taxonomy.technologyTags, capabilityTags: taxonomy.matchedTerms, materialTags: taxonomy.technologyTags.includes("CRITICAL_MINERALS") ? taxonomy.matchedTerms : [], strategicTags: ["FUTURE_TECHNOLOGY_DIRECTION"], funnelStageCandidate: 2, evidenceLevel: "CONFIRMED", sourceUrl, retrievedAt, rawProvenanceHash: rawSourceHash, rawData: raw },
    }];
  });
}

export class DARPARssProvider {
  readonly id = "provider:darpa";
  readonly name = "DARPA Opportunities RSS";
  readonly source = getSource("source:darpa");
  constructor(private readonly options: { fetchImplementation?: typeof fetch; now?: () => Date; timeoutMs?: number } = {}) {}
  private get now() { return this.options.now ?? (() => new Date()); }
  private get fetchImplementation() { return this.options.fetchImplementation ?? fetch; }

  async testConnection(): Promise<ProviderHealth> {
    try {
      const result = await this.search();
      return { ...providerHealth(this.id, "WORKING", "Official DARPA opportunities RSS returned parseable items.", true), mode: "RSS", recordsRetrieved: result.records.length, lastSuccessfulRequest: result.retrievedAt };
    } catch (error) {
      return { ...providerHealth(this.id, "UPSTREAM_ERROR", error instanceof Error ? error.message : "DARPA RSS request failed.", true), mode: "RSS", lastError: error instanceof Error ? error.message : "DARPA RSS request failed." };
    }
  }

  async search(keyword?: string): Promise<DARPASearchResult> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), this.options.timeoutMs ?? 20_000);
    let response: Response;
    try { response = await this.fetchImplementation(DARPA_OPPORTUNITIES_RSS_URL, { headers: { Accept: "application/rss+xml, application/xml, text/xml" }, signal: controller.signal, cache: "no-store" }); }
    catch (error) { throw new Error(error instanceof Error && error.name === "AbortError" ? "DARPA RSS request timed out." : "DARPA RSS network request failed."); }
    finally { clearTimeout(timeout); }
    if (!response.ok) throw new Error(`DARPA RSS returned HTTP ${response.status}.`);
    const xml = await response.text();
    const retrievedAt = this.now().toISOString();
    let records = parseDARPAOpportunitiesRss(xml, retrievedAt);
    if (!records.length) throw new Error("DARPA RSS returned no parseable opportunity items.");
    if (keyword?.trim()) { const needle = keyword.trim().toLowerCase(); records = records.filter((record) => `${record.title} ${record.description ?? ""}`.toLowerCase().includes(needle)); }
    return { records, retrievedAt, rawSourceHash: sha256(xml), sourceUrl: DARPA_OPPORTUNITIES_RSS_URL, ingestionMethod: "RSS" };
  }
}
