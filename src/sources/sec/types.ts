export const SEC_TICKERS_URL = "https://www.sec.gov/files/company_tickers.json";
export const SEC_DATA_BASE_URL = "https://data.sec.gov";
export interface SECCompanyIdentity { cik: string; ticker: string; company: string; exchange?: string; }
export interface SECFiling { accessionNumber: string; filingDate: string; reportDate?: string; form: string; primaryDocument?: string; sourceUrl: string; }
export type SECFinancialConcept = "REVENUE" | "CAPEX" | "PP_AND_E" | "INVENTORY" | "DEBT" | "CASH" | "OPERATING_INCOME";
export interface SECFinancialObservation { id: string; concept: SECFinancialConcept; taxonomyConcept: string; value: number; unit: string; periodEnd: string; filedAt: string; form: string; accessionNumber?: string; fiscalYear?: number; fiscalPeriod?: string; sourceUrl: string; }
export interface SECCompanyIntelligence { status: "WORKING"; identity: SECCompanyIdentity; filings: SECFiling[]; facts: SECFinancialObservation[]; retrievedAt: string; sources: string[]; cache: { tickerIndex: boolean; submissions: boolean; companyFacts: boolean }; }
export interface SECDetectedEvent { id: string; type: "NEW_FILING" | "CAPITAL_EXPENDITURE_OBSERVATION" | "DEBT_OBSERVATION" | "CORPORATE_FINANCIAL_OBSERVATION"; company: SECCompanyIdentity; occurredAt: string; filing?: SECFiling; fact?: SECFinancialObservation; evidenceLevel: "CONFIRMED"; explanation: string; sourceUrl: string; }
export interface SECEventMonitorResult { company: SECCompanyIdentity; status: "WORKING" | "EMPTY"; events: SECDetectedEvent[]; retrievedAt: string; }
