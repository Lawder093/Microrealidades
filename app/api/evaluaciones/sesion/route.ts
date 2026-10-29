import type { EvaluationItem } from "@/lib/evaluation-items";
import { assignmentAccessId, assignmentTestId, calculateConfiguredBatteryResult, getBatteryItems, type BatteryAssignment } from "@/lib/psychometric-battery";
import type { Respuesta } from "@/lib/evaluacion/motor";
import { supabaseConfigurationError, supabaseIsConfigured, supabaseRest, supabaseStorageUpload } from "@/lib/supabase-rest";
import { createEvaluationPdf } from "@/lib/evaluation-pdf";

type SecurityEventType = "refresh" | "tab_change" | "copy" | "paste" | "blur" | "right_click";
type SessionRow = {
  id: string;
  codigo: string;
  bateria_id: string;
  estado: string;
  candidato_nombre: string | null;
  candidato_edad: number | null;
  candidato_empresa: string | null;
  iniciado_en: string | null;
  reanudacion_token?: string | null;
  baterias: { nombre: string; pruebas: BatteryAssignment[]; tiempo_total_min: number } | null;
};

const securityEventTypes: SecurityEventType[] = ["refresh", "tab_change", "copy", "paste", "blur", "right_click"];

function jsonError(message: string, status = 400) {
  return Response.json({ error: message }, { status });
}

function requestIp(request: Request) {
  return request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || request.headers.get("x-real-ip") || null;
}

function resumeCookieName(code: string) {
  return `sb01_resume_${code.replace(/[^A-Z0-9_-]/g, "_")}`;
}

function readCookie(request: Request, name: string) {
  const cookies = request.headers.get("cookie")?.split(";") ?? [];
  const cookie = cookies.find((entry) => entry.trim().startsWith(`${name}=`));
  return cookie ? decodeURIComponent(cookie.trim().slice(name.length + 1)) : null;
}

function resumeCookie(name: string, token: string) {
  const secure = process.env.NODE_ENV === "production" ? "; Secure" : "";
  return `${name}=${encodeURIComponent(token)}; Path=/; Max-Age=86400; SameSite=Lax; HttpOnly${secure}`;
}

async function getSessionByCode(code: string) {
  const select = "id,codigo,bateria_id,estado,candidato_nombre,candidato_edad,candidato_empresa,iniciado_en,reanudacion_token,baterias(nombre,pruebas,tiempo_total_min)";
  try {
    const sessions = await supabaseRest<SessionRow[]>(`sesiones_evaluacion?codigo=eq.${encodeURIComponent(code)}&select=${select}&limit=1`);
    return { session: sessions[0], hasResumeColumn: true };
  } catch (error) {
    // Compatibilidad con proyectos que todavía no ejecutaron la migración de reanudación.
    if (!(error instanceof Error && error.message.includes("400"))) throw error;
    const fallbackSelect = "id,codigo,bateria_id,estado,candidato_nombre,candidato_edad,candidato_empresa,iniciado_en,baterias(nombre,pruebas,tiempo_total_min)";
    const sessions = await supabaseRest<SessionRow[]>(`sesiones_evaluacion?codigo=eq.${encodeURIComponent(code)}&select=${fallbackSelect}&limit=1`);
    return { session: sessions[0], hasResumeColumn: false };
  }
}

function responseIsValid(item: EvaluationItem, value: Respuesta) {
  if (item.type === "likert") return typeof value === "number" && Number.isInteger(value) && value >= 1 && value <= 5;
  const allowed = item.options?.map((option) => item.correctValue ? option.value : option.score) ?? [];
  return allowed.some((candidate) => candidate === value);
}

function validateResponses(items: EvaluationItem[], responses: Record<string, Respuesta>, allowIncomplete: boolean) {
  const assignedIds = new Set(items.map((item) => item.id));
  const responseIds = Object.keys(responses);
  if (responseIds.some((id) => !assignedIds.has(id))) return "La respuesta no coincide con los ítems asignados a esta batería.";
  if (!allowIncomplete && items.some((item) => responses[item.id] === undefined)) return "Responde todos los ítems antes de enviar la aplicación.";
  if (responseIds.some((id) => {
    const item = items.find((candidate) => candidate.id === id);
    return !item || !responseIsValid(item, responses[id]);
  })) return "Una o más respuestas no tienen un valor válido.";
  return null;
}

