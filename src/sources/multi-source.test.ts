import { readFileSync } from "node:fs";
import { describe, expect, it, vi } from "vitest";
import { correlateEvents, requiresEntityReview, type CrossSourceStrategicEvent } from "@/domain/multi-source";
import { parseAFWERXFundingPage } from "./afwerx";
import { runIsolatedProviders } from "./orchestrator";
import { normalizeSAMOpportunity } from "./sam";
import { SAMProvider } from "./sam/provider";
import { parseSBIRDataset } from "./sbir";
import { SBIRProvider } from "./sbir/provider";
import { GrantsProvider } from "./grants/provider";
import { parseDARPAOpportunitiesRss } from "./darpa/provider";

const samRaw = { totalRecords: 1, opportunitiesData: [{ noticeId: "notice-1", title: "Counter-UAS resilient PNT Sources Sought", solicitationNumber: "SOL-001", postedDate: "2026-08-01", type: "r", department: "DEPARTMENT OF DEFENSE", subTier: "DEPARTMENT OF THE AIR FORCE", office: "AFRL", fullParentPathName: "DEPARTMENT OF DEFENSE", naicsCode: "541715", description: "Counter drone and electronic warfare requirement." }] };

describe("provider isolation", () => {
  const success = { providerId: "provider:usaspending", run: async () => ({ records: [{ id: "award:1" }] }) };
  it.each([
    ["SAM has no key", "provider:sam"],
    ["SBIR API is unavailable", "provider:sbir"],
    ["SAM returns an HTTP error", "provider:sam"],
    ["AFWERX parser fails", "provider:afwerx"],
  ])("preserves USAspending when %s", async (_case, providerId) => {
    const results = await runIsolatedProviders([success, { providerId, run: async () => { throw new Error("isolated failure"); } }]);
    expect(results[0].records).toEqual([{ id: "award:1" }]);
    expect(results[0].status).toBe("HEALTHY");
    expect(results[1]).toMatchObject({ status: "UNAVAILABLE", records: [] });
  });
  it("contains a malformed provider result without cancelling another provider", async () => {
    const results = await runIsolatedProviders([success, { providerId: "provider:malformed", run: async () => ({ records: [null as never] }) }]);
    expect(results[0].records).toHaveLength(1);
    expect(results[1].records).toEqual([null]);
  });
});

