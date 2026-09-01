import { AFWERXProvider } from "@/sources/afwerx";

export async function POST(request: Request) {
  try { const body = await request.json() as { keyword?: string }; return Response.json(await new AFWERXProvider().search(body.keyword)); }
  catch (error) { return Response.json({ providerId: "provider:afwerx", status: "UNAVAILABLE", error: error instanceof Error ? error.message : "AFWERX search failed." }, { status: 502 }); }
}
