import { describe, expect, it } from "vitest";
import { calculateAcceleration, calculateEvidenceConfidence, calculateStrategicSignal } from "./scoring";
import { makeEvidence, makeEvent } from "@/test/fixtures";

describe("strategic signal score", () => {
  it("returns inspectable weighted factors and evidence references", () => {
    const confirmed = makeEvent("SUCCESSFUL_PROTOTYPE", 4, [makeEvidence("CONFIRMED", { id: "ev:confirmed" })]);
    const inferred = makeEvent("PRIME_RELATIONSHIP", 7, [makeEvidence("INFERRED", { id: "ev:inferred" })]);
    const result = calculateStrategicSignal([confirmed, inferred]);
    expect(result.score).toBe(16.6);
    expect(result.factors).toHaveLength(2);
    expect(result.evidenceReferences).toEqual(["ev:confirmed", "ev:inferred"]);
  });

  it("caps the total at 100", () => {
    const events = Array.from({ length: 10 }, (_, index) => ({
      ...makeEvent("MULTI_YEAR_PROCUREMENT", 7, [makeEvidence("CONFIRMED", { id: `e:${index}` })]),
      id: `event:${index}`,
    }));
    expect(calculateStrategicSignal(events).score).toBe(100);
  });
});

describe("acceleration score", () => {
  it("rewards adoption change and breadth without using largest award directly", () => {
    const base = {
      awardCount12m: 8,
      awardCountPrevious12m: 2,
      awardValue12m: 18_000_000,
      awardValuePrevious12m: 1_200_000,
      numberOfAgencies: 3,
      numberOfPrograms: 4,
      numberOfPrimeRelationships: 2,
      averageTimeBetweenAwardsDays: 45,
      previousAverageTimeBetweenAwardsDays: 120,
      newAgencyCustomers: 2,
      evidenceReferences: ["e:award-series"],
    };
    const result = calculateAcceleration({ ...base, largestAward: 18_000_000 });
    const changedLargestAward = calculateAcceleration({ ...base, largestAward: 900_000_000 });
    expect(result.score).toBeGreaterThan(75);
    expect(changedLargestAward.score).toBe(result.score);
    expect(result.evidenceReferences).toEqual(["e:award-series"]);
  });
});

describe("evidence confidence", () => {
  it("keeps proof quality independent from strategic signal", () => {
    const result = calculateEvidenceConfidence([
      makeEvidence("CONFIRMED", { id: "e:one", confidence: 0.9 }),
      makeEvidence("INFERRED", { id: "e:two", confidence: 0.5 }),
    ]);
    expect(result.score).toBe(55);
    expect(result.factors).toHaveLength(2);
  });

  it("returns zero without evidence", () => {
    expect(calculateEvidenceConfidence([]).score).toBe(0);
  });
});
