import { describe, expect, it } from "vitest";
import { USAspendingPipeline } from "./pipeline";
import { USAspendingProvider } from "./provider";
import { USAspendingRuntimeStore } from "./store";

describe("USAspending live integration", () => {
  it.each(["HONEYWELL INTERNATIONAL INC.", "LOCKHEED MARTIN"])("recovers the complete Phase 2 control path for %s", async (recipientName) => {
    const store = new USAspendingRuntimeStore();
    const pipeline = new USAspendingPipeline(new USAspendingProvider({ timeoutMs: 15_000 }), store);
    const result = await pipeline.searchAndIngest({
      startDate: "2025-01-01",
      endDate: "2026-08-31",
      agency: "Department of Defense",
      recipientSearchText: recipientName,
      awardTypeCodes: ["A", "B", "C", "D"],
      limit: 10,
      sort: "Award Amount",
      order: "desc",
    });
    expect(result.provenance.httpStatus).toBe(200);
    expect(result.provenance.responseHash).toMatch(/^[a-f0-9]{64}$/);
    expect(result.awards.length).toBeGreaterThan(0);
    expect(result.awards.every((award) => award.normalized.sourceProvider === "usaspending")).toBe(true);
    expect(result.awards.some((award) => award.recipient.status === "RESOLVED_STRONG_ID")).toBe(true);
    const resolved = result.awards.find((award) => award.recipient.status === "RESOLVED_STRONG_ID");
    expect(resolved?.recipient.identifiers.uei).toBeTruthy();
    const intelligence = store.recipientIntelligence(resolved!.recipient.id, new Date("2026-08-31T00:00:00Z"));
    expect(intelligence?.strategicSignal.score).toBeGreaterThan(0);
    expect(intelligence?.acceleration.score.score).toBeGreaterThanOrEqual(0);
    expect(intelligence?.evidenceConfidence.score).toBeGreaterThan(0);
  });
});
