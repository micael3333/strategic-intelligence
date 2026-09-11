import type { InvestigationDimension } from "@/domain/intent";
import type { ProcurementSourceFamily } from "@/domain/multi-source";
import { sha256 } from "@/sources/usaspending/hash";

export interface IngestionInvestigation { id: string; query: string; dimension: InvestigationDimension; includeContractAwards: false; }
export interface IngestionExecution { investigationId: string; status: "COMPLETED" | "FAILED"; startedAt: string; completedAt: string; error?: string; }
export type IntelligenceExecutor = (input: IngestionInvestigation) => Promise<void>;

export type IngestionJobProvider = Extract<ProcurementSourceFamily, "TED_EU" | "UK_FIND_A_TENDER" | "DIU" | "BLUE_UAS" | "EXPORT_CONTROLS" | "SEC_EDGAR" | "HOUSE_DISCLOSURES">;
export interface IngestionJobDefinition { id: string; provider: IngestionJobProvider; cadence: "DAILY" | "WEEKLY" | "ON_DEMAND"; requestBudget: number; enabledByDefault: boolean; notes: string; }
export interface IngestionJobRun { jobId: string; idempotencyKey: string; status: "COMPLETED" | "FAILED" | "SKIPPED_DUPLICATE"; startedAt: string; completedAt: string; error?: string; }
export type IngestionJobExecutor = (job: IngestionJobDefinition, window: { from: string; to: string }) => Promise<void>;

export const V25_INGESTION_JOBS: readonly IngestionJobDefinition[] = [
  { id: "ted-daily", provider: "TED_EU", cadence: "DAILY", requestBudget: 4, enabledByDefault: true, notes: "Bounded Search API window; no unbounded pagination." },
  { id: "uk-fts-daily", provider: "UK_FIND_A_TENDER", cadence: "DAILY", requestBudget: 4, enabledByDefault: true, notes: "Cursor-aware OCDS release-package window." },
  { id: "diu-daily", provider: "DIU", cadence: "DAILY", requestBudget: 1, enabledByDefault: true, notes: "Cached bounded official-page check." },
  { id: "blue-uas-weekly", provider: "BLUE_UAS", cadence: "WEEKLY", requestBudget: 1, enabledByDefault: true, notes: "Cached current DCMA successor-list check." },
  { id: "export-controls-daily", provider: "EXPORT_CONTROLS", cadence: "DAILY", requestBudget: 1, enabledByDefault: false, notes: "Large official snapshot refresh remains an explicit operation." },
  { id: "sec-events-daily", provider: "SEC_EDGAR", cadence: "DAILY", requestBudget: 8, enabledByDefault: true, notes: "Issuer-scoped event monitor using the existing SEC adapter." },
  { id: "house-disclosures", provider: "HOUSE_DISCLOSURES", cadence: "ON_DEMAND", requestBudget: 0, enabledByDefault: false, notes: "Official filing batch ingestion; no REST API is claimed." },
] as const;

export function ingestionIdempotencyKey(job: IngestionJobDefinition, window: { from: string; to: string }): string {
  return `ingestion:${sha256(`${job.id}:${window.from}:${window.to}`).slice(0, 24)}`;
}

export async function runIngestionJobs(execute: IngestionJobExecutor, window: { from: string; to: string }, jobs: readonly IngestionJobDefinition[] = V25_INGESTION_JOBS.filter((job) => job.enabledByDefault), completedKeys = new Set<string>()): Promise<IngestionJobRun[]> {
  const results: IngestionJobRun[] = [];
  for (const job of jobs) {
    const startedAt = new Date().toISOString(); const idempotencyKey = ingestionIdempotencyKey(job, window);
    if (completedKeys.has(idempotencyKey)) { results.push({ jobId: job.id, idempotencyKey, status: "SKIPPED_DUPLICATE", startedAt, completedAt: new Date().toISOString() }); continue; }
    try { await execute(job, window); completedKeys.add(idempotencyKey); results.push({ jobId: job.id, idempotencyKey, status: "COMPLETED", startedAt, completedAt: new Date().toISOString() }); }
    catch (error) { results.push({ jobId: job.id, idempotencyKey, status: "FAILED", startedAt, completedAt: new Date().toISOString(), error: error instanceof Error ? error.message : "Ingestion failed." }); }
  }
  return results;
}

export const CONTROLLED_INGESTION_INVESTIGATIONS: readonly IngestionInvestigation[] = [
  { id: "counter-uas", query: "counter-UAS", dimension: "TECHNOLOGY", includeContractAwards: false },
  { id: "critical-minerals", query: "critical minerals", dimension: "MATERIAL", includeContractAwards: false },
  { id: "nuclear-infrastructure", query: "nuclear", dimension: "TECHNOLOGY", includeContractAwards: false },
] as const;

export async function runControlledIngestion(execute: IntelligenceExecutor, investigations: readonly IngestionInvestigation[] = CONTROLLED_INGESTION_INVESTIGATIONS): Promise<IngestionExecution[]> {
  const results: IngestionExecution[] = [];
  for (const investigation of investigations) {
    const startedAt = new Date().toISOString();
    try { await execute(investigation); results.push({ investigationId: investigation.id, status: "COMPLETED", startedAt, completedAt: new Date().toISOString() }); }
    catch (error) { results.push({ investigationId: investigation.id, status: "FAILED", startedAt, completedAt: new Date().toISOString(), error: error instanceof Error ? error.message : "Ingestion failed." }); }
  }
  return results;
}
