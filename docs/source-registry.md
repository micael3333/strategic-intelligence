# Source Registry

The code registry is authoritative for machine-readable Phase 1 configuration. Every
source records an official top-level URL, role, signals, funnel stages, access method,
credentials, reliability, implementation status, and limitations.

| Source | Primary role | Stages | Phase 1 state |
| --- | --- | --- | --- |
| DARPA | Strategic need and research direction | 0–2 | Official opportunities RSS adapter |
| Grants.gov | Early public-capital opportunities | 1–2 | Official keyless API adapter |
| SAM.gov | Demand formation and notices | 1, 5 | Official API adapter; key required |
| SBIR / STTR | Early companies and R&D awards | 2, 3, 5 | API maintenance-aware + configured dataset fallback |
| AFWERX / SpaceWERX | Dual-use opportunity signals | 2–3 | Official-web adapter; healthy only after successful parsing |
| DIU | Selection, validation, transition | 1, 3–6 | Skeleton |
| USAspending | Actual federal money | 5–7 | Implemented; live health requires a successful request |
| DoD announcements | Procurement and production context | 5–7 | Skeleton |
| SEC EDGAR | Public-company and filing validation | 7 | Configuration required |

The USAspending provider uses the official
`POST https://api.usaspending.gov/api/v2/search/spending_by_award/` contract. It returns
`HEALTHY` only after that endpoint answers successfully. SAM, SBIR, and AFWERX perform
provider-specific checks without affecting USAspending or one another. Grants.gov uses the
official keyless `POST /v1/api/search2` interface. DARPA uses the official opportunities RSS;
it is explicitly recorded as `ingestionMethod = RSS` and is not described as an API.
SAM requires `SAM_API_KEY`; SEC requires a fair-access `SEC_USER_AGENT` before a future
connection test may run.

Future-source records intentionally keep the official URL and access method blank/TBD. A
placeholder is not a claim that a stable API exists.

SBIR keeps API and dataset ingestion as modes behind one provider because availability and
field coverage differ. Both feed the same normalized award contract. AFWERX does not claim
an API: it rate-limits and caches the official funding page and reports parser failure as
provider-specific unavailability.

SAM Opportunities is the implemented demand signal. A separate SAM contract-awards data
path is not implemented; SAM award notices can appear in the opportunities response, while
USAspending remains the authoritative implemented capital-deployment path.
