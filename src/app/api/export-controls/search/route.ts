import { ExportControlsProvider } from "@/sources/export-controls";
export async function POST(request: Request) { const body = await request.json() as { company?: string; aliases?: string[] }; if (!body.company?.trim()) return Response.json({ error: "Company name is required." }, { status: 400 }); return Response.json(await new ExportControlsProvider().search(body.company, body.aliases)); }
