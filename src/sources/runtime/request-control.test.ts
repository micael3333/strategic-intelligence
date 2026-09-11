import { describe, expect, it } from "vitest";
import { ProviderControlError, RequestController } from "./request-control";

describe("RequestController", () => {
  it("normalizes keys, caches results, and deduplicates in-flight work", async () => {
    let calls = 0; let release!: () => void; const pending = new Promise<void>((resolve) => { release = resolve; }); const controller = new RequestController({ ttlMs: 1_000, concurrency: 1 });
    const request = async () => { calls += 1; await pending; return "value"; }; const first = controller.run("  HS  8541 ", request); const second = controller.run("hs 8541", request); release();
    expect((await first).requestExecuted).toBe(true); expect((await second).cacheHit).toBe(true); expect(calls).toBe(1); expect((await controller.run("hs 8541", request)).requestExecuted).toBe(false);
  });
  it("enforces daily budgets without executing another request", async () => { const controller = new RequestController({ ttlMs: 1, concurrency: 1, dailyRequestBudget: 1 }); await controller.run("one", async () => 1); await expect(controller.run("two", async () => 2)).rejects.toMatchObject({ status: "BUDGET_EXHAUSTED" } satisfies Partial<ProviderControlError>); });
  it("activates cooldown after a rate limit", async () => { let now = Date.parse("2026-01-01T00:00:00Z"); const controller = new RequestController({ ttlMs: 1, concurrency: 1, cooldownBaseMs: 1_000 }, () => now); await expect(controller.run("one", async () => { throw new Error("429"); }, () => true)).rejects.toThrow("429"); await expect(controller.run("two", async () => 2)).rejects.toMatchObject({ status: "RATE_LIMITED" } satisfies Partial<ProviderControlError>); now += 1_001; expect((await controller.run("two", async () => 2)).value).toBe(2); });
});
