import { DARPARssProvider } from "@/sources/darpa";

export async function GET(request: Request) {
  try { return Response.json(await new DARPARssProvider().search(new URL(request.url).searchParams.get("keyword") ?? undefined)); }
  catch (error) { return Response.json({ providerId: "provider:darpa", status: "UPSTREAM_ERROR", error: error instanceof Error ? error.message : "DARPA RSS search failed." }, { status: 503 }); }
}
