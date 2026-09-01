import { describe, expect, it } from "vitest";
import { normalizeAward } from "./normalize";
import { USAspendingProvider } from "./provider";

describe("USAspending live integration", () => {
  it("retrieves and normalizes at least one recent DoD contract award", async () => {
    const provider = new USAspendingProvider({ timeoutMs: 15_000 });
    const result = await provider.searchAwards({ startDate: "2026-07-01", endDate: "2026-08-31", agency: "Department of Defense", awardTypeCodes: ["A", "B", "C", "D"], limit: 2, sort: "Award Amount", order: "desc" });
    expect(result.httpStatus).toBe(200);
    expect(result.responseHash).toMatch(/^[a-f0-9]{64}$/);
    expect(result.rawResponse.results.length).toBeGreaterThan(0);
    const award = normalizeAward(result.rawResponse.results[0], result.retrievedAt);
    expect(award.sourceProvider).toBe("usaspending");
    expect(award.id).toMatch(/^award:/);
  });
});
