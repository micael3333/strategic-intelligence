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
- `src/sources`: source registry, provider contract, provider skeletons, and health states.
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

There is no database, authentication, cloud resource, live API ingestion, market model,
or investment recommendation. Provider adapters are deliberately non-operational.
