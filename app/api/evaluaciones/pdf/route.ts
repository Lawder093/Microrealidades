import { supabaseConfigurationError, supabaseIsConfigured, supabaseRest, supabaseStorageDownload, supabaseUser } from "@/lib/supabase-rest";
import { createEvaluationPdf } from "@/lib/evaluation-pdf";

type SessionReport = {
  codigo: string;
  candidato_nombre: string | null;
  candidato_edad: number | null;
  candidato_empresa: string | null;
  pdf_path: string | null;
  resultados: {
    globalScore?: number | null;
    dimensions?: Array<{ dimension: string; score: number | null; answered: number; total: number }>;
    timedOut?: boolean;
    clinicalResult?: { resultadosPorPrueba?: Array<{ pruebaId: string; interpretacion?: string; interpretacionTecnica?: string }> };
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
  const sessions = await supabaseRest<SessionReport[]>(`sesiones_evaluacion?id=eq.${encodeURIComponent(sessionId)}&reclutador_id=eq.${encodeURIComponent(user.id)}&select=codigo,candidato_nombre,candidato_edad,candidato_empresa,resultados,pdf_path,finalizado_en&limit=1`);
  const session = sessions[0];
  if (!session) return Response.json({ error: "Resultado no encontrado." }, { status: 404 });
  const headers = { "Content-Type": "application/pdf", "Content-Disposition": `attachment; filename="super-bateria-${session.codigo}.pdf"`, "Cache-Control": "no-store" };
  if (session.pdf_path) {
    try {
      return new Response(await supabaseStorageDownload(session.pdf_path), { headers });
    } catch {
      // Los reportes antiguos pueden no existir en Storage; se regeneran abajo.
    }
  }
  const interpretations = session.resultados?.clinicalResult?.resultadosPorPrueba?.map((result) => ({ title: result.pruebaId, text: result.interpretacionTecnica || result.interpretacion || "" })).filter((entry) => Boolean(entry.text));
  return new Response(createEvaluationPdf({ code: session.codigo, candidateName: session.candidato_nombre, candidateAge: session.candidato_edad, candidateCompany: session.candidato_empresa, completedAt: session.finalizado_en, globalScore: session.resultados?.globalScore, dimensions: session.resultados?.dimensions, interpretations, timedOut: session.resultados?.timedOut }), { headers });
}
