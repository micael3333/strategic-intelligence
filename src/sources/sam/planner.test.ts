import { describe, expect, it } from "vitest";
import { RequestController } from "@/sources/runtime/request-control";
import { SAMProvider } from "./provider";
import { createSAMQueryPlan, SAMQueryPlanner } from "./planner";

describe("SAM query planner", () => {
  it("selects at most two high-information single terms", () => { const plan = createSAMQueryPlan("counter-UAS", "COUNTER_UAS"); expect(plan.terms).toEqual(["drone", "interceptor"]); expect(plan.terms).toHaveLength(2); });
  it("deduplicates results and caches repeated plans", async () => { let calls = 0; const fetchImplementation: typeof fetch = async (input) => { calls += 1; const title = new URL(String(input)).searchParams.get("title"); return new Response(JSON.stringify({ totalRecords: 1, opportunitiesData: [{ noticeId: "same", title: `${title} counter drone`, postedDate: "2026-01-02", type: "Solicitation", uiLink: "https://sam.gov/example" }] }), { status: 200 }); }; const planner = new SAMQueryPlanner(() => new SAMProvider({ apiKey: "fixture", fetchImplementation, now: () => new Date("2026-01-03") }), new RequestController({ ttlMs: 60_000, concurrency: 2 })); const input = { query: "counter-UAS", cluster: "COUNTER_UAS" as const, postedFrom: "2026-01-01", postedTo: "2026-01-03" }; const first = await planner.search(input); const second = await planner.search(input); expect(first.records).toHaveLength(1); expect(first.apiRequestsExecuted).toBe(2); expect(second.apiRequestsExecuted).toBe(0); expect(calls).toBe(2); });
});
