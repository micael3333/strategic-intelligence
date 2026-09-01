import type { Evidence, EvidenceLevel } from "./models";

const LEVEL_RANK: Record<EvidenceLevel, number> = {
  SPECULATIVE: 0,
  INFERRED: 1,
  PROBABLE: 2,
  CONFIRMED: 3,
};

export function validateEvidence(evidence: Evidence): string[] {
  const errors: string[] = [];
  if (!evidence.sourceId.trim()) errors.push("sourceId is required");
  if (!evidence.retrievedAt.trim()) errors.push("retrievedAt is required");
  if (evidence.confidence < 0 || evidence.confidence > 1) {
    errors.push("confidence must be between 0 and 1");
  }
  if (!evidence.excerpt && !evidence.payload) {
    errors.push("excerpt or structured payload is required");
  }
  if (evidence.generatedByAi && evidence.evidenceLevel === "CONFIRMED") {
    errors.push("AI-generated evidence cannot be CONFIRMED");
  }
  return errors;
}

export function effectiveEvidenceLevel(evidence: Evidence): EvidenceLevel {
  if (evidence.generatedByAi && evidence.evidenceLevel === "CONFIRMED") return "INFERRED";
  return evidence.evidenceLevel;
}

export function strongestEvidenceLevel(evidence: Evidence[]): EvidenceLevel | null {
  if (!evidence.length) return null;
  return evidence
    .map(effectiveEvidenceLevel)
    .sort((a, b) => LEVEL_RANK[b] - LEVEL_RANK[a])[0];
}

export function evidenceLevelRank(level: EvidenceLevel): number {
  return LEVEL_RANK[level];
}
