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
- `src/sources`: source registry, provider contract, isolated source adapters, and the
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

## V2 strategic signal layer

The V2 layer adds provider request economics, local durable history, a deterministic Radar, explicit intent resolution, physical-economy observations, SEC corporate confirmation, and evidence-bearing graph primitives. These extend the existing funnel, evidence, provider, and USAspending modules; they do not replace them.

The shared Intelligence Search route orchestrates providers independently and persists one snapshot after every completed investigation. SAM Contract Awards remains opt-in. EIA and Census run only when the investigation and evidence-backed mapping justify them. Company Intelligence combines official SEC identity/filing/fact data with bounded USAspending evidence and preserves unresolved supply-chain claims.

## V2.5 cross-jurisdiction and synthesis layer

`CrossJurisdictionProcurement` preserves USA/EU/UK jurisdiction, buyer, supplier, stage, classifications, value/currency, official identifiers, raw source payloads, and provenance. TED and Find a Tender normalize into that boundary before entering the common event graph. DIU and Blue UAS use bounded official-page parsers and never claim API access.

The synthesis engine is deterministic and emits `DERIVED_SIGNAL`. It separately states what is happening, why it matters, confirmed money by currency, ranked evidence-backed companies, source/jurisdiction breadth, confidence, acceleration, and evidence that would change the conclusion. It cannot upgrade inferred or candidate relationships to confirmed facts.

Radar V2 assigns each of 11 dimensions once. Provider diversity, geographic breadth, political disclosures, restrictions, corporate activity, research, demand, spending, trade, and durable acceleration therefore cannot be inflated by raw rows from a single provider. History remains append-only local storage; job definitions are scheduler-ready but no scheduler is claimed.

## Initial foundation constraints

There is no database, authentication, cloud resource, market model, or investment
recommendation. USAspending runtime data is held in an in-memory local store; raw payloads,
request parameters, HTTP status, retrieval time, and SHA-256 response hashes remain linked.
SAM Opportunities, SBIR/STTR, AFWERX, Grants.gov, and DARPA RSS are independent adapters.
Each retains source attribution and raw provenance while emitting the shared strategic
event contract. No adapter failure is converted into an empty successful result.

The graph already supports the future supply-chain path `Technology → Component → Material
→ Supplier → Company`. Source events attach editable deterministic taxonomy tags, but they
do not assert component or material dependencies without evidence.

## USAspending vertical slice

UI components send a typed internal query to a fixed local route. The server validates and
maps it to the official fixed endpoint; it is not an open proxy. Results pass through
normalization, strong-ID-first recipient resolution, deterministic deduplication, evidence
creation, conservative theme matching, funnel interpretation, and the existing scoring
engine. The raw record is retained beside every normalized award.
