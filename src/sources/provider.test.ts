import { afterEach, describe, expect, it } from "vitest";
import { providerHealth } from "./provider";
import { DARPAProvider, SAMProvider, SECProvider } from "./providers";

describe("provider health states", () => {
  afterEach(() => {
    delete process.env.SAM_API_KEY;
    delete process.env.SEC_USER_AGENT;
  });

  it("reports configuration required when a credential is absent", async () => {
    const health = await new SAMProvider().testConnection();
    expect(health.status).toBe("AUTH_REQUIRED");
    expect(health.performedExternalCheck).toBe(false);
  });

  it("reports not implemented instead of faking a successful check", async () => {
    const health = await new DARPAProvider().testConnection();
    expect(health.status).toBe("NOT_IMPLEMENTED");
    expect(health.performedExternalCheck).toBe(false);
  });

  it("still does not claim health when a future credential is configured", async () => {
    process.env.SEC_USER_AGENT = "local-test-identifier";
    const health = await new SECProvider().testConnection();
    expect(health.status).toBe("NOT_IMPLEMENTED");
  });

  it.each(["HEALTHY", "DEGRADED", "UNAVAILABLE", "AUTH_REQUIRED", "MAINTENANCE", "NOT_CONFIGURED", "CONFIGURATION_REQUIRED", "TEMPORARILY_UNAVAILABLE", "NOT_IMPLEMENTED", "FAILED"] as const)(
    "represents the %s state explicitly",
    (status) => expect(providerHealth("provider:test", status, "fixture").status).toBe(status),
  );
});