describe("SAM adapter", () => {
  it("preserves provenance and maps Sources Sought cautiously", () => {
    const record = normalizeSAMOpportunity(samRaw.opportunitiesData[0], "2026-08-31T00:00:00Z", "hash:fixture");
    expect(record).toMatchObject({ noticeId: "notice-1", type: "SOURCES_SOUGHT", funnelStageCandidate: 1, evidenceLevel: "CONFIRMED", rawProvenanceHash: "hash:fixture", department: "DEPARTMENT OF DEFENSE", subTier: "DEPARTMENT OF THE AIR FORCE", office: "AFRL" });
    expect(record.funnelInterpretation).toContain("no award or validation");
    expect(record.event.technologyTags).toContain("COUNTER_UAS");
  });
  it("blocks duplicate notice IDs", async () => {
    const fetchImplementation = vi.fn(async () => new Response(JSON.stringify(samRaw), { status: 200 })) as unknown as typeof fetch;
    const provider = new SAMProvider({ apiKey: "fixture-key", fetchImplementation, now: () => new Date("2026-08-31T00:00:00Z") });
    const query = { postedFrom: "2026-08-01", postedTo: "2026-08-31", limit: 10 };
    expect((await provider.search(query)).records).toHaveLength(1);
    const duplicate = await provider.search(query);
    expect(duplicate.records).toHaveLength(0); expect(duplicate.duplicatesBlocked).toBe(1);
  });
  it("paginates deterministically and preserves per-page provenance", async () => {
    const fetchImplementation = vi.fn(async (input: string | URL | Request) => {
      const offset = Number(new URL(String(input)).searchParams.get("offset"));
      const records = offset === 0 ? [{ ...samRaw.opportunitiesData[0], noticeId: "page-1" }, { ...samRaw.opportunitiesData[0], noticeId: "page-2" }] : [{ ...samRaw.opportunitiesData[0], noticeId: "page-3" }];
      return new Response(JSON.stringify({ totalRecords: 3, opportunitiesData: records }), { status: 200 });
    }) as unknown as typeof fetch;
    const result = await new SAMProvider({ apiKey: "fixture-key", fetchImplementation }).search({ postedFrom: "2026-08-01", postedTo: "2026-08-31", maxRecords: 3, pageSize: 2 });
    expect(result.records).toHaveLength(3); expect(result.pagination).toMatchObject({ pagesFetched: 2, recordsReturned: 3, truncated: false }); expect(result.provenance.pages).toHaveLength(2);
  });
  it("distinguishes successful empty results from provider errors", async () => {
    const provider = new SAMProvider({ apiKey: "fixture-key", fetchImplementation: vi.fn(async () => new Response(JSON.stringify({ totalRecords: 0, opportunitiesData: [] }), { status: 200 })) as unknown as typeof fetch });
    const result = await provider.search({ postedFrom: "2026-08-01", postedTo: "2026-08-31" });
    expect(result.resultState).toBe("EMPTY"); expect(result.records).toEqual([]);
  });
  it.each([[401, "AUTHENTICATION_ERROR"], [403, "AUTHORIZATION_ERROR"], [429, "RATE_LIMITED"], [503, "UPSTREAM_ERROR"]] as const)("maps HTTP %i to %s", async (httpStatus, expected) => {
    const provider = new SAMProvider({ apiKey: "fixture-key", fetchImplementation: vi.fn(async () => new Response("upstream", { status: httpStatus })) as unknown as typeof fetch });
    await expect(provider.search({ postedFrom: "2026-08-01", postedTo: "2026-08-31" })).rejects.toMatchObject({ details: { status: expected, httpStatus } });
  });
});

describe("SBIR dataset fallback", () => {
  it("parses the official CSV schema and blocks duplicate awards", async () => {
    const content = readFileSync(new URL("../test/fixtures/sbir-awards.csv", import.meta.url), "utf8");
    const parsed = parseSBIRDataset(content, ".csv"); expect(parsed[0].uei).toBe("FIXTUREUEI01");
    const fetchImplementation = vi.fn(async () => new Response("maintenance", { status: 503 })) as unknown as typeof fetch;
    const provider = new SBIRProvider({ fetchImplementation, now: () => new Date("2026-08-31T00:00:00Z") });
    const first = (provider as unknown as { normalize(raw: typeof parsed, query: object, mode: "DATASET"): { records: unknown[] } }).normalize(parsed, {}, "DATASET");
    const second = (provider as unknown as { normalize(raw: typeof parsed, query: object, mode: "DATASET"): { records: unknown[]; duplicatesBlocked: number } }).normalize(parsed, {}, "DATASET");
    expect(first.records).toHaveLength(1); expect(second.records).toHaveLength(0); expect(second.duplicatesBlocked).toBe(1);
  });
  it("exposes the documented Company and Solicitation/Topics API interfaces", async () => {
    const fetchImplementation = vi.fn(async (input: string | URL | Request) => {
      const url = String(input);
      return new Response(JSON.stringify(url.includes("/firm") ? [{ company_name: "Fixture Company", uei: "FIXTUREUEI01" }] : [{ solicitation_title: "Fixture Solicitation", solicitation_topics: [{ topic_number: "AF251-001" }] }]), { status: 200 });
    }) as unknown as typeof fetch;
    const provider = new SBIRProvider({ fetchImplementation, now: () => new Date("2026-08-31T00:00:00Z") });
    expect((await provider.searchCompanies({ uei: "FIXTUREUEI01" })).records[0].company_name).toBe("Fixture Company");
    expect((await provider.searchSolicitations({ keyword: "navigation" })).records[0].solicitation_topics?.[0].topic_number).toBe("AF251-001");
  });
});

