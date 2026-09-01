import type { Evidence } from "@/domain/models";
import { sha256 } from "./hash";
import { USASPENDING_SPENDING_BY_AWARD_URL, type NormalizedUSAspendingAward, type USAspendingRawAward } from "./types";

const text = (value: unknown): string | undefined => value === null || value === undefined || value === "" ? undefined : String(value);
const amount = (value: unknown): number | undefined => typeof value === "number" && Number.isFinite(value) ? value : undefined;

export function awardDeduplicationKey(raw: USAspendingRawAward): string {
  const authoritative = text(raw.generated_internal_id) ?? text(raw["Award ID"]);
  if (authoritative) return `usaspending-award:${authoritative}`;
  return `usaspending-award:review:${sha256({ internal_id: raw.internal_id, recipient_id: raw.recipient_id })}`;
}

export function normalizeAward(raw: USAspendingRawAward, retrievedAt: string): NormalizedUSAspendingAward {
  const key = awardDeduplicationKey(raw);
  return {
    id: `award:${sha256(key)}`,
    generatedInternalId: text(raw.generated_internal_id),
    awardId: text(raw["Award ID"]),
    recipientName: text(raw["Recipient Name"]),
    recipientIdentifier: text(raw.recipient_id ?? raw.prime_award_recipient_id),
    uei: text(raw["Recipient UEI"]),
    duns: text(raw["Recipient DUNS Number"]),
    awardAmount: amount(raw["Award Amount"]),
    startDate: text(raw["Start Date"]),
    endDate: text(raw["End Date"]),
    baseObligationDate: text(raw["Base Obligation Date"]),
    lastModifiedDate: text(raw["Last Modified Date"]),
    awardType: text(raw["Contract Award Type"] ?? raw["Award Type"]),
    awardingAgency: text(raw["Awarding Agency"]),
    awardingAgencyCode: text(raw["Awarding Agency Code"]),
    awardingSubagency: text(raw["Awarding Sub Agency"]),
    awardingSubagencyCode: text(raw["Awarding Sub Agency Code"]),
    fundingAgency: text(raw["Funding Agency"]),
    fundingAgencyCode: text(raw["Funding Agency Code"]),
    fundingSubagency: text(raw["Funding Sub Agency"]),
    fundingSubagencyCode: text(raw["Funding Sub Agency Code"]),
    description: text(raw.Description),
    naics: text(raw.NAICS),
    psc: text(raw.PSC),
    placeOfPerformance: text(raw["Primary Place of Performance"]),
    recipientLocation: text(raw["Recipient Location"]),
    sourceProvider: "usaspending",
    sourceEndpoint: USASPENDING_SPENDING_BY_AWARD_URL,
    retrievedAt,
    rawRecord: raw,
  };
}

export function createAwardEvidence(award: NormalizedUSAspendingAward): Evidence {
  return {
    id: `evidence:usaspending:${sha256(award.id)}`,
    sourceId: "source:usaspending",
    sourceUrl: USASPENDING_SPENDING_BY_AWARD_URL,
    publicationDate: award.baseObligationDate ?? award.startDate,
    retrievedAt: award.retrievedAt,
    excerpt: award.description ?? `Official USAspending award record ${award.awardId ?? award.generatedInternalId ?? award.id}.`,
    payload: award.rawRecord,
    evidenceLevel: "CONFIRMED",
    confidence: 1,
    notes: "Confirms the award fields returned by the official API; does not confirm strategic importance or theme relevance.",
  };
}
