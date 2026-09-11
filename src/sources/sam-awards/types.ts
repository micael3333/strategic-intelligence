import type { CrossSourceStrategicEvent } from "@/domain/multi-source";

export const SAM_CONTRACT_AWARDS_URL = "https://api.sam.gov/contract-awards/v1/search";
export interface SAMContractAwardQuery { query?: string; lastModifiedFrom?: string; lastModifiedTo?: string; contractingDepartmentCode?: string; awardeeName?: string; awardeeUei?: string; limit?: number; offset?: number; }
export interface SAMContractAwardRaw extends Record<string, unknown> { contractId?: Record<string, unknown>; coreData?: Record<string, unknown>; awardDetails?: Record<string, unknown>; awardeeData?: Record<string, unknown>; }
export interface NormalizedSAMContractAward { id: string; piid: string; modificationNumber?: string; transactionNumber?: string; awardType?: string; awardeeName?: string; awardeeUei?: string; contractingDepartment?: string; contractingSubtier?: string; contractingOffice?: string; dateSigned?: string; actionObligation?: number; totalContractValue?: number; description?: string; sourceUrl: string; retrievedAt: string; rawProvenanceHash: string; raw: SAMContractAwardRaw; event: CrossSourceStrategicEvent; }
export interface SAMContractAwardResult { status: "WORKING" | "EMPTY"; records: NormalizedSAMContractAward[]; totalRecords: number; retrievedAt: string; rawResponseHash: string; cacheHit: boolean; requestExecuted: boolean; budget: { used: number; limit?: number }; }
