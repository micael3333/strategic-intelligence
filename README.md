# AllMarkets Intelligence Engine

Local-first foundation for tracing a strategic government problem through research,
demand formation, validation, procurement, production, and the industrial supply chain.

## Run locally

```bash
npm install
npm run dev
```

Open `http://localhost:3000`. Run the deterministic engine tests with `npm test`.

Phase 2 adds an audited USAspending pipeline. Open `/awards` to run a bounded server-side search against the official public API.

Engine V2 adds an evidence-backed Radar, provider request economics, append-only local history, Company Intelligence through SEC EDGAR plus USAspending, and physical-economy adapters for EIA and Census trade. Open `/` for Radar, `/intelligence` for problem-first search, `/companies` for issuer investigation, and `/sources` for stored or explicitly refreshed provider health.

Credentials remain server-side in `.env.local`. Loading the dashboard does not automatically spend scarce SAM Contract Awards quota. No scheduler, deployment, or distributed database is claimed.
