import { afterEach, describe, expect, it } from "vitest";
import { providerHealth } from "./provider";
import { SAMProvider } from "./providers";

describe("provider health states", () => {
  afterEach(() => {
    delete process.env.SAM_API_KEY;
  });

  it("reports configuration required when a credential is absent", async () => {
    const health = await new SAMProvider().testConnection();
    expect(health.status).toBe("AUTH_REQUIRED");
    expect(health.performedExternalCheck).toBe(false);
  });

  it.each(["HEALTHY", "WORKING", "PARTIAL", "DEGRADED", "UNAVAILABLE", "AUTH_REQUIRED", "MAINTENANCE", "UPSTREAM_MAINTENANCE", "RATE_LIMITED", "BUDGET_EXHAUSTED", "UPSTREAM_ERROR", "NOT_CONFIGURED", "CONFIGURATION_REQUIRED", "TEMPORARILY_UNAVAILABLE", "NOT_IMPLEMENTED", "FAILED"] as const)(
    "represents the %s state explicitly",
    (status) => expect(providerHealth("provider:test", status, "fixture").status).toBe(status),
  );
});
