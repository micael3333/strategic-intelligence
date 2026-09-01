import { USAspendingProviderError, type USAspendingSearchQuery, type USAspendingSearchResult } from "@/sources/usaspending/types";
import { validateUSAspendingQuery } from "@/sources/usaspending/query";

export interface USAspendingSearchService {
  searchAndIngest(query: USAspendingSearchQuery): Promise<USAspendingSearchResult>;
}

export async function handleUSAspendingSearch(request: Request, service: USAspendingSearchService): Promise<Response> {
  const length = Number(request.headers.get("content-length") ?? 0);
  if (length > 64_000) return Response.json({ error: "Request body is too large." }, { status: 413 });
  let query: USAspendingSearchQuery;
  try {
    query = await request.json() as USAspendingSearchQuery;
  } catch {
    return Response.json({ error: "Request body must be valid JSON." }, { status: 400 });
  }
  if (!query || typeof query !== "object") return Response.json({ error: "Search query is required." }, { status: 400 });
  const errors = validateUSAspendingQuery(query);
  if (errors.length) return Response.json({ error: "Invalid search query.", details: errors }, { status: 400 });
  try {
    return Response.json(await service.searchAndIngest(query));
  } catch (error) {
    if (error instanceof USAspendingProviderError) {
      return Response.json({ error: error.details.message, providerStatus: error.details.status, endpoint: error.details.endpoint }, { status: error.details.httpStatus && error.details.httpStatus < 500 ? 502 : 503 });
    }
    return Response.json({ error: error instanceof Error ? error.message : "Unexpected USAspending pipeline failure." }, { status: 500 });
  }
}
