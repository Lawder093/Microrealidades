import { defaultEvaluationItems, evaluationDimensions, type EvaluationItem } from "@/lib/evaluation-items";
import { CATALOGO, calificarSesion, respuestasPorPrueba, type Respuesta } from "@/lib/evaluacion/motor";
import { calculateApplicationResult } from "@/lib/evaluation-engine";
import type { Prueba } from "@/types/evaluacion";

export type PsychometricTest = {
  id: string;
  name: string;
  description: string;
  itemIds: string[];
  source: "base" | "clinical";
  clinicalTestId?: string;
};

export type BatteryClassification = "1-A" | "1-B" | "2-A" | "2-B" | "3-A" | "3-B" | "3-C" | "3-D" | "PSIC-CLIN-INF" | "custom";

export const psychometricTests: PsychometricTest[] = evaluationDimensions.map((dimension) => ({
  id: `dimension-${dimension.id}`,
  name: dimension.label,
  description: dimension.description,
  itemIds: defaultEvaluationItems.filter((item) => item.dimension === dimension.id).map((item) => item.id),
  source: "base",
}));

export const clinicalPsychometricTests: PsychometricTest[] = Object.values(CATALOGO).map((test) => ({
  id: `clinical-${test.id}`,
  name: test.nombre,
  description: test.instrucciones,
  itemIds: test.items.map((item) => item.id),
  source: "clinical",
  clinicalTestId: test.id,
}));

export const batteryTestCatalog = [...psychometricTests, ...clinicalPsychometricTests];

export const defaultBattery = {
  id: "base-super-bateria-01",
  name: "Super batería 01",
  classification: "custom" as BatteryClassification,
  tests: psychometricTests.map((test, index) => ({ testId: test.id, order: index + 1, timeLimitSeconds: 360 })),
  totalMinutes: 30,
};

export const batteryPresets = [
  defaultBattery,
  {
    id: "psic-clin-inf",
    name: "Psic-Clin-Inf · Clínica infantil / Autismo",
    classification: "PSIC-CLIN-INF" as BatteryClassification,
    tests: clinicalPsychometricTests.map((test, index) => ({ testId: test.id, order: index + 1, timeLimitSeconds: 900 })),
    totalMinutes: 75,
  },
];

function clinicalItemToEvaluationItem(test: Prueba, item: Prueba["items"][number]): EvaluationItem {
  const dimension = test.id === "personalidad_trabajo" ? "personality" : test.id === "relacion_terapeutica" ? "therapeutic" : test.id === "etica_profesionalismo" ? "ethics" : test.id === "habilidades_conocimientos" ? "skills" : "judgment";
  if (item.tipo === "likert_5") {
    return { id: item.id, dimension, type: "likert", prompt: item.enunciado, active: true, sourceTestId: test.id, subarea: item.factor };
  }
  if (item.tipo === "forced_choice") {
    return { id: item.id, dimension, type: "case", prompt: item.enunciado, active: true, sourceTestId: test.id, options: item.opciones.map((option) => ({ value: option.valor, label: option.etiqueta, score: option.puntuacion ?? 1 })) };
  }
  return {
    id: item.id,
    dimension,
    type: item.tipo === "escenario_clinico" ? "case" : "knowledge",
    prompt: item.enunciado,
    active: true,
    sourceTestId: test.id,
    subarea: item.subarea,
    correctValue: item.respuestaCorrecta,
    options: item.opciones.map((option) => ({ value: option.valor, label: option.etiqueta, score: option.valor === item.respuestaCorrecta ? 5 : 1 })),
  };
}

export function getClinicalTestIds(testIds: string[]) {
  return batteryTestCatalog.filter((test) => test.source === "clinical" && testIds.includes(test.id)).map((test) => test.clinicalTestId as string);
}

export function getBatteryItems(testIds: string[], items: EvaluationItem[] = defaultEvaluationItems) {
  const selectedIds = testIds.length ? testIds : defaultBattery.tests.map((test) => test.testId);
  const ids = new Set(batteryTestCatalog.filter((test) => selectedIds.includes(test.id)).flatMap((test) => test.itemIds));
  const legacyItems = items.filter((item) => ids.has(item.id));
  const clinicalItems = batteryTestCatalog.filter((test) => test.source === "clinical" && selectedIds.includes(test.id)).flatMap((test) => {
    const clinicalTest = test.clinicalTestId ? CATALOGO[test.clinicalTestId] : undefined;
    return clinicalTest ? clinicalTest.items.map((item) => clinicalItemToEvaluationItem(clinicalTest, item)) : [];
  });
  return [...legacyItems, ...clinicalItems.filter((item) => !legacyItems.some((existing) => existing.id === item.id))];
}

export function calculateConfiguredBatteryResult(testIds: string[], responses: Record<string, Respuesta>) {
  const selectedIds = testIds.length ? testIds : defaultBattery.tests.map((test) => test.testId);
  const clinicalIds = getClinicalTestIds(selectedIds);
  const legacyItems = getBatteryItems(selectedIds).filter((item) => !item.sourceTestId);
  const legacyValues = Object.fromEntries(Object.entries(responses).filter(([id]) => legacyItems.some((item) => item.id === id)));
  const legacyResult = legacyItems.length ? { answered: Object.keys(legacyValues).length, total: legacyItems.length, globalScore: null as number | null, dimensions: [] as Array<{ dimension: string; answered: number; total: number; score: number | null; rawMean: number | null }> } : { answered: 0, total: 0, globalScore: null as number | null, dimensions: [] as Array<{ dimension: string; answered: number; total: number; score: number | null; rawMean: number | null }> };
  if (legacyItems.length) {
    const base = calculateApplicationResult({ id: "battery", participantCode: "battery", participantType: "candidate", evaluatorCode: "server", createdAt: new Date().toISOString(), responses: legacyValues }, legacyItems);
    legacyResult.answered = base.answered;
    legacyResult.total = base.total;
    legacyResult.globalScore = base.globalScore;
    legacyResult.dimensions = base.dimensions;
  }
  const clinicalResponses = respuestasPorPrueba(clinicalIds, responses);
  const clinicalResult = clinicalIds.length ? calificarSesion(clinicalIds, clinicalResponses) : undefined;
  const clinicalDimensions = clinicalResult?.resultadosPorPrueba.map((result) => { const total = CATALOGO[result.pruebaId]?.items.length ?? result.total ?? 0; const answered = Object.keys(clinicalResponses[result.pruebaId] ?? {}).length; return { dimension: result.pruebaId, answered, total, score: result.porcentaje ?? null, rawMean: result.porcentaje == null ? null : result.porcentaje / 20 }; }) ?? [];
  const dimensions = [...legacyResult.dimensions, ...clinicalDimensions];
  const scores = dimensions.map((dimension) => dimension.score).filter((score): score is number => score !== null);
  const globalScore = scores.length ? Math.round(scores.reduce((sum, score) => sum + score, 0) / scores.length) : null;
  return { ...legacyResult, answered: Object.keys(responses).length, total: getBatteryItems(selectedIds).length, globalScore, dimensions, clinicalResult };
}
