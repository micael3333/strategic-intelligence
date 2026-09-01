import { handleUSAspendingSearch } from "@/server/usaspending-handlers";
import { USAspendingPipeline } from "@/sources/usaspending/pipeline";

export const runtime = "nodejs";

export async function POST(request: Request) {
  return handleUSAspendingSearch(request, new USAspendingPipeline());
}
