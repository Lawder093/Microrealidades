/**
 * Interpretaciones descriptivas por banda para los reportes de Microrealidades.
 *
 * NOTA METODOLÓGICA: las bandas y los textos son provisionales; el instrumento
 * no cuenta aquí con validación, baremos ni capacidad diagnóstica. Son temas
 * para revisión profesional y no deben determinar por sí solos una contratación.
 */

import type { BandaDescriptiva } from "@/types/evaluacion";

export type InterpretationInput = {
  porcentaje?: number;
  banda?: BandaDescriptiva;
  puntuaciones?: Record<string, number>;
  porSubarea?: Record<string, { aciertos: number; total: number }>;
};

type BandaTexto = "insuficiente" | "aceptable" | "solido";

const textos: Record<string, Record<BandaTexto, string>> = {
  etica_profesionalismo: {
    insuficiente: "En esta aplicación, las respuestas quedaron en la banda descriptiva insuficiente y sugieren revisar conocimientos sobre juicio ético y límites profesionales. Conviene indagar con casos en entrevista y acordar la supervisión pertinente; esta puntuación por sí sola no determina la idoneidad para el puesto.",
    aceptable: "En esta aplicación, las respuestas muestran una base sobre límites profesionales y protocolos habituales. Los dilemas complejos y los posibles conflictos de interés pueden explorarse con ejemplos en entrevista y supervisión inicial.",
    solido: "En esta aplicación, las respuestas se alinean con principios de confidencialidad, consentimiento informado, límites profesionales y reporte obligatorio. Conviene corroborar estos conocimientos con ejemplos de práctica y referencias profesionales.",
  },
  habilidades_conocimientos: {
    insuficiente: "En esta aplicación, las respuestas sugieren temas técnicos que conviene revisar, como análisis funcional, registro y manejo de conducta. Se recomienda explorar la experiencia y las necesidades de formación o supervisión antes de asignar responsabilidades.",
    aceptable: "En esta aplicación, las respuestas muestran familiaridad con conceptos de intervención, análisis funcional y comunicación alternativa. Conviene corroborar su aplicación práctica con ejemplos de trabajo y supervisión acorde con la experiencia.",
    solido: "En esta aplicación, las respuestas muestran familiaridad con terminología ABA, diseño de registros, jerarquías de ayuda y generalización. Contrastar el resultado con evidencia de experiencia; el puntaje no demuestra por sí solo autonomía profesional.",
  },
  relacion_terapeutica: {
    insuficiente: "En esta aplicación, las respuestas sugieren temas para explorar sobre alianza terapéutica, límites con familias y manejo de reacciones emocionales. Conviene revisarlos mediante entrevista situacional y supervisión; la puntuación no permite concluir cómo será la práctica real.",
    aceptable: "En esta aplicación, las respuestas muestran recursos interpersonales y reconocimiento del trabajo con familias y de la reparación de rupturas. Puede ser útil explorar cómo manejaría situaciones de alta carga emocional o límites poco claros.",
    solido: "En esta aplicación, las respuestas se alinean con empatía, límites claros y colaboración con familias. Conviene contrastar estos indicadores con ejemplos concretos de práctica y reflexión profesional.",
  },
  conocimientos_autismo: {
    insuficiente: "En esta aplicación, las respuestas sugieren revisar conocimientos sobre criterios actuales del TEA, comorbilidades e intervención basada en evidencia. Conviene explorar necesidades de actualización y supervisión; el puntaje no demuestra por sí solo la calidad de la práctica.",
    aceptable: "En esta aplicación, las respuestas muestran conocimientos básicos sobre el TEA, criterios diagnósticos y modelos de intervención. Puede ser útil explorar cómo adaptaría estos conocimientos al contexto de cada niño y su familia.",
    solido: "En esta aplicación, las respuestas muestran conocimiento sobre el espectro, niveles de apoyo, detección, adaptaciones sensoriales y derechos de personas autistas. Contrastar estos indicadores con ejemplos de práctica respetuosa y centrada en la persona.",
  },
};

const nombresDimension: Record<string, string> = {
  estabilidad_emocional: "estabilidad emocional",
  empatia_calidez: "empatía y calidez",
  organizacion_metodo: "organización y método",
  flexibilidad_cognitiva: "flexibilidad cognitiva",
  motivacion_servicio: "motivación de servicio",
  iniciativa: "iniciativa",
  metodo: "método y organización",
  cooperacion: "cooperación",
  adaptabilidad: "adaptabilidad",
};

