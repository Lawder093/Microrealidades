import { requireRoot, RootAccessError } from "@/lib/root-access";

export async function GET(request: Request) {
  try { await requireRoot(request); return Response.json({ isSuperRoot: true }, { headers: { "Cache-Control": "no-store" } }); }
  catch (error) { return Response.json({ error: error instanceof RootAccessError ? error.message : "No se pudo verificar el acceso." }, { status: error instanceof RootAccessError ? error.status : 503, headers: { "Cache-Control": "no-store" } }); }
}
