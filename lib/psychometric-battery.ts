import { CATALOGO, calificarSesion, respuestasPorPrueba, type Respuesta } from "@/lib/evaluacion/motor";
import type { EvaluationItem } from "@/lib/evaluation-items";
import {
  defaultBattery,
  getBatteryItems,
  getClinicalTestIds,
} from "@/lib/psychometric-battery-public";

export {
  assignmentTestId,
  batteryPresets,
  batteryTestCatalog,
  clinicalPsychometricTests,
  defaultBattery,
  getBatteryItems,
} from "@/lib/psychometric-battery-public";
export type { BatteryAssignment, BatteryClassification, PsychometricTest } from "@/lib/psychometric-battery-public";

export function calculateConfiguredBatteryResult(testIds: string[], responses: Record<string, Respuesta>) {
  const selectedIds = testIds.length ? testIds : defaultBattery.tests.map((test) => test.testId);
  const clinicalIds = getClinicalTestIds(selectedIds);
  const clinicalResponses = respuestasPorPrueba(clinicalIds, responses);
  const clinicalResult = clinicalIds.length ? calificarSesion(clinicalIds, clinicalResponses) : undefined;
  const clinicalDimensions = clinicalResult?.resultadosPorPrueba.map((result) => {
    const total = CATALOGO[result.pruebaId]?.items.length ?? result.total ?? 0;
    const answered = Object.keys(clinicalResponses[result.pruebaId] ?? {}).length;
    return { dimension: result.pruebaId, answered, total, score: result.porcentaje ?? null, rawMean: result.porcentaje == null ? null : result.porcentaje / 20 };
  }) ?? [];
  // El índice global resume solo pruebas objetivas. Los perfiles y
  // autoinformes se muestran por separado y no se mezclan con aciertos.
  const objectiveScores = clinicalDimensions
    .filter((dimension) => CATALOGO[dimension.dimension]?.items.some((item) => item.tipo === "opcion_multiple" || item.tipo === "escenario_clinico"))
    .map((dimension) => dimension.score)
    .filter((score): score is number => score !== null);
  const globalScore = objectiveScores.length ? Math.round(objectiveScores.reduce((sum, score) => sum + score, 0) / objectiveScores.length) : null;
  const total = getBatteryItems(selectedIds).length;
  const answered = Object.keys(responses).length;
  return { answered, total, globalScore, dimensions: clinicalDimensions, clinicalResult } satisfies {
    answered: number;
    total: number;
    globalScore: number | null;
    dimensions: Array<{ dimension: string; answered: number; total: number; score: number | null; rawMean: number | null }>;
    clinicalResult: ReturnType<typeof calificarSesion> | undefined;
  };
}

export function getConfiguredBatteryItems(testIds: string[]): EvaluationItem[] {
  return getBatteryItems(testIds);
}

export { getClinicalTestIds } from "@/lib/psychometric-battery-public";