const perfilesDisc: Record<string, string> = {
  D: "Las respuestas muestran mayor puntuación en el eje D. Puede explorarse cómo combina iniciativa y toma de decisiones con escucha y paciencia en situaciones de trabajo.",
  I: "Las respuestas muestran mayor puntuación en el eje I. Puede explorarse cómo combina comunicación y entusiasmo con seguimiento de detalles y organización.",
  S: "Las respuestas muestran mayor puntuación en el eje S. Puede explorarse cómo combina constancia y cooperación con asertividad ante desacuerdos.",
  C: "Las respuestas muestran mayor puntuación en el eje C. Puede explorarse cómo combina método y atención al detalle con flexibilidad ante cambios.",
};

const perfilesBancoOriginal: Record<string, string> = {
  iniciativa: "En los reactivos asociados con iniciativa aparece la puntuación descriptiva más alta. Puede explorarse cómo prioriza y toma acción, y cómo integra consulta y escucha.",
  metodo: "En los reactivos asociados con método aparece la puntuación descriptiva más alta. Puede explorarse cómo organiza el trabajo y mantiene flexibilidad cuando cambian las necesidades.",
  cooperacion: "En los reactivos asociados con cooperación aparece la puntuación descriptiva más alta. Puede explorarse cómo coordina con otras personas y expresa desacuerdos con claridad.",
  adaptabilidad: "En los reactivos asociados con adaptabilidad aparece la puntuación descriptiva más alta. Puede explorarse cómo responde a cambios y sostiene el seguimiento de acuerdos.",
};

function resolverBanda(porcentaje: number | undefined, banda: string): BandaTexto | undefined {
  if (typeof porcentaje === "number" && Number.isFinite(porcentaje)) {
    if (porcentaje < 70) return "insuficiente";
    if (porcentaje < 85) return "aceptable";
    return "solido";
  }
  if (banda === "insuficiente" || banda === "aceptable" || banda === "solido") return banda;
  return undefined;
}

/** Genera el texto descriptivo que se incorpora al PDF según puntaje y perfil. */
export function obtenerInterpretacionPrueba(
  pruebaId: string,
  porcentaje: number | undefined,
  banda: string,
  dimensiones?: Record<string, number>,
): string {
  if (pruebaId === "personalidad_trabajo" && dimensiones) {
    const entries = Object.entries(dimensiones).filter(([, value]) => Number.isFinite(value));
    if (!entries.length) return "No hay dimensiones completas suficientes para generar una lectura. Revisar las respuestas disponibles junto con entrevista y evidencia profesional.";
    const bajas = entries.filter(([, value]) => value < 40).map(([nombre]) => nombresDimension[nombre] ?? nombre.replaceAll("_", " "));
    return bajas.length
      ? "En este autoinforme, las dimensiones de " + bajas.join(", ") + " quedaron por debajo del marcador descriptivo de 40/100. Pueden servir como temas para explorar con ejemplos en entrevista; no constituyen una etiqueta ni una conclusión sobre la capacidad profesional."
      : "En este autoinforme, ninguna dimensión completa quedó por debajo del marcador descriptivo de 40/100. Explorar las respuestas junto con entrevista y evidencia profesional; esto no constituye una medida validada de personalidad.";
  }

  if (pruebaId === "cleaver_disc" && dimensiones) {
    const entries = Object.entries(dimensiones).filter(([, value]) => Number.isFinite(value)).sort((left, right) => right[1] - left[1]);
    const dominante = entries[0]?.[0];
    if (!dominante) return "No hay dimensiones completas suficientes para generar una lectura de perfil.";
    if (perfilesDisc[dominante]) return perfilesDisc[dominante] + " Esta lectura es exploratoria y no equivale a una aplicación validada de DISC.";
    return (perfilesBancoOriginal[dominante] ?? "La puntuación más alta aparece en " + (nombresDimension[dominante] ?? dominante.replaceAll("_", " ")) + ".") + " Esta batería contiene reactivos originales y no equivale al instrumento DISC licenciado ni a un perfil validado.";
  }

  if (pruebaId === "dieciseis_factores") {
    return "Este perfil resume tendencias de respuesta en las dimensiones incluidas en esta batería original. Contrastar los resultados con entrevista y ejemplos de trabajo, especialmente ante situaciones de estrés. No equivale al 16PF ni a una medida validada de personalidad.";
  }

  const bandaCalculada = resolverBanda(porcentaje, banda);
  return bandaCalculada
    ? textos[pruebaId]?.[bandaCalculada] ?? "En esta aplicación, el resultado se ubica en la banda descriptiva " + bandaCalculada + ". Interpretarlo junto con entrevista, experiencia y supervisión; no es una decisión automática."
    : "No hay información suficiente para generar una interpretación por banda.";
}

/** Compatibilidad con el motor y vistas que ya consumen interpretaciones breves/técnicas. */
export function interpretarPrueba(id: string, input: InterpretationInput): string {
  return obtenerInterpretacionPrueba(id, input.porcentaje, input.banda ?? "", input.puntuaciones);
}
