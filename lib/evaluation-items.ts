export type EvaluationDimension = "personality" | "ethics" | "skills" | "therapeutic" | "judgment";
export type EvaluationItemType = "likert" | "case" | "knowledge";

export type EvaluationOption = { value: string; label: string; score?: number };

export type EvaluationItem = {
  id: string;
  dimension: EvaluationDimension;
  type: EvaluationItemType;
  prompt: string;
  active: boolean;
  options?: EvaluationOption[];
  sourceTestId?: string;
  subarea?: string;
};

export const evaluationDimensions: Array<{
  id: EvaluationDimension;
  label: string;
  shortLabel: string;
  description: string;
  color: "pink" | "blue" | "yellow";
}> = [
  { id: "personality", label: "Personalidad y estilo de trabajo", shortLabel: "Personalidad", description: "Autoconciencia, flexibilidad y organización del trabajo terapéutico.", color: "pink" },
  { id: "ethics", label: "Ética y profesionalismo", shortLabel: "Ética", description: "Límites, confidencialidad, consentimiento y responsabilidad profesional.", color: "blue" },
  { id: "skills", label: "Habilidades y conocimientos", shortLabel: "Habilidades", description: "Fundamentos, documentación, evaluación situada y uso responsable de herramientas.", color: "yellow" },
  { id: "therapeutic", label: "Relación terapéutica", shortLabel: "Relación", description: "Escucha, alianza, comunicación y capacidad de reparar una ruptura.", color: "pink" },
  { id: "judgment", label: "Juicio y razonamiento profesional", shortLabel: "Juicio", description: "Integración de información, incertidumbre, riesgo y supervisión.", color: "blue" },
];

export const likertLabels = [
  "1 · Nunca / no me describe",
  "2 · Rara vez",
  "3 · A veces",
  "4 · Frecuentemente",
  "5 · Siempre / me describe",
];

export function getDimension(id: string) {
  return evaluationDimensions.find((dimension) => dimension.id === id) ?? evaluationDimensions[0];
}
