# Grants.gov Provider

The provider uses the official, keyless `POST https://api.grants.gov/v1/api/search2`
endpoint. It treats results as grant opportunities—early public-capital intent—not as
evidence that money was awarded. Records retain the opportunity identifier, number,
agency, dates, status, document type, Assistance Listing numbers, raw payload, retrieval
time, and response hash.

The adapter emits `sourceFamily = GRANTS_GOV`, `ingestionMethod = API`, and `sourceType =
GRANT`. HTTP, network, invalid-JSON, and malformed-response failures remain provider errors;
only a valid response with no hits becomes `EMPTY`.
