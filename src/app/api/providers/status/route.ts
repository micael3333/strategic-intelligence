import { AFWERXProvider } from "@/sources/afwerx";
import { runIsolatedProviders } from "@/sources/orchestrator";
import { SAMProvider } from "@/sources/sam";
import { SBIRProvider } from "@/sources/sbir";
import { USAspendingProvider } from "@/sources/usaspending";
import { GrantsProvider } from "@/sources/grants";
import { DARPARssProvider } from "@/sources/darpa";

export async function GET() {
  const providers = [new USAspendingProvider(), new SAMProvider(), new SBIRProvider(), new AFWERXProvider(), new GrantsProvider(), new DARPARssProvider()];
  const results = await runIsolatedProviders(providers.map((provider) => ({ providerId: provider.id, run: async () => ({ records: [], health: await provider.testConnection() }) })));
  return Response.json(results.map((result) => result.health ?? { providerId: result.providerId, status: result.status, message: result.error ?? "Provider unavailable.", checkedAt: new Date().toISOString(), performedExternalCheck: false }));
}
