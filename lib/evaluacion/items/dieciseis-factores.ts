/**
 * Banco original de rasgos de trabajo para Microrealidades.
 *
 * NOTA METODOLÓGICA: reactivos originales inspirados en dimensiones amplias
 * de funcionamiento laboral. No reproducen el 16PF ni otro instrumento
 * licenciado, y no ofrecen diagnóstico, baremos ni validación psicométrica.
 */
import type { Prueba } from "@/types/evaluacion";

const afirmaciones = [
  ["apertura", "Me resulta natural considerar perspectivas distintas antes de concluir."], ["apertura", "Puedo adaptar mi lenguaje a personas con experiencias diferentes."], ["apertura", "Me interesa aprender de contextos que no conozco."],
  ["regulacion", "Mantengo un tono estable cuando una conversación se vuelve intensa."], ["regulacion", "Puedo reconocer cuando necesito hacer una pausa para responder mejor."], ["regulacion", "Después de un día difícil, recupero gradualmente mi concentración."],
  ["organizacion", "Registro acuerdos y pendientes para no depender solo de la memoria."], ["organizacion", "Reviso mis prioridades antes de iniciar una jornada compleja."], ["organizacion", "Puedo sostener un método sin perder de vista a la persona."],
  ["colaboracion", "Comparto información relevante con el equipo en el momento oportuno."], ["colaboracion", "Escucho una observación sin interpretarla automáticamente como ataque."], ["colaboracion", "Busco acuerdos claros cuando una tarea depende de varias personas."],
  ["responsabilidad", "Cumplo los compromisos que acepto o aviso con anticipación si cambian."], ["responsabilidad", "Reconozco un error y participo en su corrección."], ["responsabilidad", "Cuido la confidencialidad de la información a mi cargo."],
  ["flexibilidad", "Puedo cambiar de estrategia cuando la evidencia indica que hace falta."], ["flexibilidad", "Tolero no tener toda la información al inicio de un problema."], ["flexibilidad", "Diferencio una preferencia personal de una necesidad profesional."],
  ["comunicacion", "Explico mis decisiones de forma comprensible y respetuosa."], ["comunicacion", "Pregunto cuando una instrucción no es suficientemente clara."], ["comunicacion", "Puedo dar retroalimentación centrada en conductas observables."],
  ["autonomia", "Inicio tareas necesarias sin esperar recordatorios constantes."], ["autonomia", "Sé cuándo una decisión requiere consulta o supervisión."], ["autonomia", "Doy seguimiento a un problema hasta dejar un siguiente paso definido."],
  ["aprendizaje", "Integro retroalimentación en mi manera de trabajar."], ["aprendizaje", "Busco fuentes confiables cuando necesito actualizarme."], ["aprendizaje", "Puedo explicar qué todavía no sé sobre una situación."],
  ["criterio", "Antes de decidir, separo hechos, hipótesis y riesgos."], ["criterio", "Considero las consecuencias de una acción para las personas involucradas."], ["criterio", "Reviso una decisión cuando aparece información nueva relevante."],
] as const;

export const DIECISEIS_FACTORES: Prueba = {
  id: "dieciseis_factores",
  nombre: "Dieciséis factores · perfil de trabajo",
  tipo: "personalidad",
  instrucciones: "Indica cuánto te describe cada afirmación en tu práctica profesional habitual.",
  subareas: ["apertura", "regulacion", "organizacion", "colaboracion", "responsabilidad", "flexibilidad", "comunicacion", "autonomia", "aprendizaje", "criterio"],
  items: afirmaciones.map(([factor, enunciado], index) => ({ id: `df${String(index + 1).padStart(2, "0")}`, tipo: "likert_5" as const, factor, enunciado })),
};
