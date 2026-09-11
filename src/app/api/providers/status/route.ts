import { AFWERXProvider } from "@/sources/afwerx";
import { runIsolatedProviders } from "@/sources/orchestrator";
import { SAMProvider } from "@/sources/sam";
import { SBIRProvider } from "@/sources/sbir";
import { USAspendingProvider } from "@/sources/usaspending";
import { GrantsProvider } from "@/sources/grants";
import { DARPARssProvider } from "@/sources/darpa";
import { SAMContractAwardsProvider } from "@/sources/sam-awards";
import { EIAProvider } from "@/sources/eia";
import { CensusTradeProvider } from "@/sources/census-trade";
import { SECEdgarProvider } from "@/sources/sec";
import { ExportControlsProvider } from "@/sources/export-controls";
import { TEDProvider } from "@/sources/ted";
import { UKFindATenderProvider } from "@/sources/uk-fts";
import { DIUIntelligenceProvider } from "@/sources/diu";
import { BlueUASProvider } from "@/sources/blue-uas";
import { HouseDisclosureProvider } from "@/sources/house-disclosures";
import { historyStore } from "@/persistence/history-store";
import { providerHealth, type ProviderHealth } from "@/sources/provider";

const providers = [new USAspendingProvider(), new SAMProvider(), new SAMContractAwardsProvider(), new SBIRProvider(), new AFWERXProvider(), new GrantsProvider(), new DARPARssProvider(), new EIAProvider(), new CensusTradeProvider(), new SECEdgarProvider(), new ExportControlsProvider(), new TEDProvider(), new UKFindATenderProvider(), new DIUIntelligenceProvider(), new BlueUASProvider(), new HouseDisclosureProvider()];

function configuredStatus(provider: (typeof providers)[number], latest?: Awaited<ReturnType<typeof historyStore.healthSnapshots>>[number]): ProviderHealth {
  if (latest) return { ...providerHealth(provider.id, latest.status as ProviderHealth["status"], latest.message, latest.performedExternalCheck), checkedAt: latest.checkedAt, recordsRetrieved: latest.recordsRetrieved, mode: latest.mode as ProviderHealth["mode"], authenticationRequired: latest.authenticationRequired, lastError: latest.lastError };
  const required = provider.source.credentialRequirement;
  if (required && !process.env[required]) return { ...providerHealth(provider.id, "AUTH_REQUIRED", `${required} is not configured; no request was attempted.`), authenticationRequired: true };
  if (provider.id === "provider:sam-contract-awards") return { ...providerHealth(provider.id, "PARTIAL", "Adapter and credential are configured. Live checks are reserved for explicit searches because the provider has a small daily budget."), mode: "LIVE_API", authenticationRequired: true };
  return { ...providerHealth(provider.id, "PARTIAL", "Adapter is available, but no stored live health check exists yet."), authenticationRequired: Boolean(required) };
}

export async function GET(request: Request) {
  const live = new URL(request.url).searchParams.get("live") === "1";
  if (!live) {
    const snapshots = await historyStore.healthSnapshots(); const latest = new Map<string, (typeof snapshots)[number]>();
    for (const item of snapshots) { const current = latest.get(item.providerId); if (!current || current.checkedAt < item.checkedAt) latest.set(item.providerId, item); }
    return Response.json(providers.map((provider) => configuredStatus(provider, latest.get(provider.id))));
  }
  const results = await runIsolatedProviders(providers.map((provider) => ({ providerId: provider.id, run: async () => ({ records: [], health: await provider.testConnection() }) })));
  const health = results.map((result) => result.health ?? { providerId: result.providerId, status: result.status, message: result.error ?? "Provider unavailable.", checkedAt: new Date().toISOString(), performedExternalCheck: false });
  await Promise.all(health.map((item) => historyStore.appendHealth({ id: `health:${item.providerId}:${item.checkedAt}`, providerId: item.providerId, status: item.status, checkedAt: item.checkedAt, recordsRetrieved: item.recordsRetrieved, message: item.message, performedExternalCheck: item.performedExternalCheck, mode: item.mode, authenticationRequired: item.authenticationRequired, lastError: item.lastError })));
  return Response.json(health);
}
