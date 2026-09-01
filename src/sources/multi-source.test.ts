import { readFileSync } from "node:fs";
import { describe, expect, it, vi } from "vitest";
import { correlateEvents, requiresEntityReview, type CrossSourceStrategicEvent } from "@/domain/multi-source";
import { parseAFWERXFundingPage } from "./afwerx";
import { runIsolatedProviders } from "./orchestrator";
import { normalizeSAMOpportunity } from "./sam";
import { SAMProvider } from "./sam/provider";
import { parseSBIRDataset } from "./sbir";
import { SBIRProvider } from "./sbir/provider";

const samRaw = { totalRecords: 1, opportunitiesData: [{ noticeId: "notice-1", title: "Resilient PNT Sources Sought", solicitationNumber: "SOL-001", postedDate: "2026-08-01", type: "r", fullParentPathName: "DEPARTMENT OF DEFENSE", naicsCode: "541715" }] };

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
    expect(record).toMatchObject({ noticeId: "notice-1", type: "SOURCES_SOUGHT", funnelStageCandidate: 1, evidenceLevel: "CONFIRMED", rawProvenanceHash: "hash:fixture" });
    expect(record.funnelInterpretation).toContain("no award or validation");
  });
  it("blocks duplicate notice IDs", async () => {
    const fetchImplementation = vi.fn(async () => new Response(JSON.stringify(samRaw), { status: 200 })) as unknown as typeof fetch;
    const provider = new SAMProvider({ apiKey: "fixture-key", fetchImplementation, now: () => new Date("2026-08-31T00:00:00Z") });
    const query = { postedFrom: "2026-08-01", postedTo: "2026-08-31", limit: 10 };
    expect((await provider.search(query)).records).toHaveLength(1);
    const duplicate = await provider.search(query);
    expect(duplicate.records).toHaveLength(0); expect(duplicate.duplicatesBlocked).toBe(1);
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

describe("cross-source entity and event correlation", () => {
  const event = (id: string, sourceFamily: CrossSourceStrategicEvent["sourceFamily"], overrides: Partial<CrossSourceStrategicEvent> = {}): CrossSourceStrategicEvent => ({ id, sourceFamily, sourceRecordId: id, eventType: "FIXTURE", funnelStageCandidate: null, evidenceLevel: "CONFIRMED", sourceUrl: "https://example.invalid", retrievedAt: "2026-08-31T00:00:00Z", rawProvenanceHash: `hash:${id}`, ...overrides });
  it("correlates exact UEI across sources", () => expect(correlateEvents([event("sam", "SAM", { uei: "UEI-1" }), event("award", "USASPENDING", { uei: "UEI-1" })])[0]).toMatchObject({ matchType: "UEI", evidenceLevel: "CONFIRMED" }));
  it("does not merge fuzzy company names", () => {
    expect(correlateEvents([event("one", "SAM", { entityName: "Acme Systems" }), event("two", "SBIR_STTR", { entityName: "Acme System Technologies" })])).toEqual([]);
    expect(requiresEntityReview("Acme Systems", "Acme System Technologies")).toBe(true);
  });
});
