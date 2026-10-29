import type { EvaluationPdfTest } from "@/lib/evaluation-pdf";
import { CATALOGO, type Respuesta } from "@/lib/evaluacion/motor";
import { CLAVES_RESPUESTAS } from "@/lib/evaluacion/claves-respuesta";
import { obtenerInterpretacionPrueba } from "@/lib/evaluacion/interpretaciones";
import type { ResultadoPrueba } from "@/types/evaluacion";

function canonicalize(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(canonicalize);
  if (typeof value === "object" && value !== null) {
    return Object.fromEntries(Object.entries(value).sort(([left], [right]) => left.localeCompare(right)).map(([key, entry]) => [key, canonicalize(entry)]));
  }
  return value;
}

export async function createEvaluationFolioHash(data: Record<string, unknown>) {
  const serialized = JSON.stringify(canonicalize(data)) ?? "{}";
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(serialized));
  return Array.from(new Uint8Array(digest)).map((value) => value.toString(16).padStart(2, "0")).join("");
}

/**
 * Prepara para el reporte los resultados persistidos y los desglose verificables
 * con el banco fijo. Los resultados siguen siendo descriptivos, no baremos.
 */
export function buildEvaluationPdfTests(
  results: ResultadoPrueba[] | undefined,
  answers: Record<string, Respuesta>,
  testDurationsSeconds: Record<string, number> = {},
) {
  return (results ?? []).flatMap((result): EvaluationPdfTest[] => {
    const test = CATALOGO[result.pruebaId];
    if (!test) return [];
    const kind = test.items.some((item) => item.tipo === "likert_5")
      ? "likert"
      : test.items.some((item) => item.tipo === "opcion_multiple" || item.tipo === "escenario_clinico")
        ? "knowledge"
        : "profile";
    const subareas = test.subareas.map((subarea) => {
      const items = test.items.filter((item) => item.tipo === "likert_5" || item.tipo === "forced_choice"
        ? item.factor === subarea
        : item.subarea === subarea);
      const score = result.puntuaciones[subarea] ?? null;
      if (kind !== "knowledge") return { label: subarea, score };
      const scoredItems = items.filter((item) => item.tipo === "opcion_multiple" || item.tipo === "escenario_clinico");
      const total = scoredItems.length;
      const correct = scoredItems.filter((item) => (item.tipo === "opcion_multiple" || item.tipo === "escenario_clinico")
        && answers[item.id] === CLAVES_RESPUESTAS[result.pruebaId]?.[item.id]).length;
      return { label: subarea, score: total ? score : null, correct, total };
    });
    const validityAlerts: string[] = [];
    const durationSeconds = testDurationsSeconds[result.pruebaId];
    if (test.items.length >= 30 && durationSeconds !== undefined && durationSeconds < 180) {
      validityAlerts.push("Tiempo reportado inferior a 3 minutos para una prueba de 30 o más ítems. Revisar con cautela; el dato proviene del navegador y no es evidencia concluyente.");
    }
    const responseCounts = new Map<string, number>();
    for (const item of test.items) {
      const answer = answers[item.id];
      if (answer !== undefined) responseCounts.set(String(answer), (responseCounts.get(String(answer)) ?? 0) + 1);
    }
    const mostCommonResponseCount = Math.max(0, ...responseCounts.values());
    if (test.items.length > 0 && mostCommonResponseCount / test.items.length > 0.8) {
      const keyValues = Object.values(CLAVES_RESPUESTAS[result.pruebaId] ?? {});
      const mostCommonKeyCount = Math.max(0, ...Object.values(keyValues.reduce<Record<string, number>>((counts, value) => {
        counts[value] = (counts[value] ?? 0) + 1;
        return counts;
      }, {})));
      const keyIsConcentrated = keyValues.length > 0 && mostCommonKeyCount / keyValues.length > 0.8;
      validityAlerts.push(keyIsConcentrated
        ? "Más del 80% de las respuestas usa la misma opción. La clave de este banco también está concentrada en una opción; la señal puede reflejar el diseño de reactivos y no respuesta al azar."
        : "Más del 80% de las respuestas usa la misma opción. Revisar el patrón junto con el contexto; por sí solo no demuestra respuesta al azar ni invalida el resultado.");
    }
    return [{
      id: result.pruebaId,
      title: test.nombre,
      kind,
      score: result.porcentaje ?? null,
      answered: test.items.filter((item) => answers[item.id] !== undefined).length,
      total: test.items.length,
      ...(result.aciertos === undefined ? {} : { correct: result.aciertos }),
      ...(result.total === undefined ? {} : { correctTotal: result.total }),
      band: result.banda ?? null,
      subareas,
      ...(durationSeconds === undefined ? {} : { durationSeconds }),
      ...(validityAlerts.length ? { validityAlerts } : {}),
      interpretation: obtenerInterpretacionPrueba(result.pruebaId, result.porcentaje, result.banda ?? "", result.puntuaciones),
    }];
  });
}
