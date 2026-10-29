/**
 * Interpretaciones descriptivas para el banco clínico infantil.
 *
 * NOTA METODOLÓGICA: los textos son reglas de lectura provisionales para apoyar
 * la revisión humana. No son baremos, normas poblacionales, diagnóstico ni criterio
 * automático de contratación. Deben revisarse después de piloto y análisis psicométrico.
 */

import type { BandaDescriptiva } from "@/types/evaluacion";

export type InterpretationInput = {
  porcentaje?: number;
  banda?: BandaDescriptiva;
  puntuaciones?: Record<string, number>;
  porSubarea?: Record<string, { aciertos: number; total: number }>;
};

const nombres: Record<string, string> = {
  personalidad_trabajo: "personalidad y estilo de trabajo",
  etica_profesionalismo: "ética y profesionalismo",
  habilidades_conocimientos: "habilidades y conocimientos",
  relacion_terapeutica: "relación terapéutica",
  conocimientos_autismo: "conocimientos en autismo",
};

const bandaTexto: Record<BandaDescriptiva, string> = {
  insuficiente: "requiere revisión y desarrollo adicional",
  aceptable: "muestra recursos funcionales que deben revisarse junto con evidencia profesional",
  solido: "muestra recursos consistentes en esta aplicación",
};

export function interpretarPrueba(id: string, input: InterpretationInput, modo: "breve" | "tecnica" = "breve"): string {
  const nombre = nombres[id] ?? "la prueba";
  if (id === "personalidad_trabajo") {
    const factores = Object.entries(input.puntuaciones ?? {});
    const promedio = factores.length ? Math.round(factores.reduce((sum, [, value]) => sum + value, 0) / factores.length) : null;
    return modo === "tecnica"
      ? `La prueba describe autoinformes por factor; el promedio descriptivo observado es ${promedio ?? "no disponible"}/100. La lectura debe contrastarse con entrevista, supervisión y evidencia conductual; no constituye una medida validada de personalidad.`
      : `El autoinforme permite observar temas de ${nombre}. Se recomienda revisar cada factor sin convertirlo en una etiqueta.`;
  }
  const porcentaje = input.porcentaje;
  const estado = input.banda ? bandaTexto[input.banda] : "requiere más información";
  return modo === "tecnica"
    ? `En ${nombre}, el porcentaje descriptivo observado es ${porcentaje ?? "no disponible"}%. La banda se usa únicamente como señal provisional de revisión: ${estado}. Las respuestas deben interpretarse con contexto clínico, formación, supervisión y evidencia adicional.`
    : `En ${nombre}, el patrón observado ${estado}. Esta lectura no sustituye una evaluación profesional completa.`;
}
