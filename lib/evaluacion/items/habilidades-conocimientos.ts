/**
 * Banco original de habilidades y conocimientos para Microrealidades.
 *
 * NOTA METODOLÓGICA: son reactivos originales inspirados en competencias
 * profesionales generales. No reproducen instrumentos licenciados, no están
 * validados y no sustituyen formación, supervisión ni evaluación clínica.
 */
import type { Prueba } from "@/types/evaluacion";

const reactivos = [
  ["evaluacion_situada", "Una herramienta de tamizaje sirve principalmente para orientar una exploración posterior considerando contexto y entrevista."],
  ["documentacion", "Un registro profesional de sesión debe distinguir observaciones, hipótesis, acuerdos y próximos pasos."],
  ["comunicacion", "Si una familia no comprende el plan, conviene pedir que lo explique con sus palabras y ajustar la comunicación."],
  ["supervision", "Si una conducta clínica rebasa tu experiencia, debes documentar el límite, consultar supervisión y derivar si corresponde."],
  ["intervencion_respetuosa", "Una intervención respetuosa prioriza seguridad, comunicación, participación y calidad de vida."],
  ["evaluacion_situada", "Cuando dos fuentes de información no coinciden, conviene explorar la discrepancia antes de concluir."],
  ["documentacion", "Una nota tardía debe identificarse como tal e indicar la fecha real de registro."],
  ["supervision", "La supervisión profesional sirve para revisar razonamiento, límites, riesgos y alternativas de intervención."],
  ["intervencion_respetuosa", "Una meta funcional debe construirse con la persona y su red, no únicamente desde la conveniencia institucional."],
  ["comunicacion", "La comunicación aumentativa o alternativa puede ser un apoyo legítimo y no una barrera para el lenguaje oral."],
  ["evaluacion_situada", "Antes de interpretar una conducta, conviene describir cuándo ocurre, qué la precede y qué sucede después."],
  ["documentacion", "Un expediente útil permite distinguir una cita textual de una interpretación profesional."],
  ["supervision", "Consultar un caso no elimina la responsabilidad de quien participa directamente en la intervención."],
  ["intervencion_respetuosa", "La ausencia de una conducta no deseada no justifica ignorar bienestar, consentimiento y comunicación."],
  ["comunicacion", "Para explicar una recomendación compleja, es preferible usar lenguaje claro, ejemplos y verificación de comprensión."],
  ["evaluacion_situada", "Una evaluación integral debe considerar historia, contexto, fortalezas, necesidades y múltiples fuentes."],
  ["documentacion", "Los cambios relevantes en un plan deben registrar fecha, motivo, participantes y acuerdos."],
  ["supervision", "Una señal de riesgo requiere seguir el protocolo aplicable y pedir apoyo cuando excede la competencia propia."],
  ["intervencion_respetuosa", "Las metas deben revisarse si generan malestar significativo o no aportan una función valiosa para la persona."],
  ["comunicacion", "La información sensible debe compartirse solo con quienes tienen una razón profesional legítima para recibirla."],
  ["evaluacion_situada", "Una observación aislada no debe convertirse en una conclusión definitiva sin corroboración."],
  ["documentacion", "Corregir una nota debe conservar trazabilidad y no borrar el registro original de forma engañosa."],
  ["supervision", "Una derivación responsable incluye explicar el motivo y facilitar continuidad cuando sea posible."],
  ["intervencion_respetuosa", "La intervención debe evitar prácticas aversivas o humillantes y priorizar apoyos seguros."],
  ["comunicacion", "La familia puede aportar información contextual valiosa sin sustituir la voz y participación del paciente."],
  ["evaluacion_situada", "Un resultado de prueba debe interpretarse junto con sus límites, condiciones de aplicación y contexto."],
  ["documentacion", "Una nota clínica debe evitar etiquetas innecesarias y centrarse en información relevante y observable."],
  ["supervision", "La actualización profesional incluye reconocer qué conocimientos necesitan revisión antes de intervenir."],
  ["intervencion_respetuosa", "El progreso debe observarse con indicadores acordados, no solo con impresiones generales."],
  ["comunicacion", "Una conversación difícil se beneficia de validar la experiencia, aclarar límites y acordar próximos pasos."],
] as const;

export const HABILIDADES_CONOCIMIENTOS: Prueba = {
  id: "habilidades_conocimientos",
  nombre: "Habilidades y Conocimientos",
  tipo: "conocimiento_tecnico",
  instrucciones: "Seleccione la respuesta que representa la mejor práctica profesional. Los reactivos son originales y no constituyen certificación.",
  subareas: ["evaluacion_situada", "documentacion", "comunicacion", "supervision", "intervencion_respetuosa"],
  items: reactivos.map(([subarea, enunciado], index) => ({
    id: `hc${String(index + 1).padStart(2, "0")}`,
    tipo: "opcion_multiple" as const,
    subarea,
    enunciado,
    opciones: [
      { valor: "A" as const, etiqueta: "Aplicar una regla fija sin explorar contexto ni límites." },
      { valor: "B" as const, etiqueta: enunciado },
      { valor: "C" as const, etiqueta: "Dejar la decisión para después sin registrarla ni consultarla." },
      { valor: "D" as const, etiqueta: "Delegar toda la responsabilidad sin explicar el siguiente paso." },
    ],
  })),
};
