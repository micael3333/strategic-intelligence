export const SIGNAL_ENGINE_WEIGHTS = {
  governmentDemand: 13,
  governmentSpending: 13,
  researchFunding: 10,
  procurementBreadth: 8,
  geographicBreadth: 8,
  tradeMovement: 10,
  corporateActivity: 8,
  politicalCapital: 8,
  restrictionActivity: 5,
  evidenceDiversity: 10,
  historicalAcceleration: 7,
} as const;

export type SignalFactorKey = keyof typeof SIGNAL_ENGINE_WEIGHTS;
export const SIGNAL_ENGINE_TOTAL = Object.values(SIGNAL_ENGINE_WEIGHTS).reduce((sum, weight) => sum + weight, 0);
