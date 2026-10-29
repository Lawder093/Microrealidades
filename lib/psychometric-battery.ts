import type { EvaluationItem } from "@/lib/evaluation-items";
import { CATALOGO, calificarSesion, respuestasPorPrueba, type Respuesta } from "@/lib/evaluacion/motor";
import type { Prueba } from "@/types/evaluacion";

export type PsychometricTest = {
  id: string;
  name: string;
  description: string;
  itemIds: string[];
  source: "base" | "clinical";
  clinicalTestId?: string;
};

export type BatteryAssignment = {
  testId?: string;
  prueba_id?: string;
  assignmentId?: string;
  asignacion_id?: string;
  order?: number;
  orden?: number;
  timeLimitSeconds?: number;
  tiempo_limite_seg?: number;
};

export function assignmentTestId(assignment: BatteryAssignment) {
  return assignment.testId ?? assignment.prueba_id ?? "";
}

export function assignmentAccessId(assignment: BatteryAssignment) {
  return assignment.asignacion_id ?? assignment.assignmentId ?? "";
}

export type BatteryClassification = "1-A" | "1-B" | "2-A" | "2-B" | "3-A" | "3-B" | "3-C" | "3-D" | "PSIC-CLIN-INF" | "custom";

export const clinicalPsychometricTests: PsychometricTest[] = Object.values(CATALOGO).map((test) => ({
  id: `clinical-${test.id}`,
  name: test.nombre,
  description: test.instrucciones,
  itemIds: test.items.map((item) => item.id),
  source: "clinical",
  clinicalTestId: test.id,
}));

export const batteryTestCatalog = clinicalPsychometricTests;

export const defaultBattery = {
  id: "base-super-bateria-01",
  name: "Super batería 01",
  classification: "custom" as BatteryClassification,
  tests: clinicalPsychometricTests.map((test, index) => ({ testId: test.id, order: index + 1, timeLimitSeconds: 900 })),
  totalMinutes: 150,
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
  const dimension = test.id === "personalidad_trabajo" || test.id === "dieciseis_factores" || test.id === "cleaver_disc" ? "personality" : test.id === "relacion_terapeutica" ? "therapeutic" : test.id === "etica_profesionalismo" ? "ethics" : test.id === "habilidades_conocimientos" ? "skills" : "judgment";
  if (item.tipo === "likert_5") {
    return { id: item.id, dimension, type: "likert", prompt: item.enunciado, active: true, sourceTestId: test.id, subarea: item.factor };
  }
  if (item.tipo === "forced_choice") return { id: item.id, dimension, type: "case", prompt: item.enunciado, active: true, sourceTestId: test.id, options: item.opciones.map((option) => ({ value: option.valor, label: option.etiqueta, score: option.puntuacion ?? 1 })) };
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

export function getBatteryItems(testIds: string[]) {
  const selectedIds = testIds;
  const clinicalItems = batteryTestCatalog.filter((test) => test.source === "clinical" && selectedIds.includes(test.id)).flatMap((test) => {
    const clinicalTest = test.clinicalTestId ? CATALOGO[test.clinicalTestId] : undefined;
    return clinicalTest ? clinicalTest.items.map((item) => clinicalItemToEvaluationItem(clinicalTest, item)) : [];
  });
  return clinicalItems;
}

export function calculateConfiguredBatteryResult(testIds: string[], responses: Record<string, Respuesta>) {
  const selectedIds = testIds.length ? testIds : defaultBattery.tests.map((test) => test.testId);
  const clinicalIds = getClinicalTestIds(selectedIds);
  const clinicalResponses = respuestasPorPrueba(clinicalIds, responses);
  const clinicalResult = clinicalIds.length ? calificarSesion(clinicalIds, clinicalResponses) : undefined;
  const clinicalDimensions = clinicalResult?.resultadosPorPrueba.map((result) => { const total = CATALOGO[result.pruebaId]?.items.length ?? result.total ?? 0; const answered = Object.keys(clinicalResponses[result.pruebaId] ?? {}).length; return { dimension: result.pruebaId, answered, total, score: result.porcentaje ?? null, rawMean: result.porcentaje == null ? null : result.porcentaje / 20 }; }) ?? [];
  const dimensions = clinicalDimensions;
  const scores = dimensions.map((dimension) => dimension.score).filter((score): score is number => score !== null);
  const globalScore = scores.length ? Math.round(scores.reduce((sum, score) => sum + score, 0) / scores.length) : null;
  return { answered: Object.keys(responses).length, total: getBatteryItems(selectedIds).length, globalScore, dimensions, clinicalResult };
}
