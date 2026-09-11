# Source Registry

The code registry is authoritative for machine-readable source configuration. Every
source records an official top-level URL, role, signals, funnel stages, access method,
credentials, reliability, implementation status, and limitations.

| Source | Primary role | Stages | Current state |
| --- | --- | --- | --- |
| DARPA | Strategic need and research direction | 0–2 | Official opportunities RSS adapter |
| Grants.gov | Early public-capital opportunities | 1–2 | Official keyless API adapter |
| SAM.gov | Demand formation and notices | 1, 5 | Official API adapter; key required |
| SAM Contract Awards | Detailed award and IDV records | 5–7 | Implemented, explicit use, cached and budgeted |
| SBIR / STTR | Early companies and R&D awards | 2, 3, 5 | API maintenance-aware + configured dataset fallback |
| AFWERX / SpaceWERX | Dual-use opportunity signals | 2–3 | Official-web adapter; healthy only after successful parsing |
| DIU | Selection, validation, transition | 1, 3–6 | Bounded official-page adapter; no API claimed |
| USAspending | Actual federal money | 5–7 | Implemented; live health requires a successful request |
| DoD announcements | Procurement and production context | 5–7 | Skeleton |
| SEC EDGAR | Public-company and filing validation | 7 | Implemented; no key, bounded fair-access cadence |
| EIA | Physical energy observations | — | Implemented metadata plus electricity/nuclear presets |
| Census International Trade | Monthly product/country trade | — | Implemented behind explicit HS mappings |
| ITA Consolidated Screening List | Export-control constraint evidence | — | Adapter implemented; local official snapshot required |
| TED Search API v3 | EU notices and awards | 1, 5–7 | Implemented keyless, bounded API adapter |
| UK Find a Tender | UK planning, tender, and award releases | 1, 5–7 | Implemented keyless OCDS adapter |
| Blue UAS / DCMA Blue List | Approved platforms and components | 4–6 | Bounded official-page adapter; successor-list limitations explicit |
| U.S. House Financial Disclosures | Public transaction disclosures | — | Official batch normalizer; no REST API claimed |

The USAspending provider uses the official
`POST https://api.usaspending.gov/api/v2/search/spending_by_award/` contract. It returns
`HEALTHY` only after that endpoint answers successfully. SAM, SBIR, and AFWERX perform
provider-specific checks without affecting USAspending or one another. Grants.gov uses the
official keyless `POST /v1/api/search2` interface. DARPA uses the official opportunities RSS;
it is explicitly recorded as `ingestionMethod = RSS` and is not described as an API.
SAM requires `SAM_API_KEY`; EIA and Census use server-side credentials. SEC uses a descriptive
server-side User-Agent and does not require an API key.

Future-source records intentionally keep the official URL and access method blank/TBD. A
placeholder is not a claim that a stable API exists.

SBIR keeps API and dataset ingestion as modes behind one provider because availability and
field coverage differ. Both feed the same normalized award contract. AFWERX does not claim
an API: it rate-limits and caches the official funding page and reports parser failure as
provider-specific unavailability.

SAM Opportunities is the demand-intent signal. SAM Contract Awards is a separate, scarce,
explicitly invoked provider for detailed procurement records. USAspending remains the broader
historical capital-deployment source. The three families are not merged or described as interchangeable.

TED and Find a Tender extend the same procurement abstraction without erasing jurisdiction or currency. They are explicit opt-ins in interactive intelligence search. DIU and Blue UAS are also explicit cached official-page workflows. Source Health lists all four even before a live check, using `PARTIAL` rather than implying a successful connection.
