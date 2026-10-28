import { defaultBattery } from "@/lib/psychometric-battery";
import { supabaseIsConfigured, supabaseRest, supabaseUser } from "@/lib/supabase-rest";

function jsonError(message: string, status = 400) {
  return Response.json({ error: message }, { status });
}

async function authenticatedUser(request: Request) {
  const authorization = request.headers.get("authorization");
  if (!authorization?.startsWith("Bearer ")) return null;
  return supabaseUser(authorization.slice(7));
}

export async function GET(request: Request) {
  if (!supabaseIsConfigured()) return jsonError("La conexión segura de Supabase aún no está configurada.", 503);
  const user = await authenticatedUser(request);
  if (!user) return jsonError("Sesión de reclutador no válida.", 401);
  try {
    const batteries = await supabaseRest<Array<Record<string, unknown>>>(`baterias?reclutador_id=eq.${encodeURIComponent(user.id)}&select=id,nombre,clasificacion_puesto,pruebas,tiempo_total_min,activa,created_at&order=created_at.desc`);
    const sessions = await supabaseRest<Array<Record<string, unknown>>>(`sesiones_evaluacion?reclutador_id=eq.${encodeURIComponent(user.id)}&select=id,codigo,bateria_id,candidato_nombre,candidato_edad,candidato_empresa,estado,resultados,pdf_path,created_at,finalizado_en&order=created_at.desc`);
    return Response.json({ batteries, sessions });
  } catch (error) {
    return jsonError(error instanceof Error ? error.message : "No se pudo cargar el dashboard.", 500);
  }
}

export async function POST(request: Request) {
  if (!supabaseIsConfigured()) return jsonError("La conexión segura de Supabase aún no está configurada.", 503);
  const user = await authenticatedUser(request);
  if (!user) return jsonError("Sesión de reclutador no válida.", 401);
  const body = await request.json() as { action?: "create-battery" | "create-session"; name?: string; classification?: string; totalMinutes?: number; tests?: Array<{ testId: string; order: number; timeLimitSeconds: number }>; batteryId?: string };
  try {
    if (body.action === "create-battery") {
      const battery = await supabaseRest<Array<Record<string, unknown>>>("baterias", { method: "POST", headers: { Prefer: "return=representation" }, body: JSON.stringify({ reclutador_id: user.id, nombre: body.name?.trim() || defaultBattery.name, clasificacion_puesto: body.classification || "custom", pruebas: body.tests?.length ? body.tests : defaultBattery.tests, tiempo_total_min: body.totalMinutes || defaultBattery.totalMinutes }) });
      return Response.json({ battery: battery[0] });
    }
    if (body.action === "create-session" && body.batteryId) {
      const code = `SB01-${crypto.randomUUID().replaceAll("-", "").slice(0, 8).toUpperCase()}`;
      const session = await supabaseRest<Array<Record<string, unknown>>>("sesiones_evaluacion", { method: "POST", headers: { Prefer: "return=representation" }, body: JSON.stringify({ codigo: code, bateria_id: body.batteryId, reclutador_id: user.id }) });
      return Response.json({ session: session[0] });
    }
    return jsonError("Acción no reconocida.");
  } catch (error) {
    return jsonError(error instanceof Error ? error.message : "No se pudo guardar la operación.", 500);
  }
}
