/**
 * Banco original de comportamiento profesional para Microrealidades.
 *
 * NOTA METODOLÓGICA: estos reactivos son originales y solo exploran
 * preferencias conductuales descriptivas. No reproducen ni sustituyen el
 * instrumento Cleaver-DISC licenciado, ni cuentan con baremos o validación.
 */
import type { Prueba } from "@/types/evaluacion";

const situaciones = [
  "Cuando un plan cambia en el último momento, suelo:", "Ante una tarea ambigua, primero:", "En una reunión de equipo, normalmente:", "Cuando recibo retroalimentación difícil:",
  "Para organizar una semana exigente:", "Cuando dos personas necesitan apoyo al mismo tiempo:", "Al aprender un procedimiento nuevo:", "Si detecto un error en un registro:",
  "Cuando debo explicar una decisión:", "En un conflicto de prioridades:", "Cuando una familia expresa una inconformidad:", "Si el equipo no tiene una respuesta inmediata:",
  "Para iniciar un proyecto:", "Cuando trabajo con poca supervisión:", "Al cerrar una sesión o actividad:", "Si una estrategia deja de funcionar:",
  "Cuando hay información contradictoria:", "En una jornada con mucha presión:", "Al colaborar con alguien de otro estilo:", "Cuando necesito pedir ayuda:",
  "Ante un objetivo de largo plazo:", "Cuando una decisión puede afectar a otra persona:", "Al revisar mi propio trabajo:", "Cuando debo comunicar una demora:",
] as const;

const opciones = [
  { valor: "A", etiqueta: "Tomo iniciativa, priorizo y avanzo con una decisión clara.", puntuacion: 5 },
  { valor: "B", etiqueta: "Busco datos, ordeno alternativas y sigo un método verificable.", puntuacion: 4 },
  { valor: "C", etiqueta: "Escucho a las personas implicadas y cuido la coordinación.", puntuacion: 3 },
  { valor: "D", etiqueta: "Espero instrucciones completas antes de mover la situación.", puntuacion: 2 },
];

export const CLEAVER_DISC: Prueba = {
  id: "cleaver_disc",
  nombre: "Cleaver-DISC · comportamiento profesional",
  tipo: "comportamiento",
  instrucciones: "Elige la respuesta que más se aproxima a tu forma habitual de actuar en contextos profesionales.",
  subareas: ["iniciativa", "metodo", "cooperacion", "adaptabilidad"],
  items: situaciones.map((enunciado, index) => ({ id: `cd${String(index + 1).padStart(2, "0")}`, tipo: "forced_choice" as const, enunciado, factor: ["iniciativa", "metodo", "cooperacion", "adaptabilidad"][index % 4], opciones })),
};
