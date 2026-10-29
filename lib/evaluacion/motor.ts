/**
 * Motor único para las baterías clínicas infantiles.
 *
 * NOTA METODOLÓGICA: califica ítems originales por subárea y aplica bandas
 * descriptivas provisionales. No afirma validez, confiabilidad, baremos ni
 * capacidad diagnóstica. La decisión siempre corresponde a profesionales.
 */

import {
  CONOCIMIENTOS_AUTISMO,
  CLEAVER_DISC,
  DIECISEIS_FACTORES,
  ETICA_PROFESIONALISMO,
  HABILIDADES_CONOCIMIENTOS,
  PERSONALIDAD_TRABAJO,
  RELACION_TERAPEUTICA,
} from "@/lib/evaluacion/catalogo-items";
import type { BandaDescriptiva, ItemOpcionMultiple, Prueba, ResultadoFinal, ResultadoPrueba } from "@/types/evaluacion";
import { interpretarPrueba } from "@/lib/evaluacion/interpretaciones";

export type Respuesta = string | number;
export type RespuestasSesion = Record<string, Record<string, Respuesta>>;
export type ModoInterpretacion = "breve" | "tecnica";

export const CATALOGO: Record<string, Prueba> = {
  cleaver_disc: CLEAVER_DISC,
  dieciseis_factores: DIECISEIS_FACTORES,
  personalidad_trabajo: PERSONALIDAD_TRABAJO,
  etica_profesionalismo: ETICA_PROFESIONALISMO,
  habilidades_conocimientos: HABILIDADES_CONOCIMIENTOS,
  relacion_terapeutica: RELACION_TERAPEUTICA,
  conocimientos_autismo: CONOCIMIENTOS_AUTISMO,
};

const BANDA_REFERENCIAL = { aceptable: 70, solido: 85 } as const;

function bandaDesdePorcentaje(porcentaje: number): BandaDescriptiva {
  if (porcentaje < BANDA_REFERENCIAL.aceptable) return "insuficiente";
  if (porcentaje < BANDA_REFERENCIAL.solido) return "aceptable";
  return "solido";
}

function porcentaje(aciertos: number, total: number) {
  return total ? Math.round((aciertos / total) * 100) : 0;
}

function calificarConCorrectas(prueba: Prueba, respuestas: Record<string, Respuesta>) {
  const porSubarea: Record<string, { aciertos: number; total: number }> = {};
  let aciertos = 0;
  for (const item of prueba.items) {
    if (item.tipo !== "opcion_multiple" && item.tipo !== "escenario_clinico") continue;
    const subarea = item.subarea;
    const actual = porSubarea[subarea] ?? { aciertos: 0, total: 0 };
    actual.total += 1;
    if (respuestas[item.id] === item.respuestaCorrecta) {
      actual.aciertos += 1;
      aciertos += 1;
    }
    porSubarea[subarea] = actual;
  }
  return { aciertos, total: Object.values(porSubarea).reduce((sum, value) => sum + value.total, 0), porSubarea };
}

function resultadoLikert(prueba: Prueba, respuestas: Record<string, Respuesta>, modo: ModoInterpretacion = "breve"): ResultadoPrueba {
  const puntuaciones: Record<string, number> = {};
  for (const factor of prueba.subareas) {
    const items = prueba.items.filter((item) => item.tipo === "likert_5" && item.factor === factor);
    const values = items.map((item) => {
      if (item.tipo !== "likert_5") return null;
      const value = respuestas[item.id];
      if (typeof value !== "number") return null;
      return item.invertido ? 6 - value : value;
    }).filter((value): value is number => value !== null);
    if (values.length) puntuaciones[factor] = Math.round(((values.reduce((sum, value) => sum + value, 0) / values.length - 1) / 4) * 100);
  }
  const porcentajeTotal = Object.values(puntuaciones).length ? Math.round(Object.values(puntuaciones).reduce((sum, value) => sum + value, 0) / Object.values(puntuaciones).length) : undefined;
  const banda = porcentajeTotal === undefined ? undefined : bandaDesdePorcentaje(porcentajeTotal);
  return {
    pruebaId: prueba.id,
    puntuaciones,
    porcentaje: porcentajeTotal,
    banda,
    interpretacion: interpretarPrueba(prueba.id, { puntuaciones, porcentaje: porcentajeTotal, banda }, "breve"),
    interpretacionTecnica: interpretarPrueba(prueba.id, { puntuaciones, porcentaje: porcentajeTotal, banda }, modo),
  };
}

