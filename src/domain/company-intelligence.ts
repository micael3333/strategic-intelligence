import type { CrossSourceStrategicEvent } from "./multi-source";
import type { SECCompanyIdentity, SECFiling, SECFinancialObservation } from "@/sources/sec/types";

export interface CompanyStrategicFootprint {
  company: SECCompanyIdentity;
  generatedAt: string;
  status: "WORKING" | "PARTIAL";
  governmentExposure: { awardCount: number; totalAwardValue: number; agencies: string[]; explanation: string };
  awardMomentum: { status: "CALCULATED" | "INSUFFICIENT_HISTORY"; explanation: string };
  technologyExposure: Array<{ cluster: string; evidenceCount: number }>;
  corporateConfirmation: { facts: SECFinancialObservation[]; filings: SECFiling[]; explanation: string };
  supplyChainRelevance: { status: "EVIDENCE_BACKED" | "UNRESOLVED"; explanation: string };
  evidence: CrossSourceStrategicEvent[];
  providerStatus: Array<{ providerId: string; status: string; recordsRetrieved: number; error?: string }>;
}
