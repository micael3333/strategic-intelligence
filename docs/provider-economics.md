# Provider economics

All external access is server-side and fault-isolated. `src/config/provider-economics.ts` is the single policy surface for TTLs, concurrency, cooldowns, and scarce-provider budgets. `RequestController` normalizes cache keys, deduplicates in-flight work, bounds concurrency, and converts repeated 429 responses into an explicit cooldown.

SAM Opportunities may use at most two high-information single-term requests per investigation. Taxonomy expansion is local; it is not translated into one request per synonym. SAM Contract Awards is separate from Opportunities and USAspending, is called only after an explicit user choice, is cached for 24 hours, and has a conservative three-request process-local daily budget.

Provider health reads stored checks by default. Loading a page does not spend provider quota. The Source Health action performs a bounded live check and records the result. A successful response with no matches is represented as `WORKING` with zero records; `RATE_LIMITED`, `BUDGET_EXHAUSTED`, authentication failures, and upstream failures remain distinct.

The process-local controller is not a distributed quota ledger. A future multi-instance deployment must move budget and cooldown state into shared durable storage before increasing traffic.