function interpretationEntries(results: ReturnType<typeof calculateConfiguredBatteryResult>) {
  return results.clinicalResult?.resultadosPorPrueba
    .map((result) => ({ title: result.pruebaId, text: result.interpretacionTecnica || result.interpretacion }))
    .filter((entry) => Boolean(entry.text)) ?? [];
}

export async function POST(request: Request) {
  if (!supabaseIsConfigured()) return jsonError(supabaseConfigurationError() ?? "La conexión segura de Supabase aún no está configurada.", 503);
  let body: {
    action?: "start" | "complete" | "security-event";
    code?: string;
    sessionId?: string;
    testAccessId?: string;
    name?: string;
    age?: number;
    company?: string;
    responses?: Record<string, Respuesta>;
    timedOut?: boolean;
    type?: SecurityEventType;
    detail?: unknown;
  };
  try {
    body = await request.json() as typeof body;
  } catch {
    return jsonError("La solicitud no contiene JSON válido.");
  }
  const code = typeof body.code === "string" ? body.code.trim().toUpperCase() : "";
  if (!code) return jsonError("Código requerido.");

  try {
    const { session, hasResumeColumn } = await getSessionByCode(code);
    if (!session) return jsonError("Código no encontrado.", 404);
    const testAccessId = typeof body.testAccessId === "string" ? body.testAccessId.trim().toUpperCase() : "";
    if (testAccessId) {
      const validAccessId = session.baterias?.pruebas?.some((assignment) => assignmentAccessId(assignment).toUpperCase() === testAccessId);
      if (!validAccessId) return jsonError("El ID de prueba no pertenece a esta aplicación.", 404);
    }
    const cookieName = resumeCookieName(code);
    const cookieToken = readCookie(request, cookieName);
    if (session.estado === "bloqueado") return jsonError("Esta sesión está bloqueada.", 423);

    if (body.action === "security-event") {
      if (!body.sessionId || body.sessionId !== session.id || !body.type || !securityEventTypes.includes(body.type)) return jsonError("Evento de seguridad inválido.");
      if (session.estado !== "en_progreso") return jsonError("La sesión no está activa.", 409);
      if (session.reanudacion_token && cookieToken !== session.reanudacion_token) return jsonError("La sesión pertenece a otro navegador.", 409);
      const serializedDetail = typeof body.detail === "object" && body.detail !== null ? JSON.stringify(body.detail) : undefined;
      const rawDetail = serializedDetail ?? String(body.detail ?? "");
      const detail = { value: rawDetail.slice(0, 500) };
      await supabaseRest("eventos_seguridad", { method: "POST", headers: { Prefer: "return=minimal" }, body: JSON.stringify({ sesion_id: session.id, tipo: body.type, detalle: detail, ip: requestIp(request) }) });
      return Response.json({ ok: true });
    }

    if (body.action === "complete") {
      if (!body.sessionId || body.sessionId !== session.id || !body.responses) return jsonError("Sesión o respuestas inválidas.");
      if (session.estado === "completado") return jsonError("Este código ya fue utilizado.", 409);
      if (session.estado !== "en_progreso") return jsonError("La sesión no está disponible para finalizar.", 409);
      if (session.reanudacion_token && cookieToken !== session.reanudacion_token) return jsonError("La sesión pertenece a otro navegador.", 409);

      const testIds = session.baterias?.pruebas?.map(assignmentTestId).filter(Boolean) ?? [];
      const assignedItems = getBatteryItems(testIds);
      const timedOut = Boolean(body.timedOut);
      const serverExpired = session.iniciado_en && session.baterias?.tiempo_total_min
        ? Date.now() - new Date(session.iniciado_en).getTime() >= session.baterias.tiempo_total_min * 60_000
        : false;
      const validationError = validateResponses(assignedItems, body.responses, timedOut || serverExpired);
      if (validationError) return jsonError(validationError);

      const results = calculateConfiguredBatteryResult(testIds, body.responses);
      const completedAt = new Date().toISOString();
      const reportPdf = createEvaluationPdf({
        code,
        candidateName: session.candidato_nombre,
        candidateAge: session.candidato_edad,
        candidateCompany: session.candidato_empresa,
        completedAt,
        globalScore: results.globalScore,
        dimensions: results.dimensions,
        interpretations: interpretationEntries(results),
        timedOut: timedOut || serverExpired,
      });
      const pdfPath = `evaluaciones-pdf/${encodeURIComponent(session.id)}.pdf`;
      let pdfHash = "";
      try {
        const digest = await crypto.subtle.digest("SHA-256", reportPdf);
        pdfHash = Array.from(new Uint8Array(digest)).map((value) => value.toString(16).padStart(2, "0")).join("");
        await supabaseStorageUpload(pdfPath, reportPdf);
      } catch {
        return jsonError("No se pudo guardar el PDF. La aplicación sigue disponible para reintentar.", 503);
      }

      const resumeFilter = hasResumeColumn && session.reanudacion_token
        ? `&reanudacion_token=eq.${encodeURIComponent(session.reanudacion_token)}`
        : "";
      const updated = await supabaseRest<Array<{ id: string }>>(`sesiones_evaluacion?id=eq.${encodeURIComponent(session.id)}&estado=eq.en_progreso${resumeFilter}`, {
        method: "PATCH",
        headers: { Prefer: "return=representation" },
        body: JSON.stringify({ respuestas: body.responses, resultados: { ...results, timedOut: timedOut || serverExpired }, estado: "completado", finalizado_en: completedAt, pdf_path: pdfPath, pdf_hash: pdfHash, ip_fin: requestIp(request) }),
      });
      if (!updated?.[0]) return jsonError("La sesión ya fue finalizada por otra solicitud.", 409);
      return Response.json({ ok: true, results: { ...results, timedOut: timedOut || serverExpired } });
    }

    if (session.estado === "completado") return jsonError("Este código ya fue utilizado.", 409);
    if (session.estado === "en_progreso") {
      if (session.reanudacion_token && cookieToken !== session.reanudacion_token) return jsonError("Esta evaluación ya está activa en otro navegador.", 409);
      return Response.json({ sessionId: session.id, status: "en_progreso", resumed: true, battery: session.baterias });
    }
    if (session.estado !== "creado") return jsonError("La sesión no está disponible.", 409);

    const candidateName = typeof body.name === "string" ? body.name.trim() : "";
    const candidateCompany = typeof body.company === "string" ? body.company.trim() : "";
    const candidateAge = Number(body.age);
    if (!candidateName || candidateName.length > 160) return jsonError("Escribe un nombre válido.");
    if (!Number.isInteger(candidateAge) || candidateAge < 14 || candidateAge > 100) return jsonError("La edad debe estar entre 14 y 100.");
    if (candidateCompany.length > 200) return jsonError("La empresa no puede superar 200 caracteres.");

    const newResumeToken = crypto.randomUUID();
    const claimed = await supabaseRest<Array<{ id: string }>>(`sesiones_evaluacion?id=eq.${encodeURIComponent(session.id)}&estado=eq.creado`, {
      method: "PATCH",
      headers: { Prefer: "return=representation" },
      body: JSON.stringify({
        candidato_nombre: candidateName,
        candidato_edad: candidateAge,
        candidato_empresa: candidateCompany || null,
        estado: "en_progreso",
        iniciado_en: new Date().toISOString(),
        ip_inicio: requestIp(request),
        user_agent: request.headers.get("user-agent"),
        ...(hasResumeColumn ? { reanudacion_token: newResumeToken } : {}),
      }),
    });
    if (!claimed?.[0]) return jsonError("Esta sesión acaba de ser tomada por otra solicitud. Vuelve a abrir la liga.", 409);
    const headers = hasResumeColumn ? { "Set-Cookie": resumeCookie(cookieName, newResumeToken) } : undefined;
    return Response.json({ sessionId: session.id, status: "en_progreso", battery: session.baterias }, headers ? { headers } : undefined);
  } catch (error) {
    return jsonError(error instanceof Error ? error.message : "No se pudo procesar la sesión.", 500);
  }
}
