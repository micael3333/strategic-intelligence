import { GrantsProvider } from "@/sources/grants";
import type { GrantsSearchQuery } from "@/sources/grants/types";

export async function POST(request: Request) {
  try { return Response.json(await new GrantsProvider().search(await request.json() as GrantsSearchQuery)); }
  catch (error) { return Response.json({ providerId: "provider:grants", status: "UPSTREAM_ERROR", error: error instanceof Error ? error.message : "Grants.gov search failed." }, { status: 503 }); }
}
