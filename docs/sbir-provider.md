# SBIR / STTR Provider

SBIR/STTR identifies companies funded early to test feasibility and develop technology.
The provider implements the documented official Awards, Company, and
Solicitation/Topics interfaces at `/public/api/awards`, `/public/api/firm`, and
`/public/api/solicitations`. It explicitly recognizes the maintenance state published by
SBIR.gov.

When `SBIR_DATASET_PATH` points to an official downloaded JSON or CSV file, an API failure
falls back to that local dataset and reports dataset/degraded mode, never a false healthy
API. Large files belong under `.data/sbir/`, which is ignored by Git. XLS/XLSX should
currently be exported from the official source to CSV or JSON before ingestion.

Normalization preserves firm, UEI, historical DUNS, title, agency/branch, phase, program,
tracking and contract numbers, dates, solicitation/topic identifiers, amount, URLs,
keywords, abstract, raw record, ingestion mode, retrieval time, and raw hash. Phase I is
early feasibility evidence and Phase II is deeper development/prototype funding; neither
proves successful validation or operational procurement.
