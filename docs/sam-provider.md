# SAM.gov Opportunities Provider

SAM answers what the government is looking for before operational money appears. The
adapter uses only `GET https://api.sam.gov/opportunities/v2/search`.

`SAM_API_KEY` is required and read only on the server. If absent, health is `AUTH_REQUIRED`;
no request is attempted and other providers continue normally. Search dates use the
official `MM/dd/yyyy` mapping and enforce the one-year maximum range.

The adapter supports Sources Sought (`r`), Presolicitation (`p`), Solicitation (`o`),
Combined Synopsis/Solicitation (`k`), Special Notice (`s`), and Award Notice (`a`). It
preserves raw opportunity data, query parameters, endpoint, retrieval time, HTTP status,
and response hash. Duplicate notice IDs are blocked.

An official notice's existence is confirmed evidence. Sources Sought maps to demand
exploration, presolicitation to demand formation, solicitation/combined notices to active
demand, and Award Notice to later procurement evidence. No SAM notice alone proves
validation, production, or scale.
