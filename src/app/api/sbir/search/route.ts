import { SBIRProvider } from "@/sources/sbir";
import type { SBIRSearchQuery } from "@/sources/sbir/types";

export async function POST(request: Request) {
  try { return Response.json(await new SBIRProvider().search(await request.json() as SBIRSearchQuery)); }
  catch (error) { return Response.json({ providerId: "provider:sbir", status: "UPSTREAM_MAINTENANCE", error: error instanceof Error ? error.message : "SBIR search failed." }, { status: 503 }); }
}
