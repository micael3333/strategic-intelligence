# Scoring Model

## Principles

Scores are independent, transparent, capped at 100, and return factors, explanations, and
evidence references. Weights live only in `src/config/scoring.ts`.

## Strategic Signal Score

Each strategic event has a central base weight. The strongest evidence attached to the
event applies a visible multiplier: confirmed 1.00, probable 0.78, inferred 0.45, and
speculative 0.15. All contributions are returned; the total is capped at 100.

This score answers “how strong is the strategic signal?” It does not answer whether the
company is investable or the evidence graph is complete.

## Acceleration Score

Acceleration uses period change and breadth:

- award-count growth;
- award-value growth;
- new agency customers;
- agency and program breadth;
- prime-contractor relationships;
- improvement in time between awards.

Growth signals saturate so a single extreme ratio cannot dominate. Largest award is stored
for context but intentionally does not directly add points in Phase 1.

## Evidence Confidence

Each evidence level maps to a strength value, multiplied by record confidence. The score is
the average across records. AI-labeled confirmed evidence is treated as inferred.

## Execution / Investment Risk

The contract is prepared but returns `NOT_IMPLEMENTED`. It must wait for modeled evidence
on delivery, customer concentration, cash, debt, capital requirements, and dilution.
