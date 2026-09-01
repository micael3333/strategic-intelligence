import { readFileSync } from "node:fs";
import { describe, expect, it, vi } from "vitest";
import { calculateRecipientAcceleration } from "./acceleration";
import { AwardDeduplicator } from "./deduplication";
import { RecipientEntityResolver } from "./entity-resolution";
import { interpretProcurementFunnel } from "./funnel";
import { createAwardEvidence, normalizeAward } from "./normalize";
import { USAspendingProvider } from "./provider";
import { mapUSAspendingQuery } from "./query";
import type { USAspendingRawAward, USAspendingUpstreamResponse } from "./types";
import { handleUSAspendingSearch } from "@/server/usaspending-handlers";

const fixture = JSON.parse(readFileSync(new URL("../../test/fixtures/usaspending-awards.json", import.meta.url), "utf8")) as USAspendingUpstreamResponse;
const retrievedAt = "2026-08-31T12:00:00.000Z";

describe("USAspending request mapping", () => {
  it("maps the internal query without exposing upstream shape to callers", () => {
    const request = mapUSAspendingQuery({ startDate: "2025-01-01", endDate: "2026-01-01", agency: "Department of Defense", keywords: ["resilient PNT"], recipientSearchText: "fixture", minimumAwardAmount: 1000, naicsCodes: ["541715"], pscCodes: ["AC13"] });
    expect(request.filters.time_period[0]).toEqual({ start_date: "2025-01-01", end_date: "2026-01-01", date_type: "new_awards_only" });
    expect(request.filters.award_type_codes).toEqual(["A", "B", "C", "D"]);
    expect(request.filters.agencies?.[0]).toEqual({ type: "awarding", tier: "toptier", name: "Department of Defense" });
    expect(request.filters.award_amounts).toEqual([{ lower_bound: 1000, upper_bound: undefined }]);
  });
});

describe("normalization and evidence", () => {
  it("preserves raw data while creating confirmed field evidence", () => {
    const normalized = normalizeAward(fixture.results[0], retrievedAt);
    const evidence = createAwardEvidence(normalized);
    expect(normalized.awardId).toBe("FIXTURE-AWARD-001");
    expect(normalized.uei).toBe("FIXTUREUEI01");
    expect(normalized.rawRecord).toBe(fixture.results[0]);
    expect(evidence.evidenceLevel).toBe("CONFIRMED");
    expect(evidence.notes).toContain("does not confirm strategic importance");
  });
});

describe("deduplication and resolution", () => {
  it("is idempotent for the same authoritative award key", () => {
    const dedup = new AwardDeduplicator();
    expect(dedup.checkAndAdd("award:1").isDuplicate).toBe(false);
    expect(dedup.checkAndAdd("award:1").isDuplicate).toBe(true);
    expect(dedup.size).toBe(1);
  });
  it("uses strong recipient identifiers and refuses uncertain name-only merges", () => {
    const resolver = new RecipientEntityResolver();
    expect(resolver.resolve(normalizeAward(fixture.results[0], retrievedAt)).status).toBe("RESOLVED_STRONG_ID");
    const nameOnly = normalizeAward({ internal_id: 9, "Recipient Name": "Similar Fixture Name" }, retrievedAt);
    expect(resolver.resolve(nameOnly).status).toBe("ENTITY_REVIEW_REQUIRED");
  });
});

describe("acceleration and funnel interpretation", () => {
  it("detects quantitatively supported acceleration", () => {
    const current = fixture.results.map((raw) => normalizeAward(raw, retrievedAt));
    const previous = normalizeAward({ ...fixture.results[0], internal_id: 3, generated_internal_id: "OLDER", "Award Amount": 250000, "Start Date": "2025-04-01" }, retrievedAt);
    const analysis = calculateRecipientAcceleration([...current, previous], new Date("2026-08-31T00:00:00Z"));
    expect(analysis.metrics.awardCount12m).toBe(2);
    expect(analysis.metrics.awardCountPrevious12m).toBe(1);
    expect(analysis.label).toBe("ACCELERATING GOVERNMENT ADOPTION");
    expect(analysis.explanation).toContain("award value rose");
  });
  it("does not promote a single award but supports stage 5 for repeat procurement", () => {
    const awards = fixture.results.map((raw) => normalizeAward(raw, retrievedAt));
    expect(interpretProcurementFunnel(awards[0], [awards[0]]).stage).toBeNull();
    expect(interpretProcurementFunnel(awards[1], awards).stage).toBe(5);
  });
});

describe("API and provider error handling", () => {
  it("rejects invalid API input before calling the service", async () => {
    const service = { searchAndIngest: vi.fn() };
    const response = await handleUSAspendingSearch(new Request("http://local/api", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ startDate: "bad", endDate: "2026-01-01" }) }), service as never);
    expect(response.status).toBe(400);
    expect(service.searchAndIngest).not.toHaveBeenCalled();
  });
  it("reports healthy only after a real-shaped successful response", async () => {
    const fetchImplementation = vi.fn(async () => new Response(JSON.stringify(fixture), { status: 200, headers: { "Content-Type": "application/json" } })) as unknown as typeof fetch;
    const health = await new USAspendingProvider({ fetchImplementation, now: () => new Date("2026-08-31T00:00:00Z") }).testConnection();
    expect(health.status).toBe("HEALTHY");
    expect(health.performedExternalCheck).toBe(true);
    expect(fetchImplementation).toHaveBeenCalledOnce();
  });
  it("maps upstream service errors to temporary unavailability", async () => {
    const fetchImplementation = vi.fn(async () => new Response("offline", { status: 503 })) as unknown as typeof fetch;
    const health = await new USAspendingProvider({ fetchImplementation, now: () => new Date("2026-08-31T00:00:00Z") }).testConnection();
    expect(health.status).toBe("TEMPORARILY_UNAVAILABLE");
  });
});
