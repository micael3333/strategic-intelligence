import { USAspendingProvider } from "@/sources/usaspending/provider";
import { usaspendingStore } from "@/sources/usaspending/store";

export const runtime = "nodejs";

export async function GET() {
  const health = await new USAspendingProvider().testConnection();
  usaspendingStore.providerHealth = health;
  return Response.json(health, { status: health.status === "HEALTHY" ? 200 : 503 });
}
