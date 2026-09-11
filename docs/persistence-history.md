# Persistence and history

V2 uses the smallest durable local architecture compatible with the current repository: append-only JSON Lines at `.data/intelligence-history.jsonl`. The directory is ignored by Git. Each record is either an intelligence snapshot or a provider-health snapshot.

An intelligence snapshot retains the query key, investigation dimension, technology cluster, retrieval time, first/last seen timestamps, provider outcomes, normalized events, physical-energy observations, trade observations, and evidence-backed graph edges. The Radar reads this history; it never invents a historical baseline. Acceleration remains `INSUFFICIENT_HISTORY` until at least two comparable snapshots span 24 hours, then compares unique evidence counts.

Writes are serialized inside the process. The format is inspectable and recoverable from a malformed line, but it is not a multi-process database. Before deploying multiple instances, migrate the same record contract to transactional storage with uniqueness constraints on snapshot and evidence IDs.

`src/jobs/ingestion.ts` defines a bounded, sequential, failure-isolated ingestion job contract and a small controlled theme list. No scheduler, cron job, or background worker is claimed. A later deployment should bind that job to an environment-owned scheduler and the shared intelligence executor, with distributed provider budgets and idempotency.
