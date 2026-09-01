import { calculateEvidenceConfidence, calculateStrategicSignal } from "@/domain/scoring";
import type { ProviderHealth } from "../provider";
import { AwardDeduplicator } from "./deduplication";
import { RecipientEntityResolver } from "./entity-resolution";
import { calculateRecipientAcceleration } from "./acceleration";
import type { ProcessedUSAspendingAward, RequestProvenance, ResolvedRecipient } from "./types";

export interface RecipientIntelligence {
  recipient: ResolvedRecipient;
  awards: ProcessedUSAspendingAward[];
  totalAwardValue: number;
  awardCount: number;
  agencies: string[];
  strategicSignal: ReturnType<typeof calculateStrategicSignal>;
  acceleration: ReturnType<typeof calculateRecipientAcceleration>;
  evidenceConfidence: ReturnType<typeof calculateEvidenceConfidence>;
}

export class USAspendingRuntimeStore {
  readonly deduplicator = new AwardDeduplicator();
  readonly resolver = new RecipientEntityResolver();
  private readonly awards = new Map<string, ProcessedUSAspendingAward>();
  private readonly provenances = new Map<string, RequestProvenance>();
  providerHealth: ProviderHealth | null = null;
  lastSuccessfulRequest: string | null = null;

  saveProvenance(provenance: RequestProvenance): void {
    this.provenances.set(provenance.responseHash, provenance);
    this.lastSuccessfulRequest = provenance.retrievedAt;
  }

  saveAward(award: ProcessedUSAspendingAward): void {
    if (!award.deduplication.isDuplicate) this.awards.set(award.normalized.id, award);
  }

  awardsForRecipient(recipientId: string): ProcessedUSAspendingAward[] {
    return [...this.awards.values()].filter((award) => award.recipient.id === recipientId);
  }

  normalizedAwardsForRecipient(recipientId: string) {
    return this.awardsForRecipient(recipientId).map((award) => award.normalized);
  }

  recipientIntelligence(recipientId: string, asOf = new Date()): RecipientIntelligence | null {
    const awards = this.awardsForRecipient(recipientId);
    if (!awards.length) return null;
    const recipient = awards[0].recipient;
    return {
      recipient,
      awards: [...awards].sort((a, b) => (b.normalized.startDate ?? "").localeCompare(a.normalized.startDate ?? "")),
      totalAwardValue: awards.reduce((sum, award) => sum + (award.normalized.awardAmount ?? 0), 0),
      awardCount: awards.length,
      agencies: [...new Set(awards.map((award) => award.normalized.awardingAgency).filter(Boolean) as string[])],
      strategicSignal: calculateStrategicSignal(awards.flatMap((award) => award.strategicEvents)),
      acceleration: calculateRecipientAcceleration(awards.map((award) => award.normalized), asOf),
      evidenceConfidence: calculateEvidenceConfidence(awards.map((award) => award.evidence)),
    };
  }

  stats() {
    const awards = [...this.awards.values()];
    const recipientIds = new Set(awards.map((award) => award.recipient.id));
    return {
      providerHealth: this.providerHealth,
      lastSuccessfulRequest: this.lastSuccessfulRequest,
      realAwardsLoaded: awards.length,
      resolvedRecipients: new Set(awards.filter((award) => award.recipient.status !== "ENTITY_REVIEW_REQUIRED").map((award) => award.recipient.id)).size,
      reviewRequiredRecipients: new Set(awards.filter((award) => award.recipient.status === "ENTITY_REVIEW_REQUIRED").map((award) => award.recipient.id)).size,
      candidateStrategicSignals: awards.filter((award) => award.themeMatch !== null).length,
      accelerationSignals: [...recipientIds].filter((id) => this.recipientIntelligence(id)?.acceleration.label === "ACCELERATING GOVERNMENT ADOPTION").length,
      provenanceRecords: this.provenances.size,
    };
  }
}

const globalStore = globalThis as typeof globalThis & { __usaspendingRuntimeStore?: USAspendingRuntimeStore };
export const usaspendingStore = globalStore.__usaspendingRuntimeStore ??= new USAspendingRuntimeStore();
