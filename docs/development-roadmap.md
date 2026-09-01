# Development Roadmap

## Phase 1 — Foundation (complete)

Domain graph, funnel, evidence rules, scoring, source registry, provider boundaries,
GNSS-denied taxonomy, local navigation, and deterministic tests.

## Phase 2 — One audited vertical slice (recovered and frozen)

USAspending is implemented with documented requests, sanitized fixtures, normalization,
provenance, strong-ID-first entity resolution, idempotent ingestion, server routes, an
award search UI, recipient intelligence, and a separate live integration test.

Acceptance criteria should require: a real connection test, reproducible fixture tests,
raw-to-normalized audit trail, deduplication, provider failure isolation, and UI rendering
of the supporting events behind a stage and score.

Phase 2 recovery was verified against live Honeywell International and Lockheed Martin
Department of Defense searches. Strategic Signal, Acceleration, and Evidence Confidence
remain exactly as committed in `e42f814`; multi-source evidence does not reweight them.

## Phase 3 — Multi-source procurement intelligence (current)

Independent adapters now cover SAM Opportunities, SBIR/STTR API plus official dataset
fallback, and the official AFWERX funding page. Cross-source intelligence search uses
fault-isolated orchestration: a missing key, maintenance response, malformed record, or
parser failure cannot cancel USAspending or another provider.

Current funnel coverage is SAM demand formation, SBIR/STTR early R&D, AFWERX dual-use
opportunity signals, and USAspending operational money.

## Later phases

1. Recommended next: durable local persistence, raw payload cache, provider retrieval jobs,
   and a human entity/correlation review queue.
2. DIU for prototype/validation transitions and Blue UAS for platform/component validation.
3. DARPA and DoD industrial announcements.
4. SEC/company mapping and evidence-backed financial fields.
5. Component/material supplier research and hidden-supplier ranking.
