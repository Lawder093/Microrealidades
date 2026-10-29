import type { EvaluationItem } from "@/lib/evaluation-items";
import { CATALOGO_ITEMS } from "@/lib/evaluacion/catalogo-items";
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

export type BatteryClassification = "1-A" | "1-B" | "2-A" | "2-B" | "3-A" | "3-B" | "3-C" | "3-D" | "PSIC-CLIN-INF" | "custom";

export const clinicalPsychometricTests: PsychometricTest[] = Object.values(CATALOGO_ITEMS).map((test) => ({
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

export function getClinicalTestIds(testIds: string[]) {
  return batteryTestCatalog.filter((test) => test.source === "clinical" && testIds.includes(test.id)).map((test) => test.clinicalTestId as string);
}

function clinicalItemToEvaluationItem(test: Prueba, item: Prueba["items"][number]): EvaluationItem {
  const dimension = test.id === "personalidad_trabajo" || test.id === "dieciseis_factores" || test.id === "cleaver_disc" ? "personality" : test.id === "relacion_terapeutica" ? "therapeutic" : test.id === "etica_profesionalismo" ? "ethics" : test.id === "habilidades_conocimientos" ? "skills" : "judgment";
  if (item.tipo === "likert_5") {
    return { id: item.id, dimension, type: "likert", prompt: item.enunciado, active: true, sourceTestId: test.id, subarea: item.factor };
  }
  if (item.tipo === "forced_choice") return { id: item.id, dimension, type: "case", prompt: item.enunciado, active: true, sourceTestId: test.id, options: item.opciones.map((option) => ({ value: option.valor, label: option.etiqueta })) };
  return {
    id: item.id,
    dimension,
    type: item.tipo === "escenario_clinico" ? "case" : "knowledge",
    prompt: item.enunciado,
    active: true,
    sourceTestId: test.id,
    subarea: item.subarea,
    options: item.opciones.map((option) => ({ value: option.valor, label: option.etiqueta })),
  };
}

/** Reactivos sin claves ni puntuaciones de corrección para la aplicación de candidato. */
export function getBatteryItems(testIds: string[]) {
  return batteryTestCatalog.filter((test) => test.source === "clinical" && testIds.includes(test.id)).flatMap((test) => {
    const clinicalTest = test.clinicalTestId ? CATALOGO_ITEMS[test.clinicalTestId] : undefined;
    return clinicalTest ? clinicalTest.items.map((item) => clinicalItemToEvaluationItem(clinicalTest, item)) : [];
  });
}

/** Datos locales para el módulo exploratorio de Evaluación Profesional, fuera del flujo oficial de aplicación. */
export function getBatteryItemsForDraftEvaluation(testIds: string[]) {
  return batteryTestCatalog.filter((test) => test.source === "clinical" && testIds.includes(test.id)).flatMap((test) => {
    const clinicalTest = test.clinicalTestId ? CATALOGO_ITEMS[test.clinicalTestId] : undefined;
    return clinicalTest ? clinicalTest.items.map((item) => {
      const mapped = clinicalItemToEvaluationItem(clinicalTest, item);
      if (item.tipo === "forced_choice") {
        return { ...mapped, options: mapped.options?.map((option, index) => ({ ...option, score: item.opciones[index]?.puntuacion ?? index + 1 })) };
      }
      if (item.tipo === "opcion_multiple" || item.tipo === "escenario_clinico") {
        return { ...mapped, options: mapped.options?.map((option, index) => ({ ...option, score: index + 1 })) };
      }
      return mapped;
    }) : [];
  });
}
