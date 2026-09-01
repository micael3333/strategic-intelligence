# Development Roadmap

## Phase 1 — Foundation (current)

Domain graph, funnel, evidence rules, scoring, source registry, provider boundaries,
GNSS-denied taxonomy, local navigation, and deterministic tests.

## Phase 2 — One audited vertical slice (current)

USAspending is implemented with documented requests, sanitized fixtures, normalization,
provenance, strong-ID-first entity resolution, idempotent ingestion, server routes, an
award search UI, recipient intelligence, and a separate live integration test.

Acceptance criteria should require: a real connection test, reproducible fixture tests,
raw-to-normalized audit trail, deduplication, provider failure isolation, and UI rendering
of the supporting events behind a stage and score.

## Later phases

1. Recommended Phase 3: add durable local persistence and raw-payload retention, then
   implement award-detail/transaction history so modifications and repeat-award patterns
   can be distinguished reliably.
2. SAM and SBIR API/dataset providers plus solicitation-to-award linkage.
3. DARPA, DIU, AFWERX, and DoD announcement extraction with human review queues.
4. Persistent graph ingestion jobs and cross-source entity resolution.
5. SEC/company mapping and evidence-backed financial fields.
6. Component/material supplier research and hidden-supplier ranking.
