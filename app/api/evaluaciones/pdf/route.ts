import { supabaseConfigurationError, supabaseIsConfigured, supabaseRest, supabaseStorageUpload, supabaseUser } from "@/lib/supabase-rest";
import { createEvaluationPdf } from "@/lib/evaluation-pdf";
import { buildEvaluationPdfTests, createEvaluationFolioHash } from "@/lib/evaluation-pdf-data";
import type { Respuesta } from "@/lib/evaluacion/motor";
import type { ResultadoPrueba } from "@/types/evaluacion";

type SessionReport = {
  codigo: string;
  candidato_nombre: string | null;
  candidato_edad: number | null;
  candidato_empresa: string | null;
  respuestas: Record<string, Respuesta> | null;
  baterias: { clasificacion_puesto?: string } | null;
  pdf_path: string | null;
  resultados: {
    globalScore?: number | null;
    dimensions?: Array<{ dimension: string; score: number | null; answered: number; total: number }>;
    timedOut?: boolean;
    testDurationsSeconds?: Record<string, number>;
    clinicalResult?: { resumenEjecutivo?: string; resultadosPorPrueba?: ResultadoPrueba[] };
  } | null;
  finalizado_en: string | null;
};

export async function GET(request: Request) {
  if (!supabaseIsConfigured()) return Response.json({ error: supabaseConfigurationError() ?? "Supabase no está configurado." }, { status: 503 });
  const token = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
  const sessionId = new URL(request.url).searchParams.get("sessionId");
  if (!token || !sessionId) return Response.json({ error: "Autenticación y sesión requeridas." }, { status: 401 });
  const user = await supabaseUser(token);
  if (!user) return Response.json({ error: "Sesión no válida." }, { status: 401 });
  const sessions = await supabaseRest<SessionReport[]>(`sesiones_evaluacion?id=eq.${encodeURIComponent(sessionId)}&reclutador_id=eq.${encodeURIComponent(user.id)}&select=codigo,candidato_nombre,candidato_edad,candidato_empresa,respuestas,resultados,pdf_path,finalizado_en,baterias(clasificacion_puesto)&limit=1`);
  const session = sessions[0];
  if (!session) return Response.json({ error: "Resultado no encontrado." }, { status: 404 });
  const headers = { "Content-Type": "application/pdf", "Content-Disposition": `attachment; filename="super-bateria-${session.codigo}.pdf"`, "Cache-Control": "no-store" };
  const interpretations = session.resultados?.clinicalResult?.resultadosPorPrueba?.map((result) => ({ title: result.pruebaId, text: result.interpretacionTecnica || result.interpretacion || "" })).filter((entry) => Boolean(entry.text));
  const folioHash = await createEvaluationFolioHash({ code: session.codigo, candidateName: session.candidato_nombre, candidateAge: session.candidato_edad, candidateCompany: session.candidato_empresa, completedAt: session.finalizado_en, responses: session.respuestas ?? {}, results: session.resultados });
  const pdf = createEvaluationPdf({ code: session.codigo, classification: session.baterias?.clasificacion_puesto, candidateName: session.candidato_nombre, candidateAge: session.candidato_edad, candidateCompany: session.candidato_empresa, completedAt: session.finalizado_en, folioHash, globalScore: session.resultados?.globalScore, executiveSummary: session.resultados?.clinicalResult?.resumenEjecutivo, dimensions: session.resultados?.dimensions, tests: buildEvaluationPdfTests(session.resultados?.clinicalResult?.resultadosPorPrueba, session.respuestas ?? {}, session.resultados?.testDurationsSeconds), interpretations, timedOut: session.resultados?.timedOut });
  if (session.pdf_path) {
    try {
      const digest = await crypto.subtle.digest("SHA-256", pdf);
      const pdfHash = Array.from(new Uint8Array(digest)).map((value) => value.toString(16).padStart(2, "0")).join("");
      await supabaseStorageUpload(session.pdf_path, pdf);
      await supabaseRest(`sesiones_evaluacion?id=eq.${encodeURIComponent(sessionId)}&reclutador_id=eq.${encodeURIComponent(user.id)}`, {
        method: "PATCH",
        headers: { Prefer: "return=minimal" },
        body: JSON.stringify({ pdf_hash: pdfHash }),
      });
    } catch {
      // Se entrega el reporte actualizado aunque Storage no esté disponible temporalmente.
    }
  }
  return new Response(pdf, { headers });
}
