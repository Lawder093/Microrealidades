import { assignmentTestId, batteryTestCatalog, defaultBattery, type BatteryAssignment } from "@/lib/psychometric-battery";
import { workspaceAccess } from "@/lib/ecosystem-server";
import { accessFailure, identityRest, identityRpc } from "@/lib/micro-id-server";

function jsonError(message: string, status = 400) {
  return Response.json({ error: message }, { status });
}

async function ensureRecruiter(token: string, user: { id: string; email?: string }) {
  const email = user.email ?? `${user.id}@reclutador.local`;
  const nombre = user.email?.split("@")[0] || "Reclutador";
  await identityRest(token,"reclutadores", {
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

export async function GET(request: Request) {

  try {
    const {token,user,workspace} = await workspaceAccess(request);
    await ensureRecruiter(token,user);
    const batteries = await identityRest<Array<Record<string, unknown>>>(token,`baterias?workspace_id=eq.${workspace.id}&reclutador_id=eq.${encodeURIComponent(user.id)}&select=id,nombre,clasificacion_puesto,pruebas,tiempo_total_min,activa,created_at&order=created_at.desc`);
    const sessions = await identityRest<Array<Record<string, unknown>>>(token,`sesiones_evaluacion?workspace_id=eq.${workspace.id}&reclutador_id=eq.${encodeURIComponent(user.id)}&select=id,codigo,access_token,bateria_id,candidato_nombre,candidato_edad,candidato_empresa,estado,resultados,pdf_path,created_at,finalizado_en,baterias(nombre,clasificacion_puesto,pruebas)&order=created_at.desc`);
    return Response.json({ batteries, sessions });
  } catch (error) {
    return accessFailure(error);
  }
}

export async function POST(request: Request) {

  try {
  const {token,user,workspace} = await workspaceAccess(request);
  const body = await request.json() as { action?: "create-battery" | "create-session"; name?: string; classification?: string; totalMinutes?: number; tests?: BatteryAssignment[]; batteryId?: string };
    if (!body || typeof body !== "object") return jsonError("Solicitud inválida.");
    if (body.name !== undefined && (typeof body.name !== "string" || body.name.length > 200)) return jsonError("Nombre de batería inválido.");
    await ensureRecruiter(token,user);
    if (body.action === "create-battery") {
      const requestedTests = Array.isArray(body.tests) ? body.tests : [];
      if (requestedTests.some((test) => !test || typeof test !== "object")) return jsonError("Formato de pruebas inválido.");
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
        return { prueba_id: testId, orden: order, tiempo_limite_seg: seconds };
      });
      const battery = await identityRest<Array<Record<string, unknown>>>(token,"baterias", { method: "POST", headers: { Prefer: "return=representation" }, body: JSON.stringify({ reclutador_id: user.id, organization_id: workspace.organization_id, workspace_id: workspace.id, nombre: body.name?.trim() || defaultBattery.name, clasificacion_puesto: body.classification || "custom", pruebas: assignments, tiempo_total_min: totalMinutes }) });
      return Response.json({ battery: battery[0] });
    }
    if (body.action === "create-session" && body.batteryId) {
      const ownedBatteries = await identityRest<Array<{ id: string; nombre: string; pruebas: BatteryAssignment[] }>>(token,`baterias?workspace_id=eq.${workspace.id}&id=eq.${encodeURIComponent(body.batteryId)}&reclutador_id=eq.${encodeURIComponent(user.id)}&select=id,nombre,pruebas&limit=1`);
      const ownedBattery = ownedBatteries[0];
      if (!ownedBattery) return jsonError("La batería no existe o no pertenece a este reclutador.", 404);
      const storedAssignments = asAssignments(ownedBattery.pruebas);
      const assignments = storedAssignments.map((assignment, index) => {
        return {
          prueba_id: assignmentTestId(assignment),
          orden: assignment.orden ?? assignment.order ?? index + 1,
          tiempo_limite_seg: assignment.tiempo_limite_seg ?? assignment.timeLimitSeconds ?? 900,
        };
      });
      if (!assignments.length) return jsonError("La batería no tiene pruebas asignadas.");
      let nextCode = await identityRpc<string>(token,"micro_next_evaluation_code",{p_workspace:workspace.id});
      for (let attempt = 0; attempt < 3; attempt += 1) {
        const code = nextCode;
        try {
          const session = await identityRest<Array<Record<string, unknown>>>(token,"sesiones_evaluacion", { method: "POST", headers: { Prefer: "return=representation" }, body: JSON.stringify({ codigo: code, bateria_id: body.batteryId, reclutador_id: user.id, organization_id: workspace.organization_id, workspace_id: workspace.id, estado: "creado" }) });
          return Response.json({ session: { ...session[0], baterias: { nombre: ownedBattery.nombre, pruebas: assignments } }, sharePath: `/evaluacion/${encodeURIComponent(code)}?t=${session[0].access_token}` });
        } catch (error) {
          if (attempt === 2) throw error;
          nextCode = await identityRpc<string>(token,"micro_next_evaluation_code",{p_workspace:workspace.id});
        }
      }
    }
    return jsonError("Acción no reconocida.");
  } catch (error) {
    return accessFailure(error);
  }
}
