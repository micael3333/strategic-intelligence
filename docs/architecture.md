# Architecture

## Purpose

Strategic Intelligence is a problem-first evidence graph. It is designed to trace a
government mission gap through demand formation, R&D, company selection, validation,
procurement, production, scaling, and then down into systems, components, materials,
suppliers, companies, and financial evidence.

## Module boundaries

- `src/domain`: stable entities, relationships, evidence rules, funnel calculation,
  transparent scores, and future hidden-supplier inputs.
- `src/config`: centralized scoring weights and reusable technology taxonomies.
- `src/sources`: source registry, provider contract, provider skeletons, and the isolated
  `usaspending` raw → normalized → resolved → interpreted pipeline.
- `src/app`: read-only local working surface for navigating the foundation.

The domain does not import the UI or any provider. A failed source adapter therefore
cannot break scoring or erase already-normalized facts. Providers return raw records and
normalized events separately so provenance and transformations remain auditable.

## Stable identity and entity resolution

Every entity has a stable internal ID, canonical name, and aliases. External identifiers
(CIK, UEI, ticker, award number) remain optional and are never invented. Entity resolution
will be its own later service; source-specific names must not silently become canonical.

## Graph and provenance

Relationships are typed edges with evidence arrays. Technology decomposition uses the
same graph rather than a separate ontology. This allows a `USES_COMPONENT` edge and its
evidence to be examined, upgraded, or rejected independently of the entities it joins.

## Phase 1 constraints

There is no database, authentication, cloud resource, market model, or investment
recommendation. USAspending runtime data is held in an in-memory local store; raw payloads,
request parameters, HTTP status, retrieval time, and SHA-256 response hashes remain linked.
All other provider adapters remain deliberately non-operational.

## USAspending vertical slice

UI components send a typed internal query to a fixed local route. The server validates and
maps it to the official fixed endpoint; it is not an open proxy. Results pass through
normalization, strong-ID-first recipient resolution, deterministic deduplication, evidence
creation, conservative theme matching, funnel interpretation, and the existing scoring
engine. The raw record is retained beside every normalized award.