function resultadoForzado(prueba: Prueba, respuestas: Record<string, Respuesta>, modo: ModoInterpretacion = "breve"): ResultadoPrueba {
  const puntuaciones: Record<string, number> = {};
  for (const factor of prueba.subareas) {
    const items = prueba.items.filter((item) => item.tipo === "forced_choice" && item.factor === factor);
    const values = items.map((item) => {
      if (item.tipo !== "forced_choice") return null;
      const answer = respuestas[item.id];
      const option = item.opciones.find((candidate) => candidate.valor === answer);
      return option?.puntuacion ?? null;
    }).filter((value): value is number => value !== null);
    if (values.length) puntuaciones[factor] = Math.round(((values.reduce((sum, value) => sum + value, 0) / values.length - 1) / 4) * 100);
  }
  const porcentajeTotal = Object.values(puntuaciones).length ? Math.round(Object.values(puntuaciones).reduce((sum, value) => sum + value, 0) / Object.values(puntuaciones).length) : undefined;
  const banda = porcentajeTotal === undefined ? undefined : bandaDesdePorcentaje(porcentajeTotal);
  return {
    pruebaId: prueba.id,
    puntuaciones,
    porcentaje: porcentajeTotal,
    banda,
    interpretacion: interpretarPrueba(prueba.id, { puntuaciones, porcentaje: porcentajeTotal, banda }, "breve"),
    interpretacionTecnica: interpretarPrueba(prueba.id, { puntuaciones, porcentaje: porcentajeTotal, banda }, modo),
  };
}

function resultadoCorrecto(prueba: Prueba, respuestas: Record<string, Respuesta>, modo: ModoInterpretacion = "breve"): ResultadoPrueba {
  const base = calificarConCorrectas(prueba, respuestas);
  const porcentajeTotal = porcentaje(base.aciertos, base.total);
  const banda = bandaDesdePorcentaje(porcentajeTotal);
  const bandaPorSubarea = Object.fromEntries(Object.entries(base.porSubarea).map(([subarea, value]) => [subarea, bandaDesdePorcentaje(porcentaje(value.aciertos, value.total))]));
  const puntuaciones = Object.fromEntries(Object.entries(base.porSubarea).map(([subarea, value]) => [subarea, porcentaje(value.aciertos, value.total)]));
  return {
    pruebaId: prueba.id,
    puntuaciones,
    aciertos: base.aciertos,
    total: base.total,
    porcentaje: porcentajeTotal,
    banda,
    bandaPorSubarea,
    interpretacion: interpretarPrueba(prueba.id, { porcentaje: porcentajeTotal, banda }, "breve"),
    interpretacionTecnica: interpretarPrueba(prueba.id, { porcentaje: porcentajeTotal, banda, porSubarea: base.porSubarea }, modo),
  };
}

