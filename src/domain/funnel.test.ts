import { describe, expect, it } from "vitest";
import { calculateFunnelStage } from "./funnel";
import { makeEvidence, makeEvent } from "@/test/fixtures";

describe("funnel stage calculation", () => {
  it("returns no stage without supporting events", () => {
    const result = calculateFunnelStage([]);
    expect(result.stage).toBeNull();
    expect(result.supportingEvents).toEqual([]);
  });

  it("does not advance on speculative evidence", () => {
    const result = calculateFunnelStage([makeEvent("MULTI_YEAR_PROCUREMENT", 7, [makeEvidence("SPECULATIVE")])]);
    expect(result.stage).toBeNull();
    expect(result.excludedEvents).toHaveLength(1);
  });

  it("selects the highest supported stage and returns its events", () => {
    const research = makeEvent("SBIR_PHASE_II", 2, [makeEvidence("CONFIRMED")]);
    const validation = makeEvent("SUCCESSFUL_PROTOTYPE", 4, [makeEvidence("PROBABLE")]);
    const result = calculateFunnelStage([research, validation]);
    expect(result.stage).toBe(4);
    expect(result.supportingEvents).toEqual([validation]);
    expect(result.explanation).toContain("Stage 4");
  });
});
