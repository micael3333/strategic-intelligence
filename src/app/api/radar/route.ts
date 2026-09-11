import { buildRadar } from "@/domain/radar";
import { historyStore } from "@/persistence/history-store";
export async function GET() { return Response.json(buildRadar(await historyStore.snapshots())); }
