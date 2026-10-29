/**
 * Banco clínico infantil integrado a Super batería 01.
 *
 * NOTA METODOLÓGICA: reactivos originales inspirados en constructos teóricos;
 * no reproducen instrumentos licenciados ni constituyen diagnóstico o baremo.
 */
import { Prueba } from '@/types/evaluacion';

export const CONOCIMIENTOS_AUTISMO: Prueba = {
  id: 'conocimientos_autismo',
  nombre: 'Conocimientos en Autismo',
  tipo: 'conocimiento_tecnico',
  instrucciones:
    'Seleccione la respuesta más correcta según el estado actual del conocimiento científico sobre el Trastorno del Espectro Autista (TEA) y las buenas prácticas de intervención.',
  subareas: [
    'criterios_diagnosticos',
    'deteccion_temprana',
    'comorbilidades',
    'comunicacion_lenguaje',
    'sensorial_motor',
    'intervencion_evidencia',
    'familia_derechos',
    'neurodiversidad',
  ],
  items: [
    { id: 'ca01', tipo: 'opcion_multiple', subarea: 'criterios_diagnosticos',
      enunciado: 'Según el DSM-5, los dos dominios centrales del TEA son:',
      opciones: [
        { valor: 'A', etiqueta: 'Déficit en comunicación social e interacción, y patrones restrictivos/repetitivos de conducta, intereses o actividades.' },
        { valor: 'B', etiqueta: 'Déficit intelectual y déficit motor.' },
        { valor: 'C', etiqueta: 'Hiperactividad e impulsividad.' },
        { valor: 'D', etiqueta: 'Delirios y alucinaciones.' },
      ],
      respuestaCorrecta: 'A',
      justificacion: 'El DSM-5 fusiona comunicación e interacción social en un dominio y agrupa las conductas repetitivas en otro.' },

    { id: 'ca02', tipo: 'opcion_multiple', subarea: 'criterios_diagnosticos',
      enunciado: 'Los niveles de apoyo del DSM-5 son:',
      opciones: [
        { valor: 'A', etiqueta: 'Leve, moderado, severo y profundo.' },
        { valor: 'B', etiqueta: 'Nivel 1 (requiere apoyo), Nivel 2 (apoyo sustancial), Nivel 3 (apoyo muy sustancial).' },
        { valor: 'C', etiqueta: 'Alto funcionamiento / bajo funcionamiento.' },
        { valor: 'D', etiqueta: 'A, B, C.' },
      ],
      respuestaCorrecta: 'B',
      justificacion: 'El DSM-5 usa 3 niveles de apoyo según la necesidad de soporte, no según "gravedad".' },

    { id: 'ca03', tipo: 'opcion_multiple', subarea: 'criterios_diagnosticos',
      enunciado: 'El TEA se considera:',
      opciones: [
        { valor: 'A', etiqueta: 'Una enfermedad curable.' },
        { valor: 'B', etiqueta: 'Una condición del neurodesarrollo de por vida, con gran variabilidad en su presentación.' },
        { valor: 'C', etiqueta: 'Un problema de crianza.' },
        { valor: 'D', etiqueta: 'Una enfermedad contagiosa.' },
      ],
      respuestaCorrecta: 'B',
      justificacion: 'El TEA es una condición del neurodesarrollo. No se cura, no es contagiosa, no es causada por crianza.' },

    { id: 'ca04', tipo: 'opcion_multiple', subarea: 'deteccion_temprana',
      enunciado: 'Una señal temprana de alerta de TEA a los 18 meses es:',
      opciones: [
        { valor: 'A', etiqueta: 'No señalar para compartir interés (protodeclarativo) y no responder al nombre de forma consistente.' },
        { valor: 'B', etiqueta: 'Llorar cuando tiene hambre.' },
        { valor: 'C', etiqueta: 'Preferir a su madre.' },
        { valor: 'D', etiqueta: 'Caminar a los 12 meses.' },
      ],
      respuestaCorrecta: 'A',
      justificacion: 'La ausencia de conductas protodeclarativas (señalar para compartir interés) es señal temprana de alerta.' },

    { id: 'ca05', tipo: 'opcion_multiple', subarea: 'deteccion_temprana',
      enunciado: 'El M-CHAT es:',
      opciones: [
        { valor: 'A', etiqueta: 'Un instrumento diagnóstico definitivo.' },
        { valor: 'B', etiqueta: 'Un cuestionario de tamizaje para detección temprana de riesgo de TEA; no diagnostica.' },
        { valor: 'C', etiqueta: 'Un test de inteligencia.' },
        { valor: 'D', etiqueta: 'Una entrevista a docentes.' },
      ],
      respuestaCorrecta: 'B',
      justificacion: 'M-CHAT es tamizaje. Un resultado positivo requiere evaluación diagnóstica completa.' },

    { id: 'ca06', tipo: 'opcion_multiple', subarea: 'comorbilidades',
      enunciado: 'Una comorbilidad frecuente en el TEA es:',
      opciones: [
        { valor: 'A', etiqueta: 'Ansiedad, TDAH, trastornos del sueño y epilepsia.' },
        { valor: 'B', etiqueta: 'Esquizofrenia en la infancia.' },
        { valor: 'C', etiqueta: 'Albinismo.' },
        { valor: 'D', etiqueta: 'Ninguna.' },
      ],
      respuestaCorrecta: 'A',
      justificacion: 'Ansiedad, TDAH, problemas de sueño y epilepsia son comorbilidades frecuentes y deben evaluarse.' },

    { id: 'ca07', tipo: 'opcion_multiple', subarea: 'criterios_diagnosticos',
      enunciado: '¿Cuál NO es criterio del TEA según el DSM-5?',
      opciones: [
        { valor: 'A', etiqueta: 'Déficit en comunicación e interacción social.' },
        { valor: 'B', etiqueta: 'Conductas repetitivas e intereses restringidos.' },
        { valor: 'C', etiqueta: 'Coeficiente intelectual bajo.' },
        { valor: 'D', etiqueta: 'Síntomas presentes en la primera infancia.' },
      ],
      respuestaCorrecta: 'C',
      justificacion: 'El CI bajo NO es criterio. El TEA tiene gran variabilidad cognitiva.' },

    { id: 'ca08', tipo: 'opcion_multiple', subarea: 'criterios_diagnosticos',
      enunciado: 'TEA vs. discapacidad intelectual (DI):',
      opciones: [
        { valor: 'A', etiqueta: 'Son lo mismo.' },
        { valor: 'B', etiqueta: 'Son condiciones distintas; pueden coexistir y el TEA no se define por el CI.' },
        { valor: 'C', etiqueta: 'La DI excluye el TEA.' },
        { valor: 'D', etiqueta: 'El TEA solo ocurre con CI alto.' },
      ],
      respuestaCorrecta: 'B',
      justificacion: 'Son entidades distintas que pueden coexistir. El diagnóstico de TEA no depende del CI.' },

    { id: 'ca09', tipo: 'opcion_multiple', subarea: 'comunicacion_lenguaje',
      enunciado: 'En TEA, la ausencia de lenguaje oral a los 4 años:',
      opciones: [
        { valor: 'A', etiqueta: 'Excluye cualquier forma de comunicación.' },
        { valor: 'B', etiqueta: 'No impide la comunicación; se favorece con CAA, PECS o signos, y nunca debe impedirse la comunicación alternativa.' },
        { valor: 'C', etiqueta: 'Significa que no hay nada que hacer.' },
        { valor: 'D', etiqueta: 'Se resuelve con terapia conductual solamente.' },
      ],
      respuestaCorrecta: 'B',
      justificacion: 'La CAA es una práctica basada en evidencia y no impide el desarrollo del lenguaje oral.' },

    { id: 'ca10', tipo: 'opcion_multiple', subarea: 'comunicacion_lenguaje',
      enunciado: 'El lenguaje en TEA puede incluir:',
      opciones: [
        { valor: 'A', etiqueta: 'Ecolalia, lenguaje literal, dificultad con prosodia y pragmática.' },
        { valor: 'B', etiqueta: 'Solo lenguaje fluido.' },
        { valor: 'C', etiqueta: 'Solo lenguaje escrito.' },
        { valor: 'D', etiqueta: 'Solo lenguaje no verbal.' },
      ],
      respuestaCorrecta: 'A',
      justificacion: 'La pragmática y la prosodia suelen ser áreas afectadas; la ecolalia puede ser comunicativa.' },

    { id: 'ca11', tipo: 'opcion_multiple', subarea: 'sensorial_motor',
      enunciado: 'Las diferencias sensoriales en TEA se refieren a:',
      opciones: [
        { valor: 'A', etiqueta: 'Solo hipersensibilidad auditiva.' },
        { valor: 'B', etiqueta: 'Hiper o hiporreactividad a estímulos sensoriales, e interés inusual por aspectos sensoriales del entorno.' },
        { valor: 'C', etiqueta: 'Problemas de visión exclusivamente.' },
        { valor: 'D', etiqueta: 'Nada, el TEA no afecta los sentidos.' },
      ],
      respuestaCorrecta: 'B',
      justificacion: 'El perfil sensorial es muy variable: hiper o hiporreactividad, búsqueda o evitación sensorial.' },

    { id: 'ca12', tipo: 'opcion_multiple', subarea: 'sensorial_motor',
      enunciado: 'Ante un niño con hipersensibilidad auditiva en un entorno ruidoso, lo más adecuado es:',
      opciones: [
        { valor: 'A', etiqueta: 'Exponerlo al ruido hasta que se acostumbre.' },
        { valor: 'B', etiqueta: 'Reducir el ruido, ofrecer protectores auditivos y anticiparle con apoyos visuales el entorno.' },
        { valor: 'C', etiqueta: 'Ignorar su malestar.' },
        { valor: 'D', etiqueta: 'Gritar para que "se acostumbre".' },
      ],
      respuestaCorrecta: 'B',
      justificacion: 'Las adaptaciones sensoriales reducen el malestar y facilitan la participación. La exposición forzada es contraproducente.' },

    { id: 'ca13', tipo: 'opcion_multiple', subarea: 'sensorial_motor',
      enunciado: 'La estereotipia (aleteo, balanceo) en TEA:',
      opciones: [
        { valor: 'A', etiqueta: 'Siempre debe eliminarse.' },
        { valor: 'B', etiqueta: 'Es una conducta que puede ser autoestimulatoria y reguladora; se interviene solo si interfiere con aprendizaje o causa daño.' },
        { valor: 'C', etiqueta: 'Es contagiosa.' },
        { valor: 'D', etiqueta: 'Indica retraso intelectual.' },
      ],
      respuestaCorrecta: 'B',
      justificacion: 'La neurodiversidad reconoce la función reguladora de la estereotipia. No toda requiere intervención.' },

    { id: 'ca14', tipo: 'opcion_multiple', subarea: 'criterios_diagnosticos',
      enunciado: 'El concepto de "espectro" en TEA significa:',
      opciones: [
        { valor: 'A', etiqueta: 'Que existen 3 tipos fijos.' },
        { valor: 'B', etiqueta: 'Que hay gran variabilidad en la presentación de cada persona en las dos dimensiones diagnósticas.' },
        { valor: 'C', etiqueta: 'Que solo hay personas con alto funcionamiento.' },
        { valor: 'D', etiqueta: 'Que todos los casos son iguales.' },
      ],
      respuestaCorrecta: 'B',
      justificacion: 'El espectro refleja variabilidad: no existen subtipos fijos; cada persona es única.' },

    { id: 'ca15', tipo: 'opcion_multiple', subarea: 'criterios_diagnosticos',
      enunciado: 'El síndrome de Asperger en el DSM-5:',
      opciones: [
        { valor: 'A', etiqueta: 'Se mantiene como diagnóstico independiente.' },
        { valor: 'B', etiqueta: 'Se integró dentro del TEA (Nivel 1 de apoyo).' },
        { valor: 'C', etiqueta: 'Desapareció por completo.' },
        { valor: 'D', etiqueta: 'Es un trastorno de ansiedad.' },
      ],
      respuestaCorrecta: 'B',
      justificacion: 'El DSM-5 agrupó el síndrome de Asperger en el TEA, Nivel 1. Clínicamente algunas personas siguen usando el término como identidad.' },

    { id: 'ca16', tipo: 'opcion_multiple', subarea: 'intervencion_evidencia',
      enunciado: 'Las intervenciones con mayor evidencia en TEA temprano incluyen:',
      opciones: [
        { valor: 'A', etiqueta: 'Intervenciones conductuales intensivas (ABA), ESDM, intervención mediada por padres y logopedia/CAA.' },
        { valor: 'B', etiqueta: 'Quelación y cámaras hiperbáricas.' },
        { valor: 'C', etiqueta: 'Solo medicamentos.' },
        { valor: 'D', etiqueta: 'Dietas de eliminación.' },
      ],
      respuestaCorrecta: 'A',
      justificacion: 'ABA, ESDM, intervención mediada por padres y CAA/logopedia son prácticas basadas en evidencia. Quelación es peligrosa y sin sustento.' },

    { id: 'ca17', tipo: 'opcion_multiple', subarea: 'intervencion_evidencia',
      enunciado: 'El programa TEACCH se caracteriza por:',
      opciones: [
        { valor: 'A', etiqueta: 'Estructuración del ambiente, agendas visuales y trabajo en sistemas.' },
        { valor: 'B', etiqueta: 'Castigo físico.' },
        { valor: 'C', etiqueta: 'Solo trabajo en casa.' },
        { valor: 'D', etiqueta: 'Pura farmacología.' },
      ],
      respuestaCorrecta: 'A',
      justificacion: 'TEACCH estructura el entorno y usa apoyos visuales para favorecer autonomía y comprensión.' },

    { id: 'ca18', tipo: 'opcion_multiple', subarea: 'intervencion_evidencia',
      enunciado: 'ESDM (Early Start Denver Model) es:',
      opciones: [
        { valor: 'A', etiqueta: 'Un modelo de intervención temprana naturalista del desarrollo, con base conductual y relacional, para niños pequeños con TEA.' },
        { valor: 'B', etiqueta: 'Un medicamento.' },
        { valor: 'C', etiqueta: 'Un test diagnóstico.' },
        { valor: 'D', etiqueta: 'Una dieta.' },
      ],
      respuestaCorrecta: 'A',
      justificacion: 'ESDM es un modelo comprehensivo, naturalista y con evidencia, que integra ABA y desarrollo.' },

    { id: 'ca19', tipo: 'opcion_multiple', subarea: 'intervencion_evidencia',
      enunciado: 'El refuerzo en la intervención con TEA:',
      opciones: [
        { valor: 'A', etiqueta: 'Es opcional.' },
        { valor: 'B', etiqueta: 'Es fundamental: se individualiza según preferencias y se combina con refuerzo social y natural.' },
        { valor: 'C', etiqueta: 'Solo debe ser comestible.' },
        { valor: 'D', etiqueta: 'Es un castigo encubierto.' },
      ],
      respuestaCorrecta: 'B',
      justificacion: 'El refuerzo individualizado y natural es pilar de la intervención conductual.' },

    { id: 'ca20', tipo: 'opcion_multiple', subarea: 'intervencion_evidencia',
      enunciado: 'El "entrenamiento a padres" en TEA:',
      opciones: [
        { valor: 'A', etiqueta: 'Es secundario.' },
        { valor: 'B', etiqueta: 'Es una práctica con evidencia que mejora la generalización y el bienestar familiar.' },
        { valor: 'C', etiqueta: 'Debe evitarse para no sobrecargar a la familia.' },
        { valor: 'D', etiqueta: 'Solo aplica en casos severos.' },
      ],
      respuestaCorrecta: 'B',
      justificacion: 'La intervención mediada por padres es una práctica basada en evidencia, especialmente en primera infancia.' },

    { id: 'ca21', tipo: 'opcion_multiple', subarea: 'familia_derechos',
      enunciado: 'La Ley General para la Atención y Protección a Personas con la Condición del Espectro Autista en México establece:',
      opciones: [
        { valor: 'A', etiqueta: 'Derecho a la atención, educación inclusiva, no discriminación y protección de sus derechos.' },
        { valor: 'B', etiqueta: 'Obligatoriedad de institucionalización.' },
        { valor: 'C', etiqueta: 'Exclusión del sistema educativo regular.' },
        { valor: 'D', etiqueta: 'Solo cubre a menores de 6 años.' },
      ],
      respuestaCorrecta: 'A',
      justificacion: 'La ley garantiza derechos a la atención, educación inclusiva, no discriminación y protección.' },

    { id: 'ca22', tipo: 'opcion_multiple', subarea: 'familia_derechos',
      enunciado: 'En la comunicación con familias de niños con TEA, el terapeuta debe:',
      opciones: [
        { valor: 'A', etiqueta: 'Imponer decisiones.' },
        { valor: 'B', etiqueta: 'Informar con claridad, respetar su cultura y valores, y trabajar en alianza con la familia.' },
        { valor: 'C', etiqueta: 'Ocultar el diagnóstico.' },
        { valor: 'D', etiqueta: 'Evitar hablar del tema.' },
      ],
      respuestaCorrecta: 'B',
      justificacion: 'La familia es corresponsable del plan. Se trabaja en alianza respetando valores y contexto.' },

    { id: 'ca23', tipo: 'opcion_multiple', subarea: 'neurodiversidad',
      enunciado: 'El paradigma de neurodiversidad propone que el TEA:',
      opciones: [
        { valor: 'A', etiqueta: 'Es una enfermedad a erradicar.' },
        { valor: 'B', etiqueta: 'Es una forma distinta de desarrollo neurológico que requiere apoyos y respeto a la identidad de la persona.' },
        { valor: 'C', etiqueta: 'Debe ocultarse socialmente.' },
        { valor: 'D', etiqueta: 'Solo requiere medicalización.' },
      ],
      respuestaCorrecta: 'B',
      justificacion: 'La neurodiversidad promueve respeto, apoyos y derechos; no busca "curar" a la persona autista.' },

    { id: 'ca24', tipo: 'opcion_multiple', subarea: 'neurodiversidad',
      enunciado: 'El lenguaje recomendado actualmente por comunidades autistas es:',
      opciones: [
        { valor: 'A', etiqueta: '"Autista" (identidad) o "persona autista" (identidad-primero), según la preferencia de cada persona.' },
        { valor: 'B', etiqueta: '"Enfermo de autismo".' },
        { valor: 'C', etiqueta: '"Afectado por autismo".' },
        { valor: 'D', etiqueta: '"Sufre autismo".' },
      ],
      respuestaCorrecta: 'A',
      justificacion: 'Muchas personas autistas prefieren "persona autista" o "autista" por identidad. Evitar términos que sugieran enfermedad.' },

    { id: 'ca25', tipo: 'opcion_multiple', subarea: 'neurodiversidad',
      enunciado: 'El mito de que "las vacunas causan autismo":',
      opciones: [
        { valor: 'A', etiqueta: 'Tiene evidencia reciente que lo confirma.' },
        { valor: 'B', etiqueta: 'Ha sido desmentido por múltiples estudios; el estudio original fue retractado por fraude.' },
        { valor: 'C', etiqueta: 'Solo aplica en algunos países.' },
        { valor: 'D', etiqueta: 'Es cierto en ciertas cepas.' },
      ],
      respuestaCorrecta: 'B',
      justificacion: 'La evidencia es contundente: no hay relación entre vacunas y autismo. El estudio original fue retractado.' },

    { id: 'ca26', tipo: 'opcion_multiple', subarea: 'comunicacion_lenguaje',
      enunciado: 'La comunicación en TEA:',
      opciones: [
        { valor: 'A', etiqueta: 'Es idéntica en todas las personas.' },
        { valor: 'B', etiqueta: 'Es heterogénea: puede incluir lenguaje oral, CAA, signos, escritura, gestos y otras formas; se debe respetar y facilitar.' },
        { valor: 'C', etiqueta: 'Solo cuenta el lenguaje oral.' },
        { valor: 'D', etiqueta: 'Solo la comunicación no verbal.' },
      ],
      respuestaCorrecta: 'B',
      justificacion: 'La comunicación es multimodal. Respetar y facilitar el sistema preferido del niño es esencial.' },

    { id: 'ca27', tipo: 'opcion_multiple', subarea: 'intervencion_evidencia',
      enunciado: 'En cuanto a la "cura" del autismo:',
      opciones: [
        { valor: 'A', etiqueta: 'Existe cura.' },
        { valor: 'B', etiqueta: 'No hay cura; el objetivo de la intervención es mejorar calidad de vida, autonomía, comunicación y bienestar.' },
        { valor: 'C', etiqueta: 'Se cura con dieta.' },
        { valor: 'D', etiqueta: 'Se cura con medicamentos.' },
      ],
      respuestaCorrecta: 'B',
      justificacion: 'No existe cura. Intervención = apoyos para calidad de vida y desarrollo, no "eliminar" la condición.' },

    { id: 'ca28', tipo: 'opcion_multiple', subarea: 'sensorial_motor',
      enunciado: 'Ante un niño en crisis (meltdown) por sobrecarga sensorial, lo más adecuado es:',
      opciones: [
        { valor: 'A', etiqueta: 'Razonar verbalmente con él en ese momento.' },
        { valor: 'B', etiqueta: 'Reducir estímulos, garantizar seguridad, dar espacio y usar comunicación mínima/clara.' },
        { valor: 'C', etiqueta: 'Castigarlo.' },
        { valor: 'D', etiqueta: 'Gritar.' },
      ],
      respuestaCorrecta: 'B',
      justificacion: 'Un meltdown no es un berrinche manipulativo. Reducir estímulos y contener con calma es lo adecuado.' },

    { id: 'ca29', tipo: 'opcion_multiple', subarea: 'familia_derechos',
      enunciado: 'El derecho a la educación inclusiva implica:',
      opciones: [
        { valor: 'A', etiqueta: 'Que el niño esté siempre en escuela especial.' },
        { valor: 'B', etiqueta: 'Que el niño pueda acceder a la escuela regular con los apoyos necesarios.' },
        { valor: 'C', etiqueta: 'Que la familia pague escuela privada.' },
        { valor: 'D', etiqueta: 'Que se le excluya si no aprende al ritmo del grupo.' },
      ],
      respuestaCorrecta: 'B',
      justificacion: 'La inclusión educativa es un derecho con apoyos, no un privilegio ni una exclusión encubierta.' },

    { id: 'ca30', tipo: 'opcion_multiple', subarea: 'neurodiversidad',
      enunciado: 'El terapeuta que trabaja con personas autistas debe:',
      opciones: [
        { valor: 'A', etiqueta: 'Imponer sus valores sobre el niño.' },
        { valor: 'B', etiqueta: 'Escuchar y respetar la voz de la persona autista y de su familia, evitando prácticas aversivas y respetando la identidad.' },
        { valor: 'C', etiqueta: 'Buscar "normalizar" a toda costa.' },
        { valor: 'D', etiqueta: 'Evitar dar información a la familia.' },
      ],
      respuestaCorrecta: 'B',
      justificacion: 'La buena práctica actual es respetuosa, centrada en la persona y libre de prácticas aversivas.' },
  ],
};
