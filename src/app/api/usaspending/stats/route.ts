import { usaspendingStore } from "@/sources/usaspending/store";

export async function GET() {
  return Response.json(usaspendingStore.stats());
}
