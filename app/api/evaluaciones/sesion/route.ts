import { assignmentTestId, calculateConfiguredBatteryResult, getBatteryItems, type BatteryAssignment } from "@/lib/psychometric-battery";
import type { Respuesta } from "@/lib/evaluacion/motor";
import { supabaseIsConfigured, supabaseRest, supabaseStorageUpload } from "@/lib/supabase-rest";
import { createEvaluationPdf } from "@/lib/evaluation-pdf";

type SessionRow = { id: string; codigo: string; bateria_id: string; estado: string; candidato_nombre: string | null; candidato_edad: number | null; candidato_empresa: string | null; baterias: { nombre: string; pruebas: BatteryAssignment[]; tiempo_total_min: number } | null };

function jsonError(message: string, status = 400) {
  return Response.json({ error: message }, { status });
}

export async function POST(request: Request) {
  if (!supabaseIsConfigured()) return jsonError("La conexión segura de Supabase aún no está configurada.", 503);
  const body = await request.json() as { action?: "start" | "complete"; code?: string; sessionId?: string; name?: string; age?: number; company?: string; responses?: Record<string, Respuesta> };
  const code = body.code?.trim().toUpperCase();
  if (!code) return jsonError("Código requerido.");

  try {
    const sessions = await supabaseRest<SessionRow[]>(`sesiones_evaluacion?codigo=eq.${encodeURIComponent(code)}&select=id,codigo,bateria_id,estado,candidato_nombre,candidato_edad,candidato_empresa,baterias(nombre,pruebas,tiempo_total_min)&limit=1`);
    const session = sessions[0];
    if (!session) return jsonError("Código no encontrado.", 404);
    if (session.estado === "bloqueado") return jsonError("Esta sesión está bloqueada.", 423);

    if (body.action === "complete") {
      if (!body.sessionId || body.sessionId !== session.id || !body.responses) return jsonError("Sesión o respuestas inválidas.");
      if (session.estado === "completado") return jsonError("Este código ya fue utilizado.", 409);
      if (session.estado !== "en_progreso") return jsonError("La sesión todavía no ha sido iniciada.", 409);
      const testIds = session.baterias?.pruebas?.map(assignmentTestId).filter(Boolean) ?? [];
      const assignedItems = getBatteryItems(testIds);
      const assignedIds = new Set(assignedItems.map((item) => item.id));
      const responseIds = Object.keys(body.responses);
      if (responseIds.some((id) => !assignedIds.has(id)) || assignedItems.some((item) => body.responses?.[item.id] === undefined)) {
        return jsonError("La respuesta no coincide con los ítems asignados a esta batería.");
      }
      const results = calculateConfiguredBatteryResult(testIds, body.responses);
      const reportPdf = createEvaluationPdf({ code, candidateName: session.candidato_nombre, candidateAge: session.candidato_edad, candidateCompany: session.candidato_empresa, completedAt: new Date().toISOString(), globalScore: results.globalScore, dimensions: results.dimensions });
      let pdfPath: string | null = null;
      let pdfHash: string | null = null;
      try {
        const digest = await crypto.subtle.digest("SHA-256", reportPdf);
        pdfHash = Array.from(new Uint8Array(digest)).map((value) => value.toString(16).padStart(2, "0")).join("");
        await supabaseStorageUpload(`evaluaciones-pdf/${encodeURIComponent(session.id)}.pdf`, reportPdf);
        pdfPath = `evaluaciones-pdf/${session.id}.pdf`;
      } catch {
        // Completion remains available even when Storage has not been provisioned yet.
      }
      await supabaseRest(`sesiones_evaluacion?id=eq.${encodeURIComponent(session.id)}&codigo=eq.${encodeURIComponent(code)}`, { method: "PATCH", headers: { Prefer: "return=minimal" }, body: JSON.stringify({ respuestas: body.responses, resultados: results, estado: "completado", finalizado_en: new Date().toISOString(), pdf_path: pdfPath, pdf_hash: pdfHash }) });
      return Response.json({ ok: true, results });
    }

    if (session.estado === "completado") return jsonError("Este código ya fue utilizado.", 409);
    if (session.estado === "en_progreso") return jsonError("Esta sesión ya está en progreso y no puede abrirse de nuevo.", 409);
    await supabaseRest(`sesiones_evaluacion?id=eq.${encodeURIComponent(session.id)}`, { method: "PATCH", headers: { Prefer: "return=minimal" }, body: JSON.stringify({ candidato_nombre: body.name?.trim() || null, candidato_edad: body.age || null, candidato_empresa: body.company?.trim() || null, estado: "en_progreso", iniciado_en: new Date().toISOString(), user_agent: request.headers.get("user-agent") }) });
    return Response.json({ sessionId: session.id, status: "en_progreso", battery: session.baterias });
  } catch (error) {
    return jsonError(error instanceof Error ? error.message : "No se pudo procesar la sesión.", 500);
  }
}
