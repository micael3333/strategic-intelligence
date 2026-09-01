# Development Roadmap

## Phase 1 — Foundation (current)

Domain graph, funnel, evidence rules, scoring, source registry, provider boundaries,
GNSS-denied taxonomy, local navigation, and deterministic tests.

## Recommended Phase 2 — One audited vertical slice

Implement one public, credential-free provider end to end—recommended: USAspending—using
documented requests, saved raw fixtures, normalization, provenance, retries, and a local
ingestion command. In parallel, add an entity-resolution boundary for recipient names and
external award IDs. Then trace one real GNSS-denied strategic need through only the stages
supported by collected primary evidence; leave gaps explicit.

Acceptance criteria should require: a real connection test, reproducible fixture tests,
raw-to-normalized audit trail, deduplication, provider failure isolation, and UI rendering
of the supporting events behind a stage and score.

## Later phases

1. SAM and SBIR API/dataset providers plus solicitation-to-award linkage.
2. DARPA, DIU, AFWERX, and DoD announcement extraction with human review queues.
3. Persistent graph storage, ingestion jobs, observations, and entity resolution.
4. SEC/company mapping and evidence-backed financial fields.
5. Component/material supplier research and hidden-supplier ranking.
6. Execution-risk scoring only after coverage and validation thresholds are defined.
