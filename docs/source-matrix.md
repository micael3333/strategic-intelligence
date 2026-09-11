# V2.5 source matrix

This matrix describes what each official source can establish. A provider response is evidence from that source; cross-source interpretation remains a deterministic `DERIVED_SIGNAL` until the underlying relationship itself is directly supported.

| Source | What it tells us | Jurisdiction | Access / credentials | Request economics and freshness | Intelligence role |
| --- | --- | --- | --- | --- | --- |
| SAM Opportunities | Demand formation and notices | USA | API key | Cached; scarce requests planned and bounded | RFI, Sources Sought, solicitation |
| USAspending | Federal obligations and awards | USA | Keyless API | Bounded search windows | Operational money |
| SAM Contract Awards | Detailed awards and IDVs | USA | API key | Explicit opt-in; small daily budget | Award/production detail |
| TED Search API v3 | Published EU notices and awards | EU | Keyless API | 30-minute cache; max 50 interactive records | Cross-jurisdiction demand and awards |
| Find a Tender OCDS | UK release packages | UK | Keyless API | 30-minute cache; cursor/window based; max 50 interactive records | UK planning, tender, and award evidence |
| DARPA / Grants / SBIR / AFWERX | Research priorities and early capital | USA | Mixed keyless/API/dataset/official web | Provider-specific cache and isolation | Upstream R&D and transition |
| DIU | Open solicitations, selections, transitions | USA | Bounded official web; no API claimed | 6-hour cache; one-page request | Commercial-to-prototype bridge |
| Blue UAS / DCMA Blue List | Current approved platforms/components | USA | Bounded official web; no API claimed | 24-hour cache; one-page request | Validation / approved-technology evidence |
| SEC EDGAR | Issuer identity, filings, structured facts | USA | Keyless with descriptive User-Agent | Fair-access interval and cache | Corporate event confirmation |
| Census Trade / EIA | Physical trade and energy observations | USA/global | Server-side API keys | Only after explicit mappings/presets | Physical-economy confirmation |
| ITA Consolidated Screening List | Appearance on an official restriction list | USA/global | Official downloadable dataset | Explicit local snapshot refresh | Restriction evidence, not a conduct conclusion |
| House Financial Disclosures | Public filing transactions in reported value ranges | USA | Official PDFs/batches; no REST API claimed | Manual/batch, idempotent normalization | Political-capital research signal |

EU, UK, USA, and global records share `CrossJurisdictionProcurement` and `CrossSourceStrategicEvent` contracts while retaining jurisdiction, currency, official record identifier, raw payload, and provenance hash. Currency totals are never converted or combined without an explicit conversion model.
