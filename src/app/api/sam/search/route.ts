import { SAMProvider } from "@/sources/sam";
import type { SAMSearchQuery } from "@/sources/sam/types";

export async function POST(request: Request) {
  try { const query = await request.json() as SAMSearchQuery; const result = await new SAMProvider().search(query); return Response.json(result); }
  catch (error) { const message = error instanceof Error ? error.message : "SAM search failed."; return Response.json({ providerId: "provider:sam", status: message.includes("SAM_API_KEY") ? "AUTH_REQUIRED" : "UNAVAILABLE", error: message }, { status: message.includes("SAM_API_KEY") ? 401 : 502 }); }
}
