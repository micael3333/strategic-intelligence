import { describe, expect, it, vi } from "vitest";
import { AFWERXProvider } from "./afwerx";
import { SAMProvider } from "./sam";
import { SBIRProvider } from "./sbir";

describe("multi-source live health", () => {
  it("records the current official SBIR API state without claiming false health", async () => {
    const health = await new SBIRProvider({ timeoutMs: 15_000 }).testConnection();
    expect(["HEALTHY", "DEGRADED", "MAINTENANCE"]).toContain(health.status);
    expect(health.performedExternalCheck).toBe(true);
  });

  it("retrieves and normalizes at least one current official AFWERX opportunity", async () => {
    const result = await new AFWERXProvider({ cacheTtlMs: 0 }).search();
    expect(result.records.length).toBeGreaterThan(0);
    expect(result.records[0].evidenceLevel).toBe("CONFIRMED");
    expect(result.records[0].rawSourceHash).toMatch(/^[a-f0-9]{64}$/);
  });

  it("uses the official SBIR dataset fallback when the API is unavailable", async () => {
    const fetchImplementation = vi.fn(async () => new Response("maintenance", { status: 503 })) as unknown as typeof fetch;
    const datasetPath = new URL("../test/fixtures/sbir-awards.csv", import.meta.url).pathname.replace(/^\/(.:)/, "$1");
    const result = await new SBIRProvider({ fetchImplementation, datasetPath }).search({ keyword: "inertial navigation", limit: 10 });
    expect(result.mode).toBe("DATASET");
    expect(result.records).toHaveLength(1);
  });

  const samTest = process.env.SAM_API_KEY ? it : it.skip;
  samTest("queries the official SAM API when SAM_API_KEY is configured", async () => {
    const result = await new SAMProvider().search({ postedFrom: "2026-08-01", postedTo: "2026-08-31", organization: "Department of Defense", limit: 2 });
    expect(result.provenance.httpStatus).toBe(200);
  });

  it("reports AUTH_REQUIRED when SAM_API_KEY is absent", async () => {
    if (process.env.SAM_API_KEY) return;
    expect((await new SAMProvider().testConnection()).status).toBe("AUTH_REQUIRED");
  });
});
