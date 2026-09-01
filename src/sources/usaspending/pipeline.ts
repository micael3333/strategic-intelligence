import { awardDeduplicationKey, createAwardEvidence, normalizeAward } from "./normalize";
import { createProcurementEvent, createStrategicEvents, interpretProcurementFunnel } from "./funnel";
import { matchGnssDeniedTheme } from "./theme";
import { USAspendingProvider } from "./provider";
import { usaspendingStore, type USAspendingRuntimeStore } from "./store";
import type { NormalizedUSAspendingAward, ProcessedUSAspendingAward, USAspendingSearchQuery, USAspendingSearchResult } from "./types";

export class USAspendingPipeline {
  constructor(
    private readonly provider = new USAspendingProvider(),
    private readonly store: USAspendingRuntimeStore = usaspendingStore,
  ) {}

  async searchAndIngest(query: USAspendingSearchQuery): Promise<USAspendingSearchResult> {
    const provenance = await this.provider.searchAwards(query);
    const normalized = provenance.rawResponse.results.map((raw) => normalizeAward(raw, provenance.retrievedAt));
    const recipients = normalized.map((award) => this.store.resolver.resolve(award));
    const batchByRecipient = new Map<string, NormalizedUSAspendingAward[]>();
    recipients.forEach((recipient, index) => {
      const list = batchByRecipient.get(recipient.id) ?? [];
      if (!list.some((item) => item.id === normalized[index].id)) list.push(normalized[index]);
      batchByRecipient.set(recipient.id, list);
    });

    const awards: ProcessedUSAspendingAward[] = normalized.map((award, index) => {
      const recipient = recipients[index];
      const existing = this.store.normalizedAwardsForRecipient(recipient.id);
      const history = [...existing, ...(batchByRecipient.get(recipient.id) ?? [])].filter((item, itemIndex, items) => items.findIndex((candidate) => candidate.id === item.id) === itemIndex);
      const evidence = createAwardEvidence(award);
      const funnel = interpretProcurementFunnel(award, history);
      const deduplication = this.store.deduplicator.checkAndAdd(awardDeduplicationKey(award.rawRecord));
      return {
        raw: award.rawRecord,
        normalized: award,
        recipient,
        evidence,
        themeMatch: matchGnssDeniedTheme(award),
        funnel,
        procurementEvent: createProcurementEvent(award, recipient, evidence, funnel),
        strategicEvents: createStrategicEvents(award, recipient, evidence, funnel),
        deduplication,
      };
    });

    this.store.saveProvenance(provenance);
    awards.forEach((award) => this.store.saveAward(award));
    const recipientIds = new Set(awards.filter((award) => award.recipient.status !== "ENTITY_REVIEW_REQUIRED").map((award) => award.recipient.id));
    return {
      query,
      provenance,
      awards,
      summary: {
        rawAwardCount: awards.length,
        newAwardCount: awards.filter((award) => !award.deduplication.isDuplicate).length,
        duplicateCount: awards.filter((award) => award.deduplication.isDuplicate).length,
        resolvedRecipientCount: recipientIds.size,
        reviewRequiredCount: awards.filter((award) => award.recipient.status === "ENTITY_REVIEW_REQUIRED").length,
        candidateSignalCount: awards.filter((award) => award.themeMatch !== null).length,
      },
    };
  }
}
