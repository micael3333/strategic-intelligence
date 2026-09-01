# DARPA Opportunities Provider

The provider reads DARPA's official opportunities feed at
`https://www.darpa.mil/rss/opportunities.xml`. RSS is the ingestion method and is never
represented as an API. Items retain their title, description, publication date, original
URL, feed hash, retrieval time, and source attribution.

Feed items are deduplicated by GUID, then original URL, then title. They normalize as
upstream R&D/future-technology signals at funnel stage 2. A feed transport or parsing
failure is isolated and reported as an upstream error; it is not interpreted as zero
opportunities. Program pages not present in the feed remain a later enrichment path.
