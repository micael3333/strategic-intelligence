export const PROVIDER_ECONOMICS = {
  samOpportunities: { ttlMs: 15 * 60_000, concurrency: 2, maxTermsPerPlan: 2, cooldownBaseMs: 60_000, cooldownMaxMs: 30 * 60_000 },
  samContractAwards: { ttlMs: 24 * 60 * 60_000, concurrency: 1, dailyRequestBudget: 3, cooldownBaseMs: 15 * 60_000, cooldownMaxMs: 6 * 60 * 60_000 },
  eia: { ttlMs: 6 * 60 * 60_000, concurrency: 2 },
  censusTrade: { ttlMs: 12 * 60 * 60_000, concurrency: 2 },
  secEdgar: { ttlMs: 30 * 60_000, concurrency: 1, minimumIntervalMs: 125 },
  exportControls: { ttlMs: 24 * 60 * 60_000, concurrency: 1 },
  ted: { ttlMs: 30 * 60_000, concurrency: 1, dailyRequestBudget: 50, cooldownBaseMs: 60_000, cooldownMaxMs: 30 * 60_000 },
  ukFindATender: { ttlMs: 30 * 60_000, concurrency: 1, dailyRequestBudget: 50, cooldownBaseMs: 60_000, cooldownMaxMs: 30 * 60_000 },
  diu: { ttlMs: 6 * 60 * 60_000, concurrency: 1, dailyRequestBudget: 12 },
  blueUas: { ttlMs: 24 * 60 * 60_000, concurrency: 1, dailyRequestBudget: 4 },
  politicalDisclosures: { ttlMs: 24 * 60 * 60_000, concurrency: 1, dailyRequestBudget: 4 },
} as const;

export const SAM_CLUSTER_QUERY_TERMS = {
  COUNTER_UAS: ["drone", "interceptor"],
  DIRECTED_ENERGY: ["laser", "microwave"],
  MISSILE_PROPULSION: ["propellant", "energetics"],
  POWER_ELECTRONICS: ["semiconductor", "gallium"],
  CRITICAL_MINERALS: ["minerals", "tungsten"],
  ELECTRONIC_WARFARE: ["electronic", "spectrum"],
  AUTONOMOUS_SYSTEMS: ["autonomous", "unmanned"],
  ENERGY_INFRASTRUCTURE: ["nuclear", "microgrid"],
  SEMICONDUCTORS: ["semiconductor", "microelectronics"],
} as const;
