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

## Phase 3 — Multi-source procurement intelligence (complete baseline)

Independent adapters now cover SAM Opportunities, SBIR/STTR API plus official dataset
fallback, the official AFWERX funding page, the keyless Grants.gov search API, and the
official DARPA opportunities RSS. Cross-source intelligence search uses
fault-isolated orchestration: a missing key, maintenance response, malformed record, or
parser failure cannot cancel USAspending or another provider.

Current funnel coverage is DARPA future-technology direction, Grants.gov early public
capital, SAM demand formation, SBIR/STTR early R&D, AFWERX dual-use opportunity signals,
and USAspending operational money.

## Engine V2 — Strategic signal graph and physical economy (complete baseline)

Implemented locally: request economics, bounded SAM planning, distinct SAM Contract Awards, EIA and Census adapters, SEC corporate confirmation, an export-control snapshot adapter, append-only history, graph assertion classes, deterministic Radar, intent resolution, Source Health, Company Intelligence, and the AllMarkets dashboard.

## Engine V2.5 — cross-jurisdiction synthesis (current)

Implemented locally: keyless EU TED and UK Find a Tender adapters; common cross-jurisdiction procurement records; bounded DIU and Blue UAS official-page adapters; House disclosure batch normalization and deterministic political-capital primitives; SEC filing/fact event monitoring through the existing adapter; export-control evidence activation; provenance-bearing graph edges; idempotent scheduler-ready ingestion definitions; an 11-dimension Radar; and an evidence-first intelligence brief above provider records.

No scheduler, deployment, distributed quota ledger, graph database, automatic House PDF extraction, or automatic export-control snapshot download is claimed. Live global and official-page calls remain explicit interactive options.

## Later phases

1. Recommended next: accumulate reviewed history using the idempotent jobs, then calibrate Radar dimensions against labeled investigations before any automated alerting.
2. Migrate history and request budgets to transactional shared storage and add a human entity/correlation review queue.
3. Build robust, versioned House PDF extraction and a reviewed issuer/asset mapping table.
4. Add DIU/Blue UAS parser monitoring against captured official-page fixtures and documented markup changes.
5. Add filing-text evidence extraction with citation spans, then component/material supplier research and hidden-supplier ranking.
