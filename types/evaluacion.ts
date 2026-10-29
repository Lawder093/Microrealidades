/**
 * Tipos auditables para el banco clínico infantil de Microrealidades.
 *
 * NOTA METODOLÓGICA: estos tipos describen ítems originales inspirados en constructos
 * teóricos. No representan una adaptación ni una validación de instrumentos licenciados.
 * La aplicación no debe usarse como diagnóstico ni como decisión automática.
 */

export type TipoItem = "forced_choice" | "likert_5" | "opcion_multiple" | "escenario_clinico";
export type TipoPrueba = "comportamiento" | "personalidad" | "conocimiento_tecnico" | "juicio_etico" | "juicio_clinico";
export type ValorOpcion = "A" | "B" | "C" | "D";
export type BandaDescriptiva = "insuficiente" | "aceptable" | "solido";

export interface ItemForzado {
  id: string;
  tipo: "forced_choice";
  enunciado: string;
  factor?: string;
  opciones: Array<{ valor: string; etiqueta: string; puntuacion?: number }>;
}

export interface ItemLikert {
  id: string;
  tipo: "likert_5";
  enunciado: string;
  factor: string;
  invertido?: boolean;
}

export interface ItemOpcionMultiple {
  id: string;
  tipo: "opcion_multiple" | "escenario_clinico";
  enunciado: string;
  subarea: string;
  opciones: Array<{ valor: ValorOpcion; etiqueta: string }>;
}

export type Item = ItemForzado | ItemLikert | ItemOpcionMultiple;

export interface Prueba {
  id: string;
  nombre: string;
  tipo: TipoPrueba;
  instrucciones: string;
  subareas: string[];
  items: Item[];
}

export interface ResultadoPrueba {
  pruebaId: string;
  puntuaciones: Record<string, number>;
  aciertos?: number;
  total?: number;
  porcentaje?: number;
  banda?: BandaDescriptiva;
  bandaPorSubarea?: Record<string, BandaDescriptiva>;
  interpretacion: string;
  interpretacionTecnica: string;
}

export interface ResultadoFinal {
  resultadosPorPrueba: ResultadoPrueba[];
  ajusteGlobal: "bajo" | "medio" | "alto";
  resumenEjecutivo: string;
  completadoEn: string;
}
