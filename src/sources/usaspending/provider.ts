import { providerHealth, type ProviderHealth } from "../provider";
import { getSource } from "../registry";
import { mapUSAspendingQuery } from "./query";
import { sha256 } from "./hash";
import {
  USASPENDING_SPENDING_BY_AWARD_URL,
  USAspendingProviderError,
  type RequestProvenance,
  type USAspendingSearchQuery,
  type USAspendingUpstreamResponse,
} from "./types";

export interface USAspendingProviderOptions {
  fetchImplementation?: typeof fetch;
  timeoutMs?: number;
  now?: () => Date;
}

export class USAspendingProvider {
  readonly id = "provider:usaspending";
  readonly name = "USAspending Provider";
  readonly source = getSource("source:usaspending");
  private readonly fetchImplementation: typeof fetch;
  private readonly timeoutMs: number;
  private readonly now: () => Date;

  constructor(options: USAspendingProviderOptions = {}) {
    this.fetchImplementation = options.fetchImplementation ?? fetch;
    this.timeoutMs = options.timeoutMs ?? 10_000;
    this.now = options.now ?? (() => new Date());
  }

  async testConnection(): Promise<ProviderHealth> {
    const today = this.now();
    const start = new Date(today.getTime() - 7 * 86_400_000);
    try {
      const result = await this.searchAwards({
        startDate: start.toISOString().slice(0, 10),
        endDate: today.toISOString().slice(0, 10),
        awardTypeCodes: ["A", "B", "C", "D"],
        limit: 1,
        page: 1,
        sort: "Award Amount",
        order: "desc",
      });
      return { ...providerHealth(this.id, "HEALTHY", "Official USAspending API returned a successful response.", true), mode: "LIVE_API", lastSuccessfulRequest: result.retrievedAt, recordsRetrieved: result.rawResponse.results.length, lastRetrievalTimestamp: result.retrievedAt };
    } catch (error) {
      const details = error instanceof USAspendingProviderError ? error.details : undefined;
      return { ...providerHealth(this.id, details?.status ?? "FAILED", details?.message ?? "USAspending connection test failed.", true), mode: "LIVE_API", lastError: details?.message ?? "USAspending connection test failed." };
    }
  }

  async searchAwards(query: USAspendingSearchQuery): Promise<RequestProvenance> {
    const requestParameters = mapUSAspendingQuery(query);
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), this.timeoutMs);
    try {
      const response = await this.fetchImplementation(USASPENDING_SPENDING_BY_AWARD_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify(requestParameters),
        signal: controller.signal,
        cache: "no-store",
      });
      const bodyText = await response.text();
      if (!response.ok) {
        const temporary = response.status >= 500 || response.status === 429;
        throw new USAspendingProviderError({
          status: temporary ? "TEMPORARILY_UNAVAILABLE" : "FAILED",
          message: `USAspending returned HTTP ${response.status}: ${bodyText.slice(0, 500)}`,
          httpStatus: response.status,
          endpoint: USASPENDING_SPENDING_BY_AWARD_URL,
        });
      }
      let rawResponse: USAspendingUpstreamResponse;
      try {
        rawResponse = JSON.parse(bodyText) as USAspendingUpstreamResponse;
      } catch {
        throw new USAspendingProviderError({ status: "FAILED", message: "USAspending returned invalid JSON.", httpStatus: response.status, endpoint: USASPENDING_SPENDING_BY_AWARD_URL });
      }
      if (!Array.isArray(rawResponse.results)) {
        throw new USAspendingProviderError({ status: "FAILED", message: "USAspending response did not contain a results array.", httpStatus: response.status, endpoint: USASPENDING_SPENDING_BY_AWARD_URL });
      }
      return {
        provider: "usaspending",
        endpoint: USASPENDING_SPENDING_BY_AWARD_URL,
        requestParameters,
        retrievedAt: this.now().toISOString(),
        httpStatus: response.status,
        responseHash: sha256(rawResponse),
        rawResponse,
      };
    } catch (error) {
      if (error instanceof USAspendingProviderError) throw error;
      const message = error instanceof Error && error.name === "AbortError"
        ? `USAspending request exceeded ${this.timeoutMs}ms.`
        : `USAspending request failed: ${error instanceof Error ? error.message : "unknown error"}`;
      throw new USAspendingProviderError({ status: "TEMPORARILY_UNAVAILABLE", message, endpoint: USASPENDING_SPENDING_BY_AWARD_URL });
    } finally {
      clearTimeout(timeout);
    }
  }
}
