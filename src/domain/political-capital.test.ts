import { describe, expect, it } from "vitest";
import { derivePoliticalCapitalSignals, type PoliticalTransaction } from "./political-capital";
import type { CrossSourceStrategicEvent } from "./multi-source";

const transaction = (id: string, filer: string, mappingConfidence = .9): PoliticalTransaction => ({ id, chamber: "HOUSE", filer, filingId: id, filingType: "PTR", transactionDate: "2026-08-01", disclosureDate: "2026-08-15", asset: "Fixture Systems common stock", transactionType: "PURCHASE", valueRange: { label: "$1,001 - $15,000", minimum: 1001, maximum: 15000, currency: "USD" }, sourceUrl: `https://disclosures-clerk.house.gov/${id}.pdf`, retrievedAt: "2026-08-20", evidenceLevel: "CONFIRMED", mappedCompany: "Fixture Systems", technologyTags: ["RESILIENT_PNT"], mappingConfidence, mappingEvidence: "Issuer explicit in filing." });
const procurement: CrossSourceStrategicEvent = { id: "award", sourceFamily: "USASPENDING", sourceRecordId: "award", sourceType: "AWARD", eventType: "OPERATIONAL_AWARD", entityName: "Fixture Systems", technologyTags: ["RESILIENT_PNT"], funnelStageCandidate: 5, evidenceLevel: "CONFIRMED", sourceUrl: "https://usaspending.gov/award", retrievedAt: "2026-08-20", rawProvenanceHash: "award", rawData: {} };

describe("political capital signals", () => {
  it("requires reviewed company mappings and keeps signals derived", () => { const signals = derivePoliticalCapitalSignals([transaction("one", "Filer A"), transaction("two", "Filer B")], [procurement]); expect(signals.map((item) => item.type)).toEqual(expect.arrayContaining(["CLUSTERED_POLITICAL_BUYING", "POLITICAL_PROCUREMENT_OVERLAP", "POLITICAL_TECHNOLOGY_OVERLAP"])); expect(signals.every((item) => item.assertionClass === "DERIVED_SIGNAL")).toBe(true); expect(signals[0].caveat).toContain("not evidence of insider trading"); });
  it("does not cluster low-confidence issuer mappings", () => { const signals = derivePoliticalCapitalSignals([transaction("one", "Filer A", .5), transaction("two", "Filer B", .5)]); expect(signals).toHaveLength(1); expect(signals[0].status).toBe("INSUFFICIENT_DATA"); });
});
