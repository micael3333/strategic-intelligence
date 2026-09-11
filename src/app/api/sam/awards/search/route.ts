import { SAMContractAwardsError, SAMContractAwardsProvider } from "@/sources/sam-awards";
import type { SAMContractAwardQuery } from "@/sources/sam-awards/types";

export async function POST(request: Request) {
  try { return Response.json(await new SAMContractAwardsProvider().search(await request.json() as SAMContractAwardQuery)); }
  catch (error) { const known = error instanceof SAMContractAwardsError ? error : undefined; const status = known?.status === "AUTH_REQUIRED" ? 403 : known?.status === "RATE_LIMITED" ? 429 : known?.status === "BUDGET_EXHAUSTED" ? 429 : 502; return Response.json({ providerId: "provider:sam-contract-awards", status: known?.status ?? "UPSTREAM_ERROR", error: known?.message ?? "SAM Contract Awards search failed." }, { status }); }
}
