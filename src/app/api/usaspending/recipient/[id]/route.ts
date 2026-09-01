import { usaspendingStore } from "@/sources/usaspending/store";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (id.length > 200) return Response.json({ error: "Recipient identifier is too long." }, { status: 400 });
  const intelligence = usaspendingStore.recipientIntelligence(id);
  if (!intelligence) return Response.json({ error: "Recipient is not present in this local runtime session." }, { status: 404 });
  return Response.json(intelligence);
}
