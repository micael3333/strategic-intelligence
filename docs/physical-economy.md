# Physical economy layer

EIA observations and Census trade observations remain separate from procurement events because their grain, units, and interpretation differ. EIA currently has verified observation presets for U.S. industrial electricity sales and U.S. nuclear outage percentage; metadata discovery covers electricity, natural gas, petroleum, nuclear, total energy, and STEO without pretending every series is analytically configured.

Trend calculations preserve insufficient-history states. Monthly and daily observations use different comparison offsets, so twelve daily observations are never labeled year-over-year. Census normalizes monthly imports and exports by HS product and country, then calculates shares, HHI concentration, trade acceleration, and a conservative supplier-leader comparison when history permits.

Technology-to-HS mappings live in `src/config/supply-chain-mappings.ts`. A mapping carries evidence and confidence. Unresolved mappings do not trigger a Census request. Broad HS 8541 coverage can support semiconductor investigation, but it is not evidence that every record is GaN or belongs to a particular defense system.
