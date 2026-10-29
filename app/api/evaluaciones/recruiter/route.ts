import { batteryTestCatalog, defaultBattery, type BatteryAssignment } from "@/lib/psychometric-battery";
import { supabaseConfigurationError, supabaseIsConfigured, supabaseRest, supabaseUser } from "@/lib/supabase-rest";

function jsonError(message: string, status = 400) {
  return Response.json({ error: message }, { status });
}

async function authenticatedUser(request: Request) {
  const authorization = request.headers.get("authorization");
  if (!authorization?.startsWith("Bearer ")) return null;
  return supabaseUser(authorization.slice(7));
}

async function ensureRecruiter(user: { id: string; email?: string }) {
  const email = user.email ?? `${user.id}@reclutador.local`;
  const nombre = user.email?.split("@")[0] || "Reclutador";
  await supabaseRest("reclutadores", {
    method: "POST",
    headers: { Prefer: "resolution=merge-duplicates,return=minimal" },
    body: JSON.stringify({ id: user.id, nombre, email }),
  });
}

export async function GET(request: Request) {
  if (!supabaseIsConfigured()) return jsonError(supabaseConfigurationError() ?? "La conexión segura de Supabase aún no está configurada.", 503);
  const user = await authenticatedUser(request);
  if (!user) return jsonError("Sesión de reclutador no válida.", 401);
  try {
    await ensureRecruiter(user);
    const batteries = await supabaseRest<Array<Record<string, unknown>>>(`baterias?reclutador_id=eq.${encodeURIComponent(user.id)}&select=id,nombre,clasificacion_puesto,pruebas,tiempo_total_min,activa,created_at&order=created_at.desc`);
    const sessions = await supabaseRest<Array<Record<string, unknown>>>(`sesiones_evaluacion?reclutador_id=eq.${encodeURIComponent(user.id)}&select=id,codigo,bateria_id,candidato_nombre,candidato_edad,candidato_empresa,estado,resultados,pdf_path,created_at,finalizado_en,baterias(nombre,clasificacion_puesto)&order=created_at.desc`);
    return Response.json({ batteries, sessions });
  } catch (error) {
    return jsonError(error instanceof Error ? error.message : "No se pudo cargar el dashboard.", 500);
  }
}

export async function POST(request: Request) {
  if (!supabaseIsConfigured()) return jsonError(supabaseConfigurationError() ?? "La conexión segura de Supabase aún no está configurada.", 503);
  const user = await authenticatedUser(request);
  if (!user) return jsonError("Sesión de reclutador no válida.", 401);
  const body = await request.json() as { action?: "create-battery" | "create-session"; name?: string; classification?: string; totalMinutes?: number; tests?: BatteryAssignment[]; batteryId?: string };
  try {
    await ensureRecruiter(user);
    if (body.action === "create-battery") {
      const requestedTests = Array.isArray(body.tests) ? body.tests : [];
      if (requestedTests.length === 0) return jsonError("Selecciona al menos una prueba para crear la batería.");
      const requestedIds = requestedTests.map((test) => test.testId ?? test.prueba_id ?? "");
      const allowedIds = new Set(batteryTestCatalog.map((test) => test.id));
      const hasDuplicateTests = new Set(requestedIds).size !== requestedIds.length;
      const hasUnknownTests = requestedIds.some((testId) => !allowedIds.has(testId));
      if (requestedTests.length > 0 && (hasDuplicateTests || hasUnknownTests)) return jsonError("La batería contiene pruebas inválidas o duplicadas.");
      const totalMinutes = Number(body.totalMinutes ?? defaultBattery.totalMinutes);
      if (!Number.isInteger(totalMinutes) || totalMinutes < 1 || totalMinutes > 240) return jsonError("El tiempo total debe ser un número entero entre 1 y 240 minutos.");
      const invalidTimeLimit = requestedTests.some((test) => {
        const seconds = Number(test.timeLimitSeconds ?? test.tiempo_limite_seg ?? 900);
        return !Number.isInteger(seconds) || seconds < 60 || seconds > 14400;
      });
      if (invalidTimeLimit) return jsonError("Cada prueba debe tener un tiempo límite entero entre 60 y 14,400 segundos.");
      const assignments = requestedTests.map((test, index) => {
        const testId = test.testId ?? test.prueba_id ?? "";
        const seconds = Number(test.timeLimitSeconds ?? test.tiempo_limite_seg ?? 900);
        const order = index + 1;
        return { prueba_id: testId, orden: order, tiempo_limite_seg: seconds, testId, order, timeLimitSeconds: seconds };
      });
      const battery = await supabaseRest<Array<Record<string, unknown>>>("baterias", { method: "POST", headers: { Prefer: "return=representation" }, body: JSON.stringify({ reclutador_id: user.id, nombre: body.name?.trim() || defaultBattery.name, clasificacion_puesto: body.classification || "custom", pruebas: assignments, tiempo_total_min: totalMinutes }) });
      return Response.json({ battery: battery[0] });
    }
    if (body.action === "create-session" && body.batteryId) {
      const ownedBatteries = await supabaseRest<Array<{ id: string }>>(`baterias?id=eq.${encodeURIComponent(body.batteryId)}&reclutador_id=eq.${encodeURIComponent(user.id)}&select=id&limit=1`);
      if (!ownedBatteries[0]) return jsonError("La batería no existe o no pertenece a este reclutador.", 404);
      for (let attempt = 0; attempt < 3; attempt += 1) {
        const code = `SB01-${crypto.randomUUID().replaceAll("-", "").slice(0, 8).toUpperCase()}`;
        try {
          const session = await supabaseRest<Array<Record<string, unknown>>>("sesiones_evaluacion", { method: "POST", headers: { Prefer: "return=representation" }, body: JSON.stringify({ codigo: code, bateria_id: body.batteryId, reclutador_id: user.id }) });
          return Response.json({ session: session[0], sharePath: `/evaluacion/${encodeURIComponent(code)}` });
        } catch (error) {
          if (attempt === 2) throw error;
        }
      }
    }
    return jsonError("Acción no reconocida.");
  } catch (error) {
    return jsonError(error instanceof Error ? error.message : "No se pudo guardar la operación.", 500);
  }
}
