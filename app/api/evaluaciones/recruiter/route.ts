import { assignmentAccessId, assignmentTestId, batteryTestCatalog, defaultBattery, type BatteryAssignment } from "@/lib/psychometric-battery";
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

function asAssignments(value: unknown) {
  return Array.isArray(value)
    ? value.filter((item): item is BatteryAssignment => Boolean(item && typeof item === "object"))
    : [];
}

function isInterventionId(value: string) {
  return /^IB-\d+$/i.test(value);
}

async function allocateAssignmentIds(quantity: number) {
  const batteries = await supabaseRest<Array<{ pruebas: unknown }>>("baterias?select=pruebas");
  let highest = 0;
  for (const battery of batteries) {
    for (const assignment of asAssignments(battery.pruebas)) {
      const match = /^IB-(\d+)$/i.exec(assignmentAccessId(assignment));
      const current = match ? Number(match[1]) : 0;
      if (Number.isSafeInteger(current)) highest = Math.max(highest, current);
    }
  }
  return Array.from({ length: quantity }, (_, index) => `IB-${String(highest + index + 1).padStart(4, "0")}`);
}

function testLinks(code: string, assignments: BatteryAssignment[]) {
  return assignments.map((assignment, index) => {
    const testId = assignmentTestId(assignment);
    const catalogTest = batteryTestCatalog.find((test) => test.id === testId);
    const accessId = assignmentAccessId(assignment);
    return {
      testId,
      name: catalogTest?.name ?? testId,
      accessId,
      order: assignment.orden ?? assignment.order ?? index + 1,
      path: `/evaluacion/${encodeURIComponent(code)}?prueba=${encodeURIComponent(accessId)}`,
    };
  }).filter((link) => Boolean(link.testId && link.accessId));
}

export async function GET(request: Request) {
  if (!supabaseIsConfigured()) return jsonError(supabaseConfigurationError() ?? "La conexión segura de Supabase aún no está configurada.", 503);
  const user = await authenticatedUser(request);
  if (!user) return jsonError("Sesión de reclutador no válida.", 401);
  try {
    await ensureRecruiter(user);
    const batteries = await supabaseRest<Array<Record<string, unknown>>>(`baterias?reclutador_id=eq.${encodeURIComponent(user.id)}&select=id,nombre,clasificacion_puesto,pruebas,tiempo_total_min,activa,created_at&order=created_at.desc`);
    const sessions = await supabaseRest<Array<Record<string, unknown>>>(`sesiones_evaluacion?reclutador_id=eq.${encodeURIComponent(user.id)}&select=id,codigo,bateria_id,candidato_nombre,candidato_edad,candidato_empresa,estado,resultados,pdf_path,created_at,finalizado_en,baterias(nombre,clasificacion_puesto,pruebas)&order=created_at.desc`);
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
      const accessIds = await allocateAssignmentIds(requestedTests.length);
      const assignments = requestedTests.map((test, index) => {
        const testId = test.testId ?? test.prueba_id ?? "";
        const seconds = Number(test.timeLimitSeconds ?? test.tiempo_limite_seg ?? 900);
        const order = index + 1;
        const accessId = isInterventionId(assignmentAccessId(test)) ? assignmentAccessId(test) : accessIds[index];
        return { prueba_id: testId, orden: order, tiempo_limite_seg: seconds, testId, order, timeLimitSeconds: seconds, asignacion_id: accessId, assignmentId: accessId };
      });
      const battery = await supabaseRest<Array<Record<string, unknown>>>("baterias", { method: "POST", headers: { Prefer: "return=representation" }, body: JSON.stringify({ reclutador_id: user.id, nombre: body.name?.trim() || defaultBattery.name, clasificacion_puesto: body.classification || "custom", pruebas: assignments, tiempo_total_min: totalMinutes }) });
      return Response.json({ battery: battery[0] });
    }
    if (body.action === "create-session" && body.batteryId) {
      const ownedBatteries = await supabaseRest<Array<{ id: string; nombre: string; pruebas: BatteryAssignment[] }>>(`baterias?id=eq.${encodeURIComponent(body.batteryId)}&reclutador_id=eq.${encodeURIComponent(user.id)}&select=id,nombre,pruebas&limit=1`);
      const ownedBattery = ownedBatteries[0];
      if (!ownedBattery) return jsonError("La batería no existe o no pertenece a este reclutador.", 404);
      const storedAssignments = asAssignments(ownedBattery.pruebas);
      const missingAccessIds = storedAssignments.filter((assignment) => !isInterventionId(assignmentAccessId(assignment))).length;
      const accessIds = missingAccessIds ? await allocateAssignmentIds(missingAccessIds) : [];
      let accessIndex = 0;
      const assignments = storedAssignments.map((assignment, index) => {
        const existingAccessId = assignmentAccessId(assignment);
        const accessId = isInterventionId(existingAccessId) ? existingAccessId.toUpperCase() : accessIds[accessIndex++];
        return {
          ...assignment,
          prueba_id: assignmentTestId(assignment),
          testId: assignmentTestId(assignment),
          orden: assignment.orden ?? assignment.order ?? index + 1,
          order: assignment.order ?? assignment.orden ?? index + 1,
          asignacion_id: accessId,
          assignmentId: accessId,
        };
      });
      if (!assignments.length) return jsonError("La batería no tiene pruebas asignadas.");
      if (assignments.some((assignment, index) => assignmentAccessId(storedAssignments[index]) !== assignmentAccessId(assignment))) {
        await supabaseRest(`baterias?id=eq.${encodeURIComponent(body.batteryId)}&reclutador_id=eq.${encodeURIComponent(user.id)}`, {
          method: "PATCH",
          headers: { Prefer: "return=minimal" },
          body: JSON.stringify({ pruebas: assignments }),
        });
      }
      for (let attempt = 0; attempt < 3; attempt += 1) {
        const code = `SB01-${crypto.randomUUID().replaceAll("-", "").slice(0, 8).toUpperCase()}`;
        try {
          const session = await supabaseRest<Array<Record<string, unknown>>>("sesiones_evaluacion", { method: "POST", headers: { Prefer: "return=representation" }, body: JSON.stringify({ codigo: code, bateria_id: body.batteryId, reclutador_id: user.id, estado: "creado" }) });
          return Response.json({ session: { ...session[0], baterias: { nombre: ownedBattery.nombre, pruebas: assignments } }, sharePath: `/evaluacion/${encodeURIComponent(code)}`, testLinks: testLinks(code, assignments) });
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
