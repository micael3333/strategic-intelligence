# Evidence Model

Evidence is attached to every strategic claim and relationship. A record contains source
ID, optional source URL and publication date, retrieval time, an excerpt or structured
payload, evidence level, confidence, notes, and an AI-generation flag.

## Levels

- **CONFIRMED**: a primary or highly authoritative source directly supports the claim.
- **PROBABLE**: multiple credible public sources converge strongly.
- **INFERRED**: a technical or logical inference is not directly proven.
- **SPECULATIVE**: a research hypothesis only.

`validateEvidence` enforces required provenance, a 0–1 confidence range, and payload or
excerpt support. It rejects AI-generated confirmed evidence. Defensive downstream logic
also downgrades such a record to inferred if an invalid record bypasses validation.

An evidence level describes support for one claim, not the general reputation of an entity.
Primary-source authority does not make an unrelated inference confirmed.
