/**
 * Banco clínico infantil integrado a Microtalento.
 *
 * NOTA METODOLÓGICA: reactivos originales inspirados en constructos teóricos;
 * no reproducen instrumentos licenciados ni constituyen diagnóstico o baremo.
 */
import { Prueba } from '@/types/evaluacion';

export const PERSONALIDAD_TRABAJO: Prueba = {
  id: 'personalidad_trabajo',
  nombre: 'Personalidad y Estilo de Trabajo',
  tipo: 'personalidad',
  instrucciones:
    'Indique qué tanto está de acuerdo con cada afirmación sobre su forma habitual de ser y trabajar con niños. Responda con honestidad. No hay respuestas correctas ni incorrectas.',
  subareas: [
    'estabilidad_emocional',
    'empatia_calidez',
    'organizacion_metodo',
    'flexibilidad_cognitiva',
    'motivacion_servicio',
  ],
  items: [
    // ===== ESTABILIDAD EMOCIONAL Y MANEJO DE FRUSTRACIÓN =====
    { id: 'pt01', tipo: 'likert_5', factor: 'estabilidad_emocional', enunciado: 'Mantengo la calma cuando un niño tiene un berrinche prolongado.' },
    { id: 'pt02', tipo: 'likert_5', factor: 'estabilidad_emocional', enunciado: 'Me desespero rápido cuando las cosas no salen como las planeé.', invertido: true },
    { id: 'pt03', tipo: 'likert_5', factor: 'estabilidad_emocional', enunciado: 'Puedo regular mi enojo ante provocaciones del menor o de la familia.' },
    { id: 'pt04', tipo: 'likert_5', factor: 'estabilidad_emocional', enunciado: 'Me cuesta recuperarme emocionalmente después de una sesión difícil.', invertido: true },
    { id: 'pt05', tipo: 'likert_5', factor: 'estabilidad_emocional', enunciado: 'Los días con muchas crisis me dejan agotado/a por horas.', invertido: true },
    { id: 'pt06', tipo: 'likert_5', factor: 'estabilidad_emocional', enunciado: 'Mantengo tono y volumen adecuados incluso bajo estrés.' },

    // ===== EMPATÍA Y CALIDEZ RELACIONAL =====
    { id: 'pt07', tipo: 'likert_5', factor: 'empatia_calidez', enunciado: 'Disfruto genuinamente el tiempo que paso con niños.' },
    { id: 'pt08', tipo: 'likert_5', factor: 'empatia_calidez', enunciado: 'Me cuesta conectar emocionalmente con los pacientes.', invertido: true },
    { id: 'pt09', tipo: 'likert_5', factor: 'empatia_calidez', enunciado: 'Noto cambios sutiles en el estado de ánimo de un niño.' },
    { id: 'pt10', tipo: 'likert_5', factor: 'empatia_calidez', enunciado: 'Prefiero mantener distancia emocional para verme "profesional".', invertido: true },
    { id: 'pt11', tipo: 'likert_5', factor: 'empatia_calidez', enunciado: 'La familia del paciente me interesa tanto como el paciente.' },
    { id: 'pt12', tipo: 'likert_5', factor: 'empatia_calidez', enunciado: 'Suelo priorizar el diagnóstico sobre la persona.', invertido: true },

    // ===== ORGANIZACIÓN, MÉTODO Y ADHERENCIA A PROTOCOLOS =====
    { id: 'pt13', tipo: 'likert_5', factor: 'organizacion_metodo', enunciado: 'Llevo registros sistemáticos de cada sesión.' },
    { id: 'pt14', tipo: 'likert_5', factor: 'organizacion_metodo', enunciado: 'Suelo improvisar sesión por sesión sin un plan escrito.', invertido: true },
    { id: 'pt15', tipo: 'likert_5', factor: 'organizacion_metodo', enunciado: 'Cumplo los horarios acordados con pacientes y familias.' },
    { id: 'pt16', tipo: 'likert_5', factor: 'organizacion_metodo', enunciado: 'Puedo seguir paso a paso un protocolo establecido de intervención.' },
    { id: 'pt17', tipo: 'likert_5', factor: 'organizacion_metodo', enunciado: 'Me distraigo con facilidad y pierdo detalles del registro.', invertido: true },
    { id: 'pt18', tipo: 'likert_5', factor: 'organizacion_metodo', enunciado: 'Anticipo los materiales necesarios antes de cada sesión.' },

    // ===== FLEXIBILIDAD COGNITIVA Y CREATIVIDAD CLÍNICA =====
    { id: 'pt19', tipo: 'likert_5', factor: 'flexibilidad_cognitiva', enunciado: 'Ajusto mis técnicas si noto que un niño no responde.' },
    { id: 'pt20', tipo: 'likert_5', factor: 'flexibilidad_cognitiva', enunciado: 'Me cuesta cambiar el plan cuando algo no funciona.', invertido: true },
    { id: 'pt21', tipo: 'likert_5', factor: 'flexibilidad_cognitiva', enunciado: 'Disfruto diseñar materiales nuevos y adaptados al niño.' },
    { id: 'pt22', tipo: 'likert_5', factor: 'flexibilidad_cognitiva', enunciado: 'Prefiero seguir siempre el mismo procedimiento aunque esté fallando.', invertido: true },
    { id: 'pt23', tipo: 'likert_5', factor: 'flexibilidad_cognitiva', enunciado: 'Formulo varias hipótesis antes de decidir una intervención.' },
    { id: 'pt24', tipo: 'likert_5', factor: 'flexibilidad_cognitiva', enunciado: 'Me incomoda la incertidumbre sobre el progreso del paciente.', invertido: true },

    // ===== MOTIVACIÓN DE SERVICIO Y COMPROMISO =====
    { id: 'pt25', tipo: 'likert_5', factor: 'motivacion_servicio', enunciado: 'Busco activamente actualizarme en intervención infantil.' },
    { id: 'pt26', tipo: 'likert_5', factor: 'motivacion_servicio', enunciado: 'Mi interés principal en este trabajo es económico.', invertido: true },
    { id: 'pt27', tipo: 'likert_5', factor: 'motivacion_servicio', enunciado: 'Comprometerme con el progreso de cada niño va más allá del horario.' },
    { id: 'pt28', tipo: 'likert_5', factor: 'motivacion_servicio', enunciado: 'Haría trabajo extra si sé que beneficia directamente al paciente.' },
    { id: 'pt29', tipo: 'likert_5', factor: 'motivacion_servicio', enunciado: 'Solo doy lo mínimo que el puesto requiere.', invertido: true },
    { id: 'pt30', tipo: 'likert_5', factor: 'motivacion_servicio', enunciado: 'Me motiva ver avances pequeños día a día.' },
  ],
};
