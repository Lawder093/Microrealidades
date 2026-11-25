import { workspaceAccess } from "@/lib/ecosystem-server";
import { accessFailure, identityRest } from "@/lib/micro-id-server";
import { supabaseConfigurationError, supabaseIsConfigured, supabaseStorageDownload } from "@/lib/supabase-rest";
import { createEvaluationPdf } from "@/lib/evaluation-pdf";
import { buildEvaluationPdfTests, createEvaluationFolioHash } from "@/lib/evaluation-pdf-data";
import type { Respuesta } from "@/lib/evaluacion/motor";
import type { ResultadoPrueba } from "@/types/evaluacion";

type SessionReport = {
  codigo: string;
  estado: string;
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
  try {
  const {token,user,workspace} = await workspaceAccess(request);
  const sessionId = new URL(request.url).searchParams.get("sessionId");
  if (!sessionId) return Response.json({error:"Falta la sesión."},{status:400});
  const sessions = await identityRest<SessionReport[]>(token,`sesiones_evaluacion?workspace_id=eq.${workspace.id}&id=eq.${encodeURIComponent(sessionId)}&reclutador_id=eq.${encodeURIComponent(user.id)}&select=codigo,estado,candidato_nombre,candidato_edad,candidato_empresa,respuestas,resultados,pdf_path,finalizado_en,baterias(clasificacion_puesto)&limit=1`);
  const session = sessions[0];
  if (!session) return Response.json({ error: "Resultado no encontrado." }, { status: 404 });
  if (session.estado !== "completado") return Response.json({error:"La aplicación aún no está completada."},{status:409});
  const headers = { "Content-Type": "application/pdf", "Content-Disposition": `attachment; filename="microtalento-${session.codigo}.pdf"`, "Cache-Control": "no-store" };
  if (session.pdf_path) {
    try { return new Response(await supabaseStorageDownload(session.pdf_path),{headers}); }
    catch { /* Un histórico sin archivo conserva la posibilidad de reconstruir el reporte sin modificarlo. */ }
  }
  const interpretations = session.resultados?.clinicalResult?.resultadosPorPrueba?.map((result) => ({ title: result.pruebaId, text: result.interpretacionTecnica || result.interpretacion || "" })).filter((entry) => Boolean(entry.text));
  const folioHash = await createEvaluationFolioHash({ code: session.codigo, candidateName: session.candidato_nombre, candidateAge: session.candidato_edad, candidateCompany: session.candidato_empresa, completedAt: session.finalizado_en, responses: session.respuestas ?? {}, results: session.resultados });
  const pdf = createEvaluationPdf({ code: session.codigo, classification: session.baterias?.clasificacion_puesto, candidateName: session.candidato_nombre, candidateAge: session.candidato_edad, candidateCompany: session.candidato_empresa, completedAt: session.finalizado_en, folioHash, globalScore: session.resultados?.globalScore, executiveSummary: session.resultados?.clinicalResult?.resumenEjecutivo, dimensions: session.resultados?.dimensions, tests: buildEvaluationPdfTests(session.resultados?.clinicalResult?.resultadosPorPrueba, session.respuestas ?? {}, session.resultados?.testDurationsSeconds), interpretations, timedOut: session.resultados?.timedOut });
  return new Response(pdf, { headers });
  } catch(error) { return accessFailure(error); }
}