function resultadoPersonalidad(respuestas: Record<string, Respuesta>, modo: ModoInterpretacion = "breve"): ResultadoPrueba {
  const puntuaciones: Record<string, number> = {};
  for (const factor of PERSONALIDAD_TRABAJO.subareas) {
    const items = PERSONALIDAD_TRABAJO.items.filter((item) => item.tipo === "likert_5" && item.factor === factor).map((item) => item.tipo === "likert_5" ? item : null).filter((item): item is Extract<typeof PERSONALIDAD_TRABAJO.items[number], { tipo: "likert_5" }> => item !== null);
    const values = items.map((item) => {
      const value = respuestas[item.id];
      if (typeof value !== "number") return null;
      return item.invertido ? 6 - value : value;
    }).filter((value): value is number => value !== null);
    if (values.length) puntuaciones[factor] = Math.round(((values.reduce((sum, value) => sum + value, 0) / values.length - 1) / 4) * 100);
  }
  return {
    pruebaId: PERSONALIDAD_TRABAJO.id,
    puntuaciones,
    porcentaje: Object.values(puntuaciones).length ? Math.round(Object.values(puntuaciones).reduce((sum, value) => sum + value, 0) / Object.values(puntuaciones).length) : undefined,
    interpretacion: interpretarPrueba(PERSONALIDAD_TRABAJO.id, { puntuaciones }, "breve"),
    interpretacionTecnica: interpretarPrueba(PERSONALIDAD_TRABAJO.id, { puntuaciones }, modo),
  };
}

export function calificarPrueba(pruebaId: string, respuestas: Record<string, Respuesta>, modo: ModoInterpretacion = "tecnica"): ResultadoPrueba {
  const prueba = CATALOGO[pruebaId];
  if (!prueba) throw new Error(`Motor no implementado para ${pruebaId}`);
  return pruebaId === PERSONALIDAD_TRABAJO.id ? resultadoPersonalidad(respuestas, modo) : prueba.items.some((item) => item.tipo === "likert_5") ? resultadoLikert(prueba, respuestas, modo) : prueba.items.some((item) => item.tipo === "forced_choice") ? resultadoForzado(prueba, respuestas, modo) : resultadoCorrecto(prueba, respuestas, modo);
}

export function calificarSesion(pruebasIds: string[], respuestas: RespuestasSesion): ResultadoFinal {
  const resultadosPorPrueba = pruebasIds.map((pruebaId) => calificarPrueba(pruebaId, respuestas[pruebaId] ?? {}, "tecnica"));
  const porcentajes = resultadosPorPrueba.map((resultado) => resultado.porcentaje).filter((value): value is number => typeof value === "number");
  const promedio = porcentajes.length ? Math.round(porcentajes.reduce((sum, value) => sum + value, 0) / porcentajes.length) : 0;
  const ajusteGlobal = promedio < BANDA_REFERENCIAL.aceptable ? "bajo" : promedio < BANDA_REFERENCIAL.solido ? "medio" : "alto";
  const nombresActivos = resultadosPorPrueba.map((resultado) => CATALOGO[resultado.pruebaId]?.nombre ?? resultado.pruebaId).join(", ");
  const resumenEjecutivo = `Se observaron ${resultadosPorPrueba.length} pruebas: ${nombresActivos || "ninguna"}. El promedio descriptivo fue ${promedio}/100; requiere revisión profesional y no debe usarse como decisión automática.`;
  return { resultadosPorPrueba, ajusteGlobal, resumenEjecutivo, completadoEn: new Date().toISOString() };
}

export function respuestasPorPrueba(pruebasIds: string[], respuestas: Record<string, Respuesta>) {
  const result: RespuestasSesion = {};
  for (const pruebaId of pruebasIds) {
    const prueba = CATALOGO[pruebaId];
    if (!prueba) continue;
    result[pruebaId] = Object.fromEntries(prueba.items.map((item) => [item.id, respuestas[item.id]]).filter(([, value]) => value !== undefined));
  }
  return result;
}

export function getClinicalItem(pruebaId: string, itemId: string): ItemOpcionMultiple | null {
  const prueba = CATALOGO[pruebaId];
  const item = prueba?.items.find((candidate) => candidate.id === itemId);
  return item && (item.tipo === "opcion_multiple" || item.tipo === "escenario_clinico") ? item : null;
}
