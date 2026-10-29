/**
 * Catálogo público de reactivos. Las claves de corrección viven por separado
 * en claves-respuesta.ts y solo se cargan desde el motor de servidor.
 */
import { PERSONALIDAD_TRABAJO } from "@/lib/evaluacion/items/personalidad-trabajo";
import { ETICA_PROFESIONALISMO } from "@/lib/evaluacion/items/etica-profesionalismo";
import { HABILIDADES_CONOCIMIENTOS } from "@/lib/evaluacion/items/habilidades-conocimientos";
import { RELACION_TERAPEUTICA } from "@/lib/evaluacion/items/relacion-terapeutica";
import { CONOCIMIENTOS_AUTISMO } from "@/lib/evaluacion/items/conocimientos-autismo";
import { CLEAVER_DISC } from "@/lib/evaluacion/items/cleaver-disc";
import { DIECISEIS_FACTORES } from "@/lib/evaluacion/items/dieciseis-factores";
import type { Prueba } from "@/types/evaluacion";

export { PERSONALIDAD_TRABAJO } from "@/lib/evaluacion/items/personalidad-trabajo";
export { ETICA_PROFESIONALISMO } from "@/lib/evaluacion/items/etica-profesionalismo";
export { HABILIDADES_CONOCIMIENTOS } from "@/lib/evaluacion/items/habilidades-conocimientos";
export { RELACION_TERAPEUTICA } from "@/lib/evaluacion/items/relacion-terapeutica";
export { CONOCIMIENTOS_AUTISMO } from "@/lib/evaluacion/items/conocimientos-autismo";
export { CLEAVER_DISC } from "@/lib/evaluacion/items/cleaver-disc";
export { DIECISEIS_FACTORES } from "@/lib/evaluacion/items/dieciseis-factores";

export const CATALOGO_ITEMS: Record<string, Prueba> = {
  cleaver_disc: CLEAVER_DISC,
  dieciseis_factores: DIECISEIS_FACTORES,
  personalidad_trabajo: PERSONALIDAD_TRABAJO,
  etica_profesionalismo: ETICA_PROFESIONALISMO,
  habilidades_conocimientos: HABILIDADES_CONOCIMIENTOS,
  relacion_terapeutica: RELACION_TERAPEUTICA,
  conocimientos_autismo: CONOCIMIENTOS_AUTISMO,
};
