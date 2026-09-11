import { describe, expect, it } from "vitest";
import { ingestionIdempotencyKey, runControlledIngestion, runIngestionJobs, V25_INGESTION_JOBS } from "./ingestion";

describe("controlled ingestion architecture", () => { it("runs bounded investigations sequentially and isolates failures", async () => { const order: string[] = []; const results = await runControlledIngestion(async (input) => { order.push(input.id); if (input.id === "fail") throw new Error("fixture"); }, [{ id: "first", query: "one", dimension: "TECHNOLOGY", includeContractAwards: false }, { id: "fail", query: "two", dimension: "MATERIAL", includeContractAwards: false }, { id: "last", query: "three", dimension: "MARKET", includeContractAwards: false }]); expect(order).toEqual(["first", "fail", "last"]); expect(results.map((item) => item.status)).toEqual(["COMPLETED", "FAILED", "COMPLETED"]); }); });

describe("V2.5 ingestion jobs", () => {
  it("defines every new provider with explicit request economics", () => {
    expect(new Set(V25_INGESTION_JOBS.map((job) => job.provider))).toEqual(new Set(["TED_EU", "UK_FIND_A_TENDER", "DIU", "BLUE_UAS", "EXPORT_CONTROLS", "SEC_EDGAR", "HOUSE_DISCLOSURES"]));
    expect(V25_INGESTION_JOBS.every((job) => job.requestBudget >= 0)).toBe(true);
  });

  it("uses stable window keys and skips completed work", async () => {
    const job = V25_INGESTION_JOBS[0]; const window = { from: "2026-08-01", to: "2026-08-02" }; const completed = new Set([ingestionIdempotencyKey(job, window)]); let calls = 0;
    const results = await runIngestionJobs(async () => { calls += 1; }, window, [job], completed);
    expect(results[0].status).toBe("SKIPPED_DUPLICATE"); expect(calls).toBe(0);
  });
});
