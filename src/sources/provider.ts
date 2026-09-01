import type { Source, StrategicEvent } from "@/domain/models";

export type ProviderHealthStatus =
  | "HEALTHY"
  | "DEGRADED"
  | "UNAVAILABLE"
  | "AUTH_REQUIRED"
  | "MAINTENANCE"
  | "NOT_CONFIGURED"
  | "CONFIGURATION_REQUIRED"
  | "TEMPORARILY_UNAVAILABLE"
  | "NOT_IMPLEMENTED"
  | "FAILED";

export interface ProviderHealth {
  providerId: string;
  status: ProviderHealthStatus;
  checkedAt: string;
  message: string;
  performedExternalCheck: boolean;
  mode?: "LIVE_API" | "DATASET" | "OFFICIAL_WEB" | "SKELETON";
  authenticationRequired?: boolean;
  lastSuccessfulRequest?: string;
  lastError?: string;
  recordsRetrieved?: number;
  lastRetrievalTimestamp?: string;
}

export interface RawSourceRecord {
  providerId: string;
  externalId?: string;
  retrievedAt: string;
  payload: Readonly<Record<string, unknown>>;
}

export interface FetchUpdatesParams {
  since?: string;
  cursor?: string;
  limit?: number;
}

export interface FetchUpdatesResult {
  records: RawSourceRecord[];
  nextCursor?: string;
}

export interface NormalizedEvent {
  event: StrategicEvent;
  rawRecordId?: string;
  warnings: string[];
}

export interface SourceProvider {
  readonly id: string;
  readonly name: string;
  readonly source: Source;
  testConnection(): Promise<ProviderHealth>;
  fetchUpdates(params?: FetchUpdatesParams): Promise<FetchUpdatesResult>;
  normalize(record: RawSourceRecord): Promise<NormalizedEvent[]>;
}

export function providerHealth(
  providerId: string,
  status: ProviderHealthStatus,
  message: string,
  performedExternalCheck = false,
): ProviderHealth {
  return { providerId, status, message, performedExternalCheck, checkedAt: new Date().toISOString() };
}

export abstract class PhaseOneProvider implements SourceProvider {
  abstract readonly id: string;
  abstract readonly name: string;
  abstract readonly source: Source;

  protected requiredEnvironmentVariable?: string;

  async testConnection(): Promise<ProviderHealth> {
    if (this.requiredEnvironmentVariable && !process.env[this.requiredEnvironmentVariable]) {
      return providerHealth(
        this.id,
        "CONFIGURATION_REQUIRED",
        `${this.requiredEnvironmentVariable} is not configured. No request was attempted.`,
      );
    }
    return providerHealth(this.id, "NOT_IMPLEMENTED", "Phase 1 skeleton only. No request was attempted.");
  }

  async fetchUpdates(): Promise<FetchUpdatesResult> {
    throw new Error(`${this.id} ingestion is not implemented in Phase 1`);
  }

  async normalize(): Promise<NormalizedEvent[]> {
    throw new Error(`${this.id} normalization is not implemented in Phase 1`);
  }
}
