import { describe, expect, it } from "vitest";
import { RequestController } from "./runtime/request-control";
import { TEDProvider } from "./ted";
import { UKFindATenderProvider } from "./uk-fts";

describe("keyless global procurement live contracts", () => {
  it("retrieves one published TED record through Search API v3", async () => {
    const provider = new TEDProvider({ timeoutMs: 30_000, requestController: new RequestController({ ttlMs: 60_000, concurrency: 1, dailyRequestBudget: 1 }) });
    const result = await provider.search({ limit: 1, scope: "ALL" });
    expect(result.records.length).toBeGreaterThan(0);
    expect(result.records[0]).toMatchObject({ jurisdiction: "EU", sourceFamily: "TED_EU" });
  });

  it("retrieves one UK OCDS release package without credentials", async () => {
    const provider = new UKFindATenderProvider({ timeoutMs: 30_000, requestController: new RequestController({ ttlMs: 60_000, concurrency: 1, dailyRequestBudget: 1 }) });
    const result = await provider.search({ limit: 1 });
    expect(result.records.length).toBeGreaterThan(0);
    expect(result.records[0]).toMatchObject({ jurisdiction: "UK", sourceFamily: "UK_FIND_A_TENDER" });
  });
});
