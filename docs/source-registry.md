# Source Registry

The code registry is authoritative for machine-readable Phase 1 configuration. Every
source records an official top-level URL, role, signals, funnel stages, access method,
credentials, reliability, implementation status, and limitations.

| Source | Primary role | Stages | Phase 1 state |
| --- | --- | --- | --- |
| DARPA | Strategic need and research direction | 0–2 | Skeleton |
| SAM.gov | Demand formation and notices | 1, 5 | Configuration required |
| SBIR / STTR | Early companies and R&D awards | 2, 3, 5 | API + dataset skeletons |
| AFWERX / SpaceWERX | Dual-use development and prototypes | 2–5 | Skeleton |
| DIU | Selection, validation, transition | 1, 3–6 | Skeleton |
| USAspending | Actual federal money | 5–7 | Implemented; live health requires a successful request |
| DoD announcements | Procurement and production context | 5–7 | Skeleton |
| SEC EDGAR | Public-company and filing validation | 7 | Configuration required |

The USAspending provider uses the official
`POST https://api.usaspending.gov/api/v2/search/spending_by_award/` contract. It returns
`HEALTHY` only after that endpoint answers successfully. Other Phase 1 providers make no
external check and cannot return healthy.
SAM requires `SAM_API_KEY`; SEC requires a fair-access `SEC_USER_AGENT` before a future
connection test may run.

Future-source records intentionally keep the official URL and access method blank/TBD. A
placeholder is not a claim that a stable API exists.

SBIR has two providers because availability and field coverage can differ between an API
and official downloadable data. Normalization will be shared only after fixtures prove the
contracts are equivalent.
