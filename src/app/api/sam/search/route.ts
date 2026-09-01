import { SAMProvider, SAMProviderError } from "@/sources/sam";
import type { SAMSearchQuery } from "@/sources/sam/types";

export async function POST(request: Request) {
  try { const query = await request.json() as SAMSearchQuery; const result = await new SAMProvider().search(query); return Response.json(result); }
  catch (error) {
    if (error instanceof SAMProviderError) {
      const responseStatus = error.details.status === "NOT_CONFIGURED" || error.details.status === "AUTHENTICATION_ERROR" ? 401 : error.details.status === "AUTHORIZATION_ERROR" ? 403 : error.details.status === "RATE_LIMITED" ? 429 : error.details.status === "INVALID_QUERY" ? 400 : 502;
      return Response.json({ providerId: "provider:sam", status: error.details.status, error: error.details.message, retryable: error.details.retryable }, { status: responseStatus });
    }
    return Response.json({ providerId: "provider:sam", status: "UPSTREAM_ERROR", error: "Unexpected SAM provider failure.", retryable: false }, { status: 500 });
  }
}
