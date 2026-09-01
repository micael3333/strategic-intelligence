# USAspending Provider

## Official authority

- API documentation: <https://api.usaspending.gov/docs/endpoints>
- Official contract: <https://github.com/fedspendingtransparency/usaspending-api/blob/master/usaspending_api/api_contracts/contracts/v2/search/spending_by_award.md>
- Endpoint: `POST https://api.usaspending.gov/api/v2/search/spending_by_award/`

No authentication is required. The provider never accepts an arbitrary upstream URL.

## Internal query mapping

The UI sends `USAspendingSearchQuery`: dates, keywords, agency, recipient text, amount
bounds, award codes, NAICS, PSC, page, limit, sort, and order. The server validates dates,
non-negative amounts, supported codes, string lengths, page size (maximum 50), and body
size. It then maps to `time_period`, `keywords`, top-tier awarding `agencies`,
`recipient_search_text`, `award_amounts`, `naics_codes.require`, `psc_codes`, and the
required `award_type_codes`. Default contract codes are `A`, `B`, `C`, and `D`.
The date range uses the official `new_awards_only` date type so a search window represents
base awards rather than old awards with a recent transaction or modification.

## Provenance and normalization

Each request records the fixed endpoint, exact upstream parameters, retrieval time, HTTP
status, full raw response, and a deterministic SHA-256 hash. Each normalized award retains
its raw record. Missing API fields remain absent; they are never synthesized.

Normalized fields include official award/generated IDs, recipient ID/UEI/DUNS, amount,
dates, award type, awarding/funding agency and subagency, description, NAICS, PSC, place of
performance, retrieval time, and provider.

## Evidence and theme rules

Returned award existence, amount, recipient, agency, and dates are `CONFIRMED` when present
in the official response. That evidence does not confirm strategic importance. An exact
high-specificity GNSS/GPS-denied phrase yields `PROBABLE` theme relevance; broader autonomy
or navigation terms yield `INFERRED`. Both remain candidate signals for review.

## Entity resolution and deduplication

Resolution prioritizes UEI, USAspending recipient ID, then DUNS. Exact normalized aliases
may match only an entity already anchored by a strong identifier. Name-only records become
`ENTITY_REVIEW_REQUIRED`; fuzzy names never merge automatically.

Deterministic award keys prefer `generated_internal_id`, then Award ID. A fallback review
key is used only when neither is returned. Re-ingestion records a duplicate but does not add
another award or strategic event to the runtime store.

## Funnel and acceleration

A single award stays `PROCUREMENT_EVENT` with no automatic stage. Repeat confirmed awards
for one resolved recipient may support Stage 5. Stage 6 additionally requires at least
three dated awards spanning a year and explicit production/manufacturing language. The
provider never assigns Stage 7 by itself.

Acceleration compares the latest 12 months with the previous 12 months for counts, values,
largest award, agency breadth, new customers, and cadence. The adoption label requires at
least two current awards, one prior award, and at least 1.5× growth in both count and value.
The independent transparent score still reports breadth, customer, and cadence factors.

## Testing

```bash
npm test
npm run test:integration
```

Unit tests use explicitly labeled sanitized fixtures and never require network access. The
integration tests perform bounded real DoD searches for Honeywell International Inc. and
Lockheed Martin, including normalization, UEI resolution, recipient intelligence, and all
three frozen Phase 2 score outputs. Runtime state is in memory;
restarting the Next.js process clears loaded awards and recipient panels.
