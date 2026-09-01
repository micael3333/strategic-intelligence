import type { Evidence, StableId } from "./models";

export interface HiddenSupplierSignals {
  companyId: StableId;
  criticalComponentCount: number;
  criticalMaterialCount: number;
  substituteScarcity: "UNKNOWN" | "LOW" | "MEDIUM" | "HIGH";
  primeRelationshipCount: number;
  governmentSupportEventCount: number;
  programCount: number;
  agencyCount: number;
  procurementAccelerationScore?: number;
  dualUse: boolean;
  evidence: Evidence[];
}

export interface HiddenSupplierAssessment {
  status: "NOT_IMPLEMENTED";
  candidateCompanyId: StableId;
  reason: string;
}

export function prepareHiddenSupplierAssessment(signals: HiddenSupplierSignals): HiddenSupplierAssessment {
  return {
    status: "NOT_IMPLEMENTED",
    candidateCompanyId: signals.companyId,
    reason: "Phase 1 stores inspectable signals only; ranking waits for evidence coverage and substitute analysis.",
  };
}