describe("AFWERX official-web parser", () => {
  it("normalizes a sanitized official funding-page fixture", () => {
    const html = readFileSync(new URL("../test/fixtures/afwerx-funding.html", import.meta.url), "utf8");
    const records = parseAFWERXFundingPage(html, "2026-08-31T00:00:00Z");
    expect(records).toHaveLength(1);
    expect(records[0]).toMatchObject({ topicType: "SPECIFIC_TOPIC", topicCode: "26.BZ", evidenceLevel: "CONFIRMED", rawSourceHash: expect.stringMatching(/^[a-f0-9]{64}$/) });
  });
});

describe("Grants.gov adapter", () => {
  it("normalizes official search2 results as early public-capital signals", async () => {
    const response = { errorcode: 0, msg: "Webservice Succeeds", data: { hitCount: 1, oppHits: [{ id: "123", number: "DOE-TEST-1", title: "Critical minerals and gallium processing", agencyCode: "DOE", agencyName: "Department of Energy", openDate: "08/01/2026", closeDate: "09/30/2026", oppStatus: "posted", docType: "synopsis", alnist: ["81.087"] }] } };
    const provider = new GrantsProvider({ fetchImplementation: vi.fn(async () => new Response(JSON.stringify(response), { status: 200 })) as unknown as typeof fetch, now: () => new Date("2026-08-31T00:00:00Z") });
    const result = await provider.search({ keyword: "critical minerals", limit: 10 });
    expect(result).toMatchObject({ resultState: "SUCCESS", totalRecords: 1 });
    expect(result.records[0]).toMatchObject({ opportunityId: "123", closeDate: "2026-09-30", evidenceLevel: "CONFIRMED", event: { sourceFamily: "GRANTS_GOV", ingestionMethod: "API", sourceType: "GRANT", funnelStageCandidate: 2 } });
    expect(result.records[0].event.technologyTags).toContain("CRITICAL_MINERALS");
  });
});

describe("DARPA RSS adapter", () => {
  it("deduplicates official feed items and preserves RSS attribution", () => {
    const item = "<item><guid>darpa-1</guid><title><![CDATA[Autonomous Systems Opportunity]]></title><description>Swarm autonomy research</description><link>https://www.darpa.mil/work-with-us/opportunities/test</link><pubDate>Mon, 31 Aug 2026 12:00:00 GMT</pubDate></item>";
    const records = parseDARPAOpportunitiesRss(`<rss><channel>${item}${item}</channel></rss>`, "2026-08-31T13:00:00Z");
    expect(records).toHaveLength(1);
    expect(records[0]).toMatchObject({ title: "Autonomous Systems Opportunity", evidenceLevel: "CONFIRMED", event: { sourceFamily: "DARPA", ingestionMethod: "RSS", sourceType: "DARPA_PROGRAM", funnelStageCandidate: 2 } });
  });
});

describe("cross-source entity and event correlation", () => {
  const event = (id: string, sourceFamily: CrossSourceStrategicEvent["sourceFamily"], overrides: Partial<CrossSourceStrategicEvent> = {}): CrossSourceStrategicEvent => ({ id, sourceFamily, sourceRecordId: id, eventType: "FIXTURE", funnelStageCandidate: null, evidenceLevel: "CONFIRMED", sourceUrl: "https://example.invalid", retrievedAt: "2026-08-31T00:00:00Z", rawProvenanceHash: `hash:${id}`, ...overrides });
  it("correlates exact UEI across sources", () => expect(correlateEvents([event("sam", "SAM", { uei: "UEI-1" }), event("award", "USASPENDING", { uei: "UEI-1" })])[0]).toMatchObject({ matchType: "UEI", evidenceLevel: "CONFIRMED" }));
  it("does not merge fuzzy company names", () => {
    expect(correlateEvents([event("one", "SAM", { entityName: "Acme Systems" }), event("two", "SBIR_STTR", { entityName: "Acme System Technologies" })])).toEqual([]);
    expect(requiresEntityReview("Acme Systems", "Acme System Technologies")).toBe(true);
  });
});
