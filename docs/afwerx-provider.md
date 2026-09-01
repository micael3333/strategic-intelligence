# AFWERX / DAF Opportunity Provider

No AFWERX API is assumed. The adapter retrieves only
`https://afwerx.com/get-funded/`, applies a deterministic anchor-and-date parser, caches
raw HTML for 15 minutes in memory, and rate-limits uncached retrievals. The raw hash,
official URL, and retrieval time survive normalization.

Signals distinguish Open Topic, Specific Topic, Sequential Opportunity, and other official
AFWERX opportunities. Specific Topic is a more defined DAF problem signal; Open Topic is
broader dual-use discovery. Neither receives new scoring weights in Phase 3.

A sanitized official-schema fixture protects the parser. HTTP or parser failure returns
only an AFWERX `UNAVAILABLE` state and cannot affect USAspending, SAM, or SBIR.
