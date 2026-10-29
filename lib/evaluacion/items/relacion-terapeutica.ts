/**
 * Banco clínico infantil integrado a Super batería 01.
 *
 * NOTA METODOLÓGICA: reactivos originales inspirados en constructos teóricos;
 * no reproducen instrumentos licenciados ni constituyen diagnóstico o baremo.
 */
import { Prueba } from '@/types/evaluacion';

export const RELACION_TERAPEUTICA: Prueba = {
  id: 'relacion_terapeutica',
  nombre: 'Relación Terapéutica',
  tipo: 'juicio_clinico',
  instrucciones:
    'Ante cada situación con un niño o su familia, elija la respuesta que represente la MEJOR conducta desde el punto de vista de la relación terapéutica y la alianza con la familia.',
  subareas: [
    'alianza_terapeutica',
    'empatia_escucha',
    'limites_calidez',
    'manejo_rupturas',
    'contratransferencia',
    'trabajo_familia',
    'colaboracion_interdisciplinaria',
    'autocuidado_terapeuta',
  ],
  items: [
    { id: 'rt01', tipo: 'escenario_clinico', subarea: 'alianza_terapeutica',
      enunciado: 'Primera sesión: el niño llora y se aferra a su mamá al entrar a la sala. Lo más adecuado es:',
      opciones: [
        { valor: 'A', etiqueta: 'Separarlo rápido para iniciar.' },
        { valor: 'B', etiqueta: 'Permitir que la madre entre brevemente, explorar intereses del niño y hacer la transición gradual.' },
        { valor: 'C', etiqueta: 'Cancelar la sesión.' },
        { valor: 'D', etiqueta: 'Decirle que "los niños grandes no lloran".' },
      ],
      respuestaCorrecta: 'B',
      justificacion: 'La alianza se construye respetando el ritmo del niño y la seguridad del vínculo con el cuidador.' },

    { id: 'rt02', tipo: 'escenario_clinico', subarea: 'manejo_rupturas',
      enunciado: 'Cambias el plan de la sesión sin avisar al niño. Él se enoja y deja de responder. Lo correcto es:',
      opciones: [
        { valor: 'A', etiqueta: 'Ignorar el enojo y seguir.' },
        { valor: 'B', etiqueta: 'Reconocer el cambio, validar el enojo, explicar el motivo y ofrecer elección dentro del plan.' },
        { valor: 'C', etiqueta: 'Castigarlo por no responder.' },
        { valor: 'D', etiqueta: 'Terminar la sesión sin hablar.' },
      ],
      respuestaCorrecta: 'B',
      justificacion: 'Reconocer y reparar rupturas fortalece la alianza (Safran & Muran). Validar es clave.' },

    { id: 'rt03', tipo: 'escenario_clinico', subarea: 'trabajo_familia',
      enunciado: 'La madre critica duramente tu trabajo frente a ti. Lo más adecuado es:',
      opciones: [
        { valor: 'A', etiqueta: 'Defenderte y devolver la crítica.' },
        { valor: 'B', etiqueta: 'Escuchar, validar su preocupación, pedir ejemplos concretos y acordar ajustes juntos.' },
        { valor: 'C', etiqueta: 'Ignorarla.' },
        { valor: 'D', etiqueta: 'Terminar la relación terapéutica.' },
      ],
      respuestaCorrecta: 'B',
      justificacion: 'La crítica es información. Escuchar, validar y colaborar mantiene la alianza con la familia.' },

    { id: 'rt04', tipo: 'escenario_clinico', subarea: 'limites_calidez',
      enunciado: 'El niño te dice "eres mi mejor amiga". Lo más adecuado es:',
      opciones: [
        { valor: 'A', etiqueta: 'Confirmarle que eres su amiga.' },
        { valor: 'B', etiqueta: 'Recibir el afecto con calidez, recordar que eres su terapeuta y que eso también es un lugar seguro.' },
        { valor: 'C', etiqueta: 'Ignorar el comentario.' },
        { valor: 'D', etiqueta: 'Regañarlo.' },
      ],
      respuestaCorrecta: 'B',
      justificacion: 'Límites con calidez: se valora el afecto y se aclara el rol sin rechazar.' },

    { id: 'rt05', tipo: 'escenario_clinico', subarea: 'limites_calidez',
      enunciado: 'En plena sesión el niño te agrede físicamente. Lo primero es:',
      opciones: [
        { valor: 'A', etiqueta: 'Gritar y castigarlo.' },
        { valor: 'B', etiqueta: 'Garantizar seguridad propia y del niño, retirar la demanda, mantener tono bajo y registrar el incidente.' },
        { valor: 'C', etiqueta: 'Ignorarlo.' },
        { valor: 'D', etiqueta: 'Sujetarlo con fuerza.' },
      ],
      respuestaCorrecta: 'B',
      justificacion: 'La seguridad es prioridad. Se contiene la situación sin escalada y se documenta para supervisión.' },

    { id: 'rt06', tipo: 'escenario_clinico', subarea: 'trabajo_familia',
      enunciado: 'La familia no sigue las recomendaciones en casa. Lo más adecuado es:',
      opciones: [
        { valor: 'A', etiqueta: 'Culparlos.' },
        { valor: 'B', etiqueta: 'Explorar barreras (tiempo, recursos, creencias), ajustar las recomendaciones a su realidad y reforzar avances.' },
        { valor: 'C', etiqueta: 'Darles de alta.' },
        { valor: 'D', etiqueta: 'Repetir la misma indicación más fuerte.' },
      ],
      respuestaCorrecta: 'B',
      justificacion: 'La adherencia mejora cuando se entienden barreras y se co-construyen soluciones realistas.' },

    { id: 'rt07', tipo: 'escenario_clinico', subarea: 'contratransferencia',
      enunciado: 'Sientes irritación constante con la madre de un paciente. La conducta profesional es:',
      opciones: [
        { valor: 'A', etiqueta: 'Expresar la irritación en sesión.' },
        { valor: 'B', etiqueta: 'Reconocer la emoción, buscar supervisión para entenderla, revisar el caso con objetividad y ajustar la intervención si es necesario.' },
        { valor: 'C', etiqueta: 'Ignorar el sentimiento.' },
        { valor: 'D', etiqueta: 'Transferir el caso sin explicar.' },
      ],
      respuestaCorrecta: 'B',
      justificacion: 'La contratransferencia es información clínica. Se trabaja en supervisión, no se actúa impulsivamente.' },

    { id: 'rt08', tipo: 'escenario_clinico', subarea: 'empatia_escucha',
      enunciado: 'Un niño te cuenta algo doloroso sobre su familia. Lo más adecuado es:',
      opciones: [
        { valor: 'A', etiqueta: 'Interrumpir para dar una solución.' },
        { valor: 'B', etiqueta: 'Escuchar con atención, reflejar lo que dice ("entiendo que eso te dolió") y validar sin minimizar.' },
        { valor: 'C', etiqueta: 'Cambiar de tema.' },
        { valor: 'D', etiqueta: 'Decirle que exagera.' },
      ],
      respuestaCorrecta: 'B',
      justificacion: 'Escucha activa y validación sostienen la alianza y permiten que el menor se exprese.' },

    { id: 'rt09', tipo: 'escenario_clinico', subarea: 'alianza_terapeutica',
      enunciado: 'Para construir rapport inicial con un niño con TEA, lo más efectivo es:',
      opciones: [
        { valor: 'A', etiqueta: 'Iniciar con preguntas verbales complejas.' },
        { valor: 'B', etiqueta: 'Observar sus intereses, unirse brevemente a su juego y usar apoyos visuales/estructura predecible.' },
        { valor: 'C', etiqueta: 'Exigir contacto visual.' },
        { valor: 'D', etiqueta: 'Comenzar con tareas de dificultad alta.' },
      ],
      respuestaCorrecta: 'B',
      justificacion: 'El rapport con TEA se construye desde intereses, estructura y respeto al perfil sensorial.' },

    { id: 'rt10', tipo: 'escenario_clinico', subarea: 'trabajo_familia',
      enunciado: 'Al comunicar un diagnóstico o un avance lento a la familia debes:',
      opciones: [
        { valor: 'A', etiqueta: 'Usar tecnicismos para no herir.' },
        { valor: 'B', etiqueta: 'Usar lenguaje claro, validar emociones, dar espacio a preguntas, ofrecer plan y seguimiento.' },
        { valor: 'C', etiqueta: 'Decir solo lo positivo.' },
        { valor: 'D', etiqueta: 'Dar la noticia por escrito sin conversar.' },
      ],
      respuestaCorrecta: 'B',
      justificacion: 'La comunicación clínica requiere claridad, contención emocional y plan de acción.' },

    { id: 'rt11', tipo: 'escenario_clinico', subarea: 'colaboracion_interdisciplinaria',
      enunciado: 'La maestra de la escuela no está de acuerdo con tu plan de intervención. Lo más adecuado es:',
      opciones: [
        { valor: 'A', etiqueta: 'Imponer tu plan.' },
        { valor: 'B', etiqueta: 'Escuchar, explicar el fundamento del plan, buscar puntos en común y coordinar objetivos compartidos en beneficio del niño.' },
        { valor: 'C', etiqueta: 'Evitar a la maestra.' },
        { valor: 'D', etiqueta: 'Quejarte con la familia.' },
      ],
      respuestaCorrecta: 'B',
      justificacion: 'La colaboración interdisciplinaria mejora resultados. Imponer fragmenta el apoyo.' },

    { id: 'rt12', tipo: 'escenario_clinico', subarea: 'trabajo_familia',
      enunciado: 'Un padre insiste en usar castigo físico con su hijo. Lo más adecuado es:',
      opciones: [
        { valor: 'A', etiqueta: 'Ignorar porque es su familia.' },
        { valor: 'B', etiqueta: 'Escuchar sus motivos, explicar por qué es contraproducente y ofrece alternativas concretas; activar protocolo si hay riesgo.' },
        { valor: 'C', etiqueta: 'Gritarle.' },
        { valor: 'D', etiqueta: 'Culparlo sin dialogar.' },
      ],
      respuestaCorrecta: 'B',
      justificacion: 'Se trabaja con la familia desde la alianza y la evidencia, activando protocolo ante riesgo.' },

    { id: 'rt13', tipo: 'escenario_clinico', subarea: 'empatia_escucha',
      enunciado: 'El niño no habla durante 20 minutos. Lo más adecuado es:',
      opciones: [
        { valor: 'A', etiqueta: 'Llenar el silencio con preguntas continuas.' },
        { valor: 'B', etiqueta: 'Respetar el silencio, ofrecer materiales o actividades de baja demanda y narrar lo que observas sin exigir respuesta.' },
        { valor: 'C', etiqueta: 'Terminar la sesión.' },
        { valor: 'D', etiqueta: 'Decirle que se apure.' },
      ],
      respuestaCorrecta: 'B',
      justificacion: 'El silencio puede ser parte del proceso. La presencia calmada y la oferta de actividades de baja demanda son apropiadas.' },

    { id: 'rt14', tipo: 'escenario_clinico', subarea: 'alianza_terapeutica',
      enunciado: 'Para establecer metas terapéuticas significativas con la familia, lo más adecuado es:',
      opciones: [
        { valor: 'A', etiqueta: 'Definir tú solo las metas.' },
        { valor: 'B', etiqueta: 'Co-construir metas priorizando la voz del niño (cuando aplique) y de la familia, junto con el criterio clínico.' },
        { valor: 'C', etiqueta: 'Usar solo las metas de la escuela.' },
        { valor: 'D', etiqueta: 'Copiar metas de otro caso.' },
      ],
      respuestaCorrecta: 'B',
      justificacion: 'Metas co-construidas mejoran la adherencia. La voz del menor es central.' },

    { id: 'rt15', tipo: 'escenario_clinico', subarea: 'manejo_rupturas',
      enunciado: 'Un niño te dice "ya no quiero venir, tú no me entiendes". Lo más adecuado es:',
      opciones: [
        { valor: 'A', etiqueta: 'Discutir con él y decirle que está equivocado.' },
        { valor: 'B', etiqueta: 'Tomar en serio su percepción, explorar qué le molestó y acordar cambios concretos.' },
        { valor: 'C', etiqueta: 'Ignorarlo.' },
        { valor: 'D', etiqueta: 'Quejarte con los padres.' },
      ],
      respuestaCorrecta: 'B',
      justificacion: 'Las rupturas de alianza se reparan escuchando activamente y ajustando el proceso.' },

    { id: 'rt16', tipo: 'escenario_clinico', subarea: 'colaboracion_interdisciplinaria',
      enunciado: 'Un colega del equipo sugiere una estrategia que no compartes. Lo más adecuado es:',
      opciones: [
        { valor: 'A', etiqueta: 'Rechazarla públicamente.' },
        { valor: 'B', etiqueta: 'Conversar en privado, escuchar fundamentos, presentar argumentos con evidencia y acordar en beneficio del niño.' },
        { valor: 'C', etiqueta: 'Ignorarlo.' },
        { valor: 'D', etiqueta: 'Reportarlo.' },
      ],
      respuestaCorrecta: 'B',
      justificacion: 'El diálogo profesional privado y basado en evidencia es la mejor vía.' },

    { id: 'rt17', tipo: 'escenario_clinico', subarea: 'autocuidado_terapeuta',
      enunciado: 'Sientes agotamiento y despersonalización por sobrecarga de casos. Lo profesional es:',
      opciones: [
        { valor: 'A', etiqueta: 'Seguir hasta colapsar.' },
        { valor: 'B', etiqueta: 'Reconocer el burnout, buscar supervisión y autocuidado, ajustar carga de trabajo y, si es necesario, tomar pausa.' },
        { valor: 'C', etiqueta: 'Descargar la frustración con las familias.' },
        { valor: 'D', etiqueta: 'Ignorar los síntomas.' },
      ],
      respuestaCorrecta: 'B',
      justificacion: 'El autocuidado es una obligación ética: el desgaste afecta la calidad del servicio.' },

    { id: 'rt18', tipo: 'escenario_clinico', subarea: 'limites_calidez',
      enunciado: 'Un niño te pide tu número personal para escribirte. Lo más adecuado es:',
      opciones: [
        { valor: 'A', etiqueta: 'Darle tu número.' },
        { valor: 'B', etiqueta: 'Explicarle con calidez que la comunicación pasa por los canales del servicio y que en sesión puedes escucharlo.' },
        { valor: 'C', etiqueta: 'Regañarlo.' },
        { valor: 'D', etiqueta: 'Ignorarlo.' },
      ],
      respuestaCorrecta: 'B',
      justificacion: 'Límites claros protegen al menor y la relación terapéutica.' },

    { id: 'rt19', tipo: 'escenario_clinico', subarea: 'manejo_rupturas',
      enunciado: 'El niño comienza a evitar la mirada y a responder con monosílabos después de una sesión en la que te enojaste. Lo más adecuado es:',
      opciones: [
        { valor: 'A', etiqueta: 'Ignorar y seguir.' },
        { valor: 'B', etiqueta: 'Nombrar lo sucedido, disculparte si hubo un error, validar su experiencia y reconstruir la alianza.' },
        { valor: 'C', etiqueta: 'Culparlo.' },
        { valor: 'D', etiqueta: 'Suspender el tratamiento.' },
      ],
      respuestaCorrecta: 'B',
      justificacion: 'La reparación incluye reconocer el impacto, disculparse cuando es necesario y reconstruir la confianza.' },

    { id: 'rt20', tipo: 'escenario_clinico', subarea: 'trabajo_familia',
      enunciado: 'Los padres están separados y tienen visiones distintas sobre la intervención. Lo más adecuado es:',
      opciones: [
        { valor: 'A', etiqueta: 'Elegir la visión de uno de los dos.' },
        { valor: 'B', etiqueta: 'Escuchar a ambos, mantener neutralidad, centrar el plan en el interés superior del niño y coordinar objetivos comunes.' },
        { valor: 'C', etiqueta: 'Rechazar el caso.' },
        { valor: 'D', etiqueta: 'Decidir por ellos.' },
      ],
      respuestaCorrecta: 'B',
      justificacion: 'Neutralidad y foco en el menor, con objetivos comunes, es la guía ética y clínica.' },

    { id: 'rt21', tipo: 'escenario_clinico', subarea: 'contratransferencia',
      enunciado: 'Sientes que un niño "te recuerda a ti de pequeño". Lo profesional es:',
      opciones: [
        { valor: 'A', etiqueta: 'Compartirlo con el niño.' },
        { valor: 'B', etiqueta: 'Reconocerlo, trabajarlo en supervisión propia y monitorear cómo influye en tus decisiones clínicas.' },
        { valor: 'C', etiqueta: 'Ignorarlo.' },
        { valor: 'D', etiqueta: 'Derivar de inmediato sin explicar.' },
      ],
      respuestaCorrecta: 'B',
      justificacion: 'La contratransferencia se trabaja en el propio espacio terapéutico/supervisión para no contaminar el caso.' },

    { id: 'rt22', tipo: 'escenario_clinico', subarea: 'empatia_escucha',
      enunciado: 'Al dar feedback a los padres sobre una conducta del niño, lo más adecuado es:',
      opciones: [
        { valor: 'A', etiqueta: 'Señalar solo lo negativo.' },
        { valor: 'B', etiqueta: 'Empezar con fortalezas, describir la conducta de forma objetiva, explicar el plan y ofrecer apoyo concreto.' },
        { valor: 'C', etiqueta: 'Hablar solo con uno de los padres.' },
        { valor: 'D', etiqueta: 'Enviar una lista de errores.' },
      ],
      respuestaCorrecta: 'B',
      justificacion: 'El feedback efectivo es específico, objetivo, equilibrado y orientado a la acción.' },

    { id: 'rt23', tipo: 'escenario_clinico', subarea: 'colaboracion_interdisciplinaria',
      enunciado: 'Detectas que la maestra está aplicando un procedimiento incompatible con el plan. Lo más adecuado es:',
      opciones: [
        { valor: 'A', etiqueta: 'Reportarla.' },
        { valor: 'B', etiqueta: 'Hablar con ella, entender el contexto, alinear el procedimiento y ofrecer apoyo/modelado.' },
        { valor: 'C', etiqueta: 'Ignorarlo.' },
        { valor: 'D', etiqueta: 'Cambiar todo el plan.' },
      ],
      respuestaCorrecta: 'B',
      justificacion: 'La alineación escuela-terapia requiere comunicación y apoyo, no sanción inmediata.' },

    { id: 'rt24', tipo: 'escenario_clinico', subarea: 'limites_calidez',
      enunciado: 'La madre te pregunta si puedes ser la madrina del niño. Lo más adecuado es:',
      opciones: [
        { valor: 'A', etiqueta: 'Aceptar.' },
        { valor: 'B', etiqueta: 'Agradecer con calidez y explicar que el rol profesional impide aceptar, ya que protege el espacio terapéutico.' },
        { valor: 'C', etiqueta: 'Ignorar la pregunta.' },
        { valor: 'D', etiqueta: 'Enojarte.' },
      ],
      respuestaCorrecta: 'B',
      justificacion: 'Aceptar un rol familiar rompe el encuadre terapéutico y afecta la objetividad.' },

    { id: 'rt25', tipo: 'escenario_clinico', subarea: 'alianza_terapeutica',
      enunciado: 'Notas que el niño se está aburriendo en la sesión. Lo más adecuado es:',
      opciones: [
        { valor: 'A', etiqueta: 'Seguir el plan sin ajustar.' },
        { valor: 'B', etiqueta: 'Ajustar la actividad a su nivel de interés, incorporar elementos lúdicos y consultar su preferencia dentro de las metas.' },
        { valor: 'C', etiqueta: 'Regañarlo por no prestar atención.' },
        { valor: 'D', etiqueta: 'Terminar antes.' },
      ],
      respuestaCorrecta: 'B',
      justificacion: 'Ajustar la actividad mantiene la motivación y la alianza, sin perder el objetivo terapéutico.' },

    { id: 'rt26', tipo: 'escenario_clinico', subarea: 'empatia_escucha',
      enunciado: 'Un niño comparte un logro pequeño (ej. terminar una actividad). Lo más adecuado es:',
      opciones: [
        { valor: 'A', etiqueta: 'Ignorarlo.' },
        { valor: 'B', etiqueta: 'Reconocer el esfuerzo de forma específica y genuina, sin exagerar.' },
        { valor: 'C', etiqueta: 'Decir que pudo hacerlo mejor.' },
        { valor: 'D', etiqueta: 'Compararlo con otros.' },
      ],
      respuestaCorrecta: 'B',
      justificacion: 'El refuerzo social específico y honesto fortalece la autoeficacia y la alianza.' },

    { id: 'rt27', tipo: 'escenario_clinico', subarea: 'trabajo_familia',
      enunciado: 'Una familia expresa culpa por el diagnóstico de su hijo. Lo más adecuado es:',
      opciones: [
        { valor: 'A', etiqueta: 'Confirmar que fue su culpa.' },
        { valor: 'B', etiqueta: 'Psicoeducar sobre el TEA, desmitificar culpas, validar emociones y orientar hacia acción y apoyos.' },
        { valor: 'C', etiqueta: 'Cambiar de tema.' },
        { valor: 'D', etiqueta: 'Evitar hablar del diagnóstico.' },
      ],
      respuestaCorrecta: 'B',
      justificacion: 'La culpa es una reacción común. La psicoeducación compasiva reduce culpa y fortalece el vínculo.' },

    { id: 'rt28', tipo: 'escenario_clinico', subarea: 'colaboracion_interdisciplinaria',
      enunciado: 'Un neurólogo pide tu opinión sobre el plan. Lo profesional es:',
      opciones: [
        { valor: 'A', etiqueta: 'No responder.' },
        { valor: 'B', etiqueta: 'Responder con observaciones objetivas, con consentimiento de la familia y dentro de tu competencia.' },
        { valor: 'C', etiqueta: 'Compartir todo el expediente.' },
        { valor: 'D', etiqueta: 'Improvisar.' },
      ],
      respuestaCorrecta: 'B',
      justificacion: 'Colaboración interdisciplinaria con consentimiento y dentro del rol.' },

    { id: 'rt29', tipo: 'escenario_clinico', subarea: 'autocuidado_terapeuta',
      enunciado: 'Un caso te está removiendo emocionalmente por historias personales. Lo profesional es:',
      opciones: [
        { valor: 'A', etiqueta: 'Continuar sin hablarlo.' },
        { valor: 'B', etiqueta: 'Buscar supervisión y, si es necesario, terapia personal, evaluando si es momento de continuar el caso.' },
        { valor: 'C', etiqueta: 'Contarle al niño.' },
        { valor: 'D', etiqueta: 'Derivar sin explicar.' },
      ],
      respuestaCorrecta: 'B',
      justificacion: 'La ética exige monitorear el impacto personal y tomar medidas para no dañar al paciente.' },

    { id: 'rt30', tipo: 'escenario_clinico', subarea: 'alianza_terapeutica',
      enunciado: 'Al cierre de un proceso terapéutico con un niño, lo más adecuado es:',
      opciones: [
        { valor: 'A', etiqueta: 'Desaparecer sin despedida.' },
        { valor: 'B', etiqueta: 'Planear un cierre gradual, revisar logros con el niño y la familia, anticipar y ofrecer seguimiento si es necesario.' },
        { valor: 'C', etiqueta: 'Terminar de golpe.' },
        { valor: 'D', etiqueta: 'Alargar el proceso innecesariamente.' },
      ],
      respuestaCorrecta: 'B',
      justificacion: 'El cierre planificado consolida los logros y cuida la relación terapéutica.' },
  ],
};
