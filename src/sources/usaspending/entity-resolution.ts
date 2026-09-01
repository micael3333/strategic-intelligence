import { sha256 } from "./hash";
import type { NormalizedUSAspendingAward, ResolvedRecipient } from "./types";

const normalizeName = (name: string) => name.toUpperCase().replace(/[^A-Z0-9]+/g, " ").trim();

export class RecipientEntityResolver {
  private readonly byIdentifier = new Map<string, ResolvedRecipient>();
  private readonly byName = new Map<string, ResolvedRecipient>();

  resolve(award: NormalizedUSAspendingAward): ResolvedRecipient {
    const identifiers = [award.uei && `uei:${award.uei}`, award.recipientIdentifier && `recipient:${award.recipientIdentifier}`, award.duns && `duns:${award.duns}`].filter(Boolean) as string[];
    for (const key of identifiers) {
      const existing = this.byIdentifier.get(key);
      if (existing) return existing;
    }

    const canonicalName = award.recipientName?.trim() || "Unknown recipient";
    const normalizedName = normalizeName(canonicalName);
    const aliasMatch = normalizedName ? this.byName.get(normalizedName) : undefined;
    if (aliasMatch) {
      for (const key of identifiers) this.byIdentifier.set(key, aliasMatch);
      return { ...aliasMatch, status: "RESOLVED_EXACT_ALIAS", explanation: "Exact normalized alias matched an entity already anchored by source identifiers." };
    }

    const strongest = award.uei ? `uei:${award.uei}` : award.recipientIdentifier ? `recipient:${award.recipientIdentifier}` : award.duns ? `duns:${award.duns}` : undefined;
    const resolved: ResolvedRecipient = {
      id: strongest ? `company:usaspending:${sha256(strongest)}` : `entity-review:${sha256(normalizedName || award.id)}`,
      canonicalName,
      aliases: [canonicalName],
      identifiers: { recipientId: award.recipientIdentifier, uei: award.uei, duns: award.duns },
      status: strongest ? "RESOLVED_STRONG_ID" : "ENTITY_REVIEW_REQUIRED",
      explanation: strongest
        ? `Resolved from authoritative USAspending ${award.uei ? "UEI" : award.recipientIdentifier ? "recipient identifier" : "DUNS"}.`
        : "No authoritative recipient identifier was returned; name similarity alone is insufficient to merge entities.",
    };
    for (const key of identifiers) this.byIdentifier.set(key, resolved);
    if (normalizedName && strongest) this.byName.set(normalizedName, resolved);
    return resolved;
  }
}
