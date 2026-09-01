export type StableId = string;

export interface EntityBase {
  id: StableId;
  canonicalName: string;
  aliases: string[];
  description?: string;
}

export interface StrategicNeed extends EntityBase {
  kind: "strategic-need";
  priorityOwnerAgencyIds: StableId[];
}

export interface Agency extends EntityBase {
  kind: "agency";
  parentAgencyId?: StableId;
  country: string;
}

export interface Program extends EntityBase {
  kind: "program";
  agencyId: StableId;
  strategicNeedIds: StableId[];
}

export type NoticeType =
  | "RFI"
  | "SOURCES_SOUGHT"
  | "BAA"
  | "PRESOLICITATION"
  | "SOLICITATION"
  | "SPECIAL_NOTICE"
  | "AWARD_NOTICE";

export interface Solicitation extends EntityBase {
  kind: "solicitation";
  agencyId: StableId;
  programId?: StableId;
  noticeType: NoticeType;
  publishedAt?: string;
  closesAt?: string;
}

export interface Company extends EntityBase {
  kind: "company";
  ticker?: string;
  cik?: string;
  uei?: string;
  country?: string;
  ownership: "PUBLIC" | "PRIVATE" | "UNKNOWN";
  website?: string;
}

export interface Technology extends EntityBase {
  kind: "technology";
  parentTechnologyId?: StableId;
  themeIds: StableId[];
}

export interface System extends EntityBase {
  kind: "system";
  technologyIds: StableId[];
}

export interface Subsystem extends EntityBase {
  kind: "subsystem";
  systemId: StableId;
}

export interface Component extends EntityBase {
  kind: "component";
  subsystemIds: StableId[];
}

export interface Material extends EntityBase {
  kind: "material";
  componentIds: StableId[];
  criticality?: "LOW" | "MEDIUM" | "HIGH" | "UNKNOWN";
}

export interface Award extends EntityBase {
  kind: "award";
  recipientCompanyId?: StableId;
  agencyId: StableId;
  programId?: StableId;
  amount?: number;
  currency?: string;
  awardedAt?: string;
  externalIdentifier?: string;
}

export interface Prototype extends EntityBase {
  kind: "prototype";
  companyIds: StableId[];
  programId?: StableId;
}

export interface ValidationEvent extends EntityBase {
  kind: "validation-event";
  prototypeId?: StableId;
  validatorAgencyId?: StableId;
  occurredAt?: string;
  outcome: "SUCCESSFUL" | "PARTIAL" | "UNSUCCESSFUL" | "UNKNOWN";
}

export interface ProductionEvent extends EntityBase {
  kind: "production-event";
  companyId?: StableId;
  programId?: StableId;
  occurredAt?: string;
  eventType: "INITIAL_ORDER" | "REPEAT_ORDER" | "CAPACITY_EXPANSION" | "MULTI_YEAR";
}

export interface MarketSecurity extends EntityBase {
  kind: "market-security";
  companyId: StableId;
  ticker?: string;
  cik?: string;
  exchange?: string;
  securityType: "COMMON_STOCK" | "ADR" | "OTHER";
}

export type RelationshipType =
  | "FUNDED_BY"
  | "SELECTED_BY"
  | "CONTRACTED_BY"
  | "DEVELOPED_FOR"
  | "TESTED_BY"
  | "VALIDATED_BY"
  | "PRODUCES"
  | "SUPPLIES"
  | "POTENTIAL_SUPPLIER"
  | "USES_COMPONENT"
  | "USES_MATERIAL"
  | "PARTNERED_WITH"
  | "MOU_WITH"
  | "OFFTAKE_WITH"
  | "PROGRAM_OF"
  | "AWARDED_TO"
  | "FUNDS"
  | "REQUIRES"
  | "SOLVES"
  | "RELATED_TO";

export type EvidenceLevel = "CONFIRMED" | "PROBABLE" | "INFERRED" | "SPECULATIVE";

export interface Evidence {
  id: StableId;
  sourceId: StableId;
  sourceUrl?: string;
  publicationDate?: string;
  retrievedAt: string;
  excerpt?: string;
  payload?: Readonly<Record<string, unknown>>;
  evidenceLevel: EvidenceLevel;
  confidence: number;
  notes?: string;
  generatedByAi?: boolean;
}

export interface Relationship {
  id: StableId;
  type: RelationshipType;
  fromEntityId: StableId;
  toEntityId: StableId;
  evidence: Evidence[];
}

export type FunnelStage = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7;

export type StrategicEventType =
  | "STRATEGIC_NEED_IDENTIFIED"
  | "RELEVANT_SOLICITATION"
  | "DARPA_PROGRAM_RELEVANCE"
  | "SBIR_PHASE_I"
  | "SBIR_PHASE_II"
  | "SBIR_PHASE_III"
  | "AFWERX_SELECTION"
  | "DIU_SELECTION"
  | "PROTOTYPE_AWARDED"
  | "SUCCESSFUL_PROTOTYPE"
  | "SUCCESS_MEMO"
  | "FIRST_OPERATIONAL_AWARD"
  | "REPEAT_AWARD"
  | "NEW_AGENCY_CUSTOMER"
  | "PRIME_RELATIONSHIP"
  | "SUPPLIER_AGREEMENT"
  | "OFFTAKE_AGREEMENT"
  | "GOVERNMENT_SUPPORTED_MANUFACTURING"
  | "MULTI_YEAR_PROCUREMENT"
  | "STRATEGIC_MATERIAL_EXPOSURE"
  | "FEDERAL_AWARD_DETECTED"
  | "AWARD_COUNT_GROWTH"
  | "AWARD_VALUE_GROWTH"
  | "MULTI_AGENCY_ADOPTION";

export interface StrategicEvent {
  id: StableId;
  type: StrategicEventType;
  stage: FunnelStage | null;
  subjectEntityIds: StableId[];
  occurredAt?: string;
  amount?: number;
  agencyId?: StableId;
  programId?: StableId;
  evidence: Evidence[];
}

export type SourceType =
  | "GOVERNMENT_PROGRAM"
  | "SOLICITATION"
  | "AWARD_DATABASE"
  | "PROTOTYPE_PROGRAM"
  | "GOVERNMENT_ANNOUNCEMENT"
  | "REGULATORY_FILINGS"
  | "FUTURE_SOURCE";

export interface Source {
  id: StableId;
  name: string;
  officialUrl: string;
  type: SourceType;
  role: string;
  expectedSignals: string[];
  funnelStages: FunnelStage[];
  accessMethod: "PUBLIC_WEB" | "PUBLIC_API" | "API_KEY" | "DATASET" | "MIXED" | "TBD";
  credentialRequirement: string | null;
  updateFrequency?: string;
  reliability: "PRIMARY" | "AUTHORITATIVE" | "SUPPLEMENTARY";
  providerStatus: "SKELETON" | "IMPLEMENTED" | "CONFIGURATION_REQUIRED" | "PLANNED";
  limitations: string[];
  future: boolean;
}

export type DomainEntity =
  | StrategicNeed
  | Agency
  | Program
  | Solicitation
  | Company
  | Technology
  | System
  | Subsystem
  | Component
  | Material
  | Award
  | Prototype
  | ValidationEvent
  | ProductionEvent
  | MarketSecurity;
