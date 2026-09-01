import { GNSS_DENIED_THEME } from "@/config/themes";
import { GNSS_DENIED_SEARCH_TERMS } from "./query";
import type { NormalizedUSAspendingAward, ThemeMatch } from "./types";

const normalize = (value: string) => value.toLowerCase().replace(/[‐‑‒–—-]/g, " ").replace(/[^a-z0-9]+/g, " ").trim();
const specificTerms = new Set(["gnss denied", "gps denied", "resilient pnt", "electronic warfare navigation"]);

export function matchGnssDeniedTheme(award: NormalizedUSAspendingAward): ThemeMatch | null {
  const searchable = normalize([award.description, award.awardId, award.naics, award.psc].filter(Boolean).join(" "));
  if (!searchable) return null;
  const matchedTerms = GNSS_DENIED_SEARCH_TERMS.filter((term) => searchable.includes(normalize(term)));
  if (!matchedTerms.length) return null;
  const highSpecificity = matchedTerms.some((term) => specificTerms.has(normalize(term)));
  return {
    themeId: GNSS_DENIED_THEME.id,
    themeName: GNSS_DENIED_THEME.name,
    matchedTerms: [...new Set(matchedTerms.map(normalize))],
    evidenceLevel: highSpecificity ? "PROBABLE" : "INFERRED",
    explanation: highSpecificity
      ? "The official award text contains a high-specificity theme phrase; relevance is probable, not automatically confirmed."
      : "The official award text contains a broader navigation/autonomy term; this is a candidate signal requiring review.",
  };
}
