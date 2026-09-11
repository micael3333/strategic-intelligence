import { describe, expect, it } from "vitest";
import { calculateCountryConcentration, calculateObservationTrends, type TradeObservation } from "./physical-economy";

describe("physical economy analytics", () => {
  it("uses monthly offsets for MoM and YoY", () => { const values = Array.from({ length: 24 }, (_, index) => ({ period: `${2024 + Math.floor(index / 12)}-${String(index % 12 + 1).padStart(2, "0")}`, value: index + 1 })); const trends = calculateObservationTrends(values); expect(trends.find((item) => item.metric === "MOM")?.periodsCompared).toEqual(["2025-11", "2025-12"]); expect(trends.find((item) => item.metric === "YOY")?.periodsCompared).toEqual(["2024-12", "2025-12"]); });
  it("does not call twelve daily observations a year", () => { const values = Array.from({ length: 40 }, (_, index) => ({ period: `2026-01-${String(index + 1).padStart(2, "0")}`, value: index + 1 })); expect(calculateObservationTrends(values, "DAILY").find((item) => item.metric === "YOY")?.direction).toBe("INSUFFICIENT_HISTORY"); });
  it("calculates latest-period country concentration", () => { const base = { source: "CENSUS_TRADE" as const, flow: "IMPORT" as const, hsCode: "8541", period: "2026-01", retrievedAt: "2026-02-01", sourceUrl: "official", rawProvenanceHash: "hash" }; const records: TradeObservation[] = [{ ...base, id: "a", countryCode: "A", value: 75 }, { ...base, id: "b", countryCode: "B", value: 25 }]; expect(calculateCountryConcentration(records)).toMatchObject({ status: "CALCULATED", hhi: 6250, topCountryShare: .75 }); });
});
