import { describe, expect, it } from "vitest";
import { effectiveEvidenceLevel, strongestEvidenceLevel, validateEvidence } from "./evidence";
import { makeEvidence } from "@/test/fixtures";

describe("evidence rules", () => {
  it("accepts a supported, bounded evidence record", () => {
    expect(validateEvidence(makeEvidence())).toEqual([]);
  });

  it("rejects confidence outside the zero-to-one range", () => {
    expect(validateEvidence(makeEvidence("INFERRED", { confidence: 1.2 }))).toContain("confidence must be between 0 and 1");
  });

  it("never allows AI-generated evidence to remain confirmed", () => {
    const evidence = makeEvidence("CONFIRMED", { generatedByAi: true });
    expect(validateEvidence(evidence)).toContain("AI-generated evidence cannot be CONFIRMED");
    expect(effectiveEvidenceLevel(evidence)).toBe("INFERRED");
  });

  it("returns the strongest effective level", () => {
    expect(strongestEvidenceLevel([makeEvidence("SPECULATIVE"), makeEvidence("PROBABLE")])).toBe("PROBABLE");
  });
});
