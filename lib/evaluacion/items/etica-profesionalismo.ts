/**
 * Banco clínico infantil integrado a Super batería 01.
 *
 * NOTA METODOLÓGICA: reactivos originales inspirados en constructos teóricos;
 * no reproducen instrumentos licenciados ni constituyen diagnóstico o baremo.
 */
import { Prueba } from '@/types/evaluacion';

export const ETICA_PROFESIONALISMO: Prueba = {
  id: 'etica_profesionalismo',
  nombre: 'Ética y Profesionalismo',
  tipo: 'juicio_etico',
  instrucciones:
    'A continuación se presentan situaciones profesionales. Elija la respuesta que represente la MEJOR conducta ética según los códigos profesionales de psicología. Solo una respuesta es la más adecuada.',
  subareas: [
    'confidencialidad',
    'consentimiento_informado',
    'limites_profesionales',
    'competencia_profesional',
    'documentacion',
    'reportes_obligatorios',
    'conflictos_interes',
    'diversidad_cultural',
  ],
  items: [
    { id: 'et01', tipo: 'escenario_clinico', subarea: 'confidencialidad',
      enunciado: 'Una madre te pregunta por el diagnóstico de otro niño que también atiendes. ¿Qué haces?',
      opciones: [
        { valor: 'A', etiqueta: 'Le compartes el diagnóstico porque ella es del mismo círculo social.' },
        { valor: 'B', etiqueta: 'Le dices que no puedes hablar de otros pacientes y cambias de tema.' },
        { valor: 'C', etiqueta: 'Le compartes solo lo "básico" para no incomodarla.' },
        { valor: 'D', etiqueta: 'Le pides discreción y le compartes detalles generales.' },
      ],
      respuestaCorrecta: 'B',
      justificacion: 'La confidencialidad es absoluta salvo excepciones legales específicas. No se comparte información con terceros ni con otros padres.' },

    { id: 'et02', tipo: 'escenario_clinico', subarea: 'consentimiento_informado',
      enunciado: 'Antes de iniciar un plan de intervención ABA con un niño, el paso ético obligatorio es:',
      opciones: [
        { valor: 'A', etiqueta: 'Comenzar sesiones y pedir la firma al final del primer mes.' },
        { valor: 'B', etiqueta: 'Informar a los padres en lenguaje claro, explicar el plan, riesgos, alternativas y obtener consentimiento por escrito.' },
        { valor: 'C', etiqueta: 'Enviar el plan por correo sin esperar respuesta.' },
        { valor: 'D', etiqueta: 'Obtener solo un consentimiento verbal.' },
      ],
      respuestaCorrecta: 'B',
      justificacion: 'El consentimiento informado es un proceso escrito, comprensible, con explicación de riesgos, beneficios y alternativas.' },

    { id: 'et03', tipo: 'escenario_clinico', subarea: 'reportes_obligatorios',
      enunciado: 'Durante una sesión detectas signos de maltrato físico en un niño. Debes:',
      opciones: [
        { valor: 'A', etiqueta: 'Investigar por tu cuenta antes de reportar.' },
        { valor: 'B', etiqueta: 'Reportar a las autoridades competentes (trabajo social, fiscalía, DIF) sin avisar a los padres, y documentar.' },
        { valor: 'C', etiqueta: 'Avisar a los padres para que expliquen antes de reportar.' },
        { valor: 'D', etiqueta: 'Esperar la próxima sesión para confirmar.' },
      ],
      respuestaCorrecta: 'B',
      justificacion: 'La sospecha razonable de maltrato obliga a reportar a autoridades sin investigar por cuenta propia ni anticipar aviso a posibles agresores.' },

    { id: 'et04', tipo: 'escenario_clinico', subarea: 'limites_profesionales',
      enunciado: 'Una madre agradecida te quiere regalar un reloj costoso al cierre del trimestre. La conducta ética es:',
      opciones: [
        { valor: 'A', etiqueta: 'Aceptarlo porque es muestra de gratitud.' },
        { valor: 'B', etiqueta: 'Rechazarlo amablemente y explicar que el código profesional no permite regalos de valor significativo.' },
        { valor: 'C', etiqueta: 'Aceptarlo y compartirlo con el equipo.' },
        { valor: 'D', etiqueta: 'Aceptarlo pero registrarlo.' },
      ],
      respuestaCorrecta: 'B',
      justificacion: 'Los regalos de valor significativo comprometen la relación y son una falta ética. Se rechazan con calidez.' },

    { id: 'et05', tipo: 'escenario_clinico', subarea: 'competencia_profesional',
      enunciado: 'Te asignan un caso de un niño con TEA y otro diagnóstico complejo que no dominas. La conducta correcta es:',
      opciones: [
        { valor: 'A', etiqueta: 'Aceptarlo para no perder el cliente.' },
        { valor: 'B', etiqueta: 'Aceptarlo y aprender sobre la marcha.' },
        { valor: 'C', etiqueta: 'Reconocer tu límite de competencia, buscar supervisión y, si es necesario, derivar a un especialista.' },
        { valor: 'D', etiqueta: 'Rechazarlo sin dar explicaciones.' },
      ],
      respuestaCorrecta: 'C',
      justificacion: 'Actuar fuera del límite de competencia es una falta ética. Se debe supervisar o derivar.' },

    { id: 'et06', tipo: 'escenario_clinico', subarea: 'documentacion',
      enunciado: 'Olvidaste registrar una sesión. Lo correcto es:',
      opciones: [
        { valor: 'A', etiqueta: 'Inventar notas aproximadas como si fuera registro contemporáneo.' },
        { valor: 'B', etiqueta: 'Dejar la sesión sin registro.' },
        { valor: 'C', etiqueta: 'Registrar la nota con la leyenda "nota tardía" y fecha real del registro.' },
        { valor: 'D', etiqueta: 'Pedirle a un colega que la redacte.' },
      ],
      respuestaCorrecta: 'C',
      justificacion: 'Se permite nota tardía siempre que se identifique como tal; falsificar registros es una falta grave.' },

    { id: 'et07', tipo: 'escenario_clinico', subarea: 'conflictos_interes',
      enunciado: 'Una empresa te ofrece comisión por cada familia que derives a su centro. Lo correcto es:',
      opciones: [
        { valor: 'A', etiqueta: 'Aceptar porque beneficia al paciente.' },
        { valor: 'B', etiqueta: 'Aceptar solo si el centro es de calidad.' },
        { valor: 'C', etiqueta: 'Rechazar la comisión y derivar solo por criterio clínico.' },
        { valor: 'D', etiqueta: 'Aceptar y no mencionarlo a la familia.' },
      ],
      respuestaCorrecta: 'C',
      justificacion: 'Recibir comisiones por derivación es conflicto de interés. La derivación debe ser exclusivamente por criterio clínico.' },

    { id: 'et08', tipo: 'escenario_clinico', subarea: 'limites_profesionales',
      enunciado: 'Un padre te agrega a redes sociales personales. Lo correcto es:',
      opciones: [
        { valor: 'A', etiqueta: 'Aceptar la solicitud porque es un padre amable.' },
        { valor: 'B', etiqueta: 'Rechazar y explicar que la relación es profesional y no se mezcla con redes personales.' },
        { valor: 'C', etiqueta: 'Aceptar con la condición de no interactuar.' },
        { valor: 'D', etiqueta: 'Aceptar y compartir contenido profesional.' },
      ],
      respuestaCorrecta: 'B',
      justificacion: 'Las redes personales diluyen límites y exponen información. Se rechaza con calidez explicando el motivo.' },

    { id: 'et09', tipo: 'escenario_clinico', subarea: 'confidencialidad',
      enunciado: 'Un juez solicita tu expediente clínico de un menor por un caso de custodia. Debes:',
      opciones: [
        { valor: 'A', etiqueta: 'Enviarlo directamente porque es autoridad.' },
        { valor: 'B', etiqueta: 'Verificar la orden judicial, informar a los tutores legales y entregar solo lo estrictamente solicitado, con registro.' },
        { valor: 'C', etiqueta: 'Negarte sin explicación.' },
        { valor: 'D', etiqueta: 'Enviarlo sin avisar a los tutores.' },
      ],
      respuestaCorrecta: 'B',
      justificacion: 'Se debe validar la orden judicial, notificar a tutores y entregar solo lo estrictamente requerido, documentando.' },

    { id: 'et10', tipo: 'escenario_clinico', subarea: 'diversidad_cultural',
      enunciado: 'Una familia de origen indígena tiene prácticas de crianza distintas a las tuyas. La conducta ética es:',
      opciones: [
        { valor: 'A', etiqueta: 'Corregirlas porque no son "lo esperado".' },
        { valor: 'B', etiqueta: 'Ignorar el tema cultural.' },
        { valor: 'C', etiqueta: 'Explorar con respeto las prácticas, distinguir lo funcional de lo que interfiere con el desarrollo y colaborar sin imponer.' },
        { valor: 'D', etiqueta: 'Derivar a otra familia.' },
      ],
      respuestaCorrecta: 'C',
      justificacion: 'La competencia cultural implica explorar, respetar y colaborar. Imponer es una falta ética.' },

    { id: 'et11', tipo: 'escenario_clinico', subarea: 'consentimiento_informado',
      enunciado: 'El niño tiene 15 años y expresa que no quiere continuar terapia, pero los padres insisten. Debes:',
      opciones: [
        { valor: 'A', etiqueta: 'Continuar porque los padres pagan.' },
        { valor: 'B', etiqueta: 'Terminar unilateralmente.' },
        { valor: 'C', etiqueta: 'Escuchar el asentimiento del adolescente, trabajar con la familia y, si el rechazo persiste, valorar derivación o cierre con seguimiento.' },
        { valor: 'D', etiqueta: 'Convencerlo sin escucharlo.' },
      ],
      respuestaCorrecta: 'C',
      justificacion: 'El asentimiento del menor es un principio ético. Se debe integrar su voz y no ignorar su rechazo sostenido.' },

    { id: 'et12', tipo: 'escenario_clinico', subarea: 'limites_profesionales',
      enunciado: 'Una madre te pide que la lleves a su casa en tu auto porque no tiene transporte. Lo correcto es:',
      opciones: [
        { valor: 'A', etiqueta: 'Aceptar porque es una emergencia.' },
        { valor: 'B', etiqueta: 'Rechazar con calidez y ofrecer recursos de transporte o apoyo institucional.' },
        { valor: 'C', etiqueta: 'Aceptar pero no decirlo a nadie.' },
        { valor: 'D', etiqueta: 'Pedirle dinero para la gasolina.' },
      ],
      respuestaCorrecta: 'B',
      justificacion: 'El traslado mezcla límites personales y profesionales. Se rechaza y se ofrecen alternativas.' },

    { id: 'et13', tipo: 'escenario_clinico', subarea: 'documentacion',
      enunciado: 'En tu registro de sesión debes incluir:',
      opciones: [
        { valor: 'A', etiqueta: 'Solo lo que salió bien.' },
        { valor: 'B', etiqueta: 'Objetivos, actividades, respuesta del niño, observaciones relevantes, próxima sesión e incidentes.' },
        { valor: 'C', etiqueta: 'Solo lo negativo.' },
        { valor: 'D', etiqueta: 'Tu opinión personal sobre la familia.' },
      ],
      respuestaCorrecta: 'B',
      justificacion: 'El expediente debe ser objetivo, completo y útil para continuidad del tratamiento y supervisión.' },

    { id: 'et14', tipo: 'escenario_clinico', subarea: 'competencia_profesional',
      enunciado: 'Un padre te pide un diagnóstico de autismo para trámite escolar y tú no estás certificado para diagnosticar. Lo correcto es:',
      opciones: [
        { valor: 'A', etiqueta: 'Firmarlo para agilizar el trámite.' },
        { valor: 'B', etiqueta: 'Firmarlo con reservas.' },
        { valor: 'C', etiqueta: 'Explicar que el diagnóstico requiere evaluación específica y derivar a profesional calificado.' },
        { valor: 'D', etiqueta: 'Recomendar al padre que lo haga solo.' },
      ],
      respuestaCorrecta: 'C',
      justificacion: 'Emitir un diagnóstico fuera de competencia es una falta ética grave. Se deriva.' },

    { id: 'et15', tipo: 'escenario_clinico', subarea: 'conflictos_interes',
      enunciado: 'Un amigo cercano te pide terapia para su hijo con TEA. Lo ético es:',
      opciones: [
        { valor: 'A', etiqueta: 'Aceptar porque lo conoces y entiendes mejor el caso.' },
        { valor: 'B', etiqueta: 'Aceptar con descuento.' },
        { valor: 'C', etiqueta: 'Derivar a otro profesional por conflicto de interés y mantener la amistad.' },
        { valor: 'D', etiqueta: 'Aceptar y no documentarlo.' },
      ],
      respuestaCorrecta: 'C',
      justificacion: 'La doble relación (amigo/paciente) compromete la objetividad y debe evitarse. Se deriva con calidez.' },

    { id: 'et16', tipo: 'escenario_clinico', subarea: 'reportes_obligatorios',
      enunciado: 'Un niño te cuenta que es víctima de acoso escolar severo con lesiones. Debes:',
      opciones: [
        { valor: 'A', etiqueta: 'Guardar el secreto por confidencialidad.' },
        { valor: 'B', etiqueta: 'Informar a los padres y a la escuela, documentar y activar protocolo de protección.' },
        { valor: 'C', etiqueta: 'Esperar a que el niño decida.' },
        { valor: 'D', etiqueta: 'Llamar al acosador.' },
      ],
      respuestaCorrecta: 'B',
      justificacion: 'Ante riesgo de daño hay deber de protección. Se informa a padres/escuela y se documenta.' },

    { id: 'et17', tipo: 'escenario_clinico', subarea: 'confidencialidad',
      enunciado: 'Quieres publicar un caso para difusión profesional. Lo ético es:',
      opciones: [
        { valor: 'A', etiqueta: 'Publicar nombre y foto porque es educativo.' },
        { valor: 'B', etiqueta: 'Publicar con nombre cambiado pero detalles que hagan identificable al niño.' },
        { valor: 'C', etiqueta: 'Anonimizar de forma que sea imposible identificar al menor y obtener consentimiento escrito de tutores si hay imágenes o datos sensibles.' },
        { valor: 'D', etiqueta: 'Publicar solo el primer nombre.' },
      ],
      respuestaCorrecta: 'C',
      justificacion: 'La anonimización efectiva y el consentimiento son requisitos en publicación de casos con menores.' },

    { id: 'et18', tipo: 'escenario_clinico', subarea: 'diversidad_cultural',
      enunciado: 'Una familia habla solo lengua indígena y tú no la hablas. La conducta ética es:',
      opciones: [
        { valor: 'A', etiqueta: 'Continuar en español porque es obligación de ellos aprenderlo.' },
        { valor: 'B', etiqueta: 'Suspender el tratamiento.' },
        { valor: 'C', etiqueta: 'Gestionar intérprete calificado, usar apoyos visuales y adaptar la comunicación para garantizar comprensión.' },
        { valor: 'D', etiqueta: 'Pedir al niño que traduzca.' },
      ],
      respuestaCorrecta: 'C',
      justificacion: 'Garantizar comprensión es obligación ética. El niño NUNCA debe usarse como intérprete de temas sensibles.' },

    { id: 'et19', tipo: 'escenario_clinico', subarea: 'competencia_profesional',
      enunciado: 'No tienes experiencia en análisis funcional de conducta y tu supervisor está de vacaciones. Ante una nueva conducta problemática debes:',
      opciones: [
        { valor: 'A', etiqueta: 'Aplicar castigo para frenar la conducta.' },
        { valor: 'B', etiqueta: 'Documentar la conducta, mantener intervenciones ya autorizadas y esperar supervisión para modificar el plan.' },
        { valor: 'C', etiqueta: 'Improvisar un plan nuevo.' },
        { valor: 'D', etiqueta: 'Ignorar la conducta hasta que regrese.' },
      ],
      respuestaCorrecta: 'B',
      justificacion: 'No modificar el plan sin supervisión cuando está fuera de competencia es lo profesional.' },

    { id: 'et20', tipo: 'escenario_clinico', subarea: 'limites_profesionales',
      enunciado: 'Un niño te abraza de forma prolongada y te dice "te quiero". Lo correcto es:',
      opciones: [
        { valor: 'A', etiqueta: 'Ignorarlo.' },
        { valor: 'B', etiqueta: 'Recibir el afecto con calidez breve, redirigir a la actividad y registrar si se repite.' },
        { valor: 'C', etiqueta: 'Decirle que está mal quererte.' },
        { valor: 'D', etiqueta: 'Fomentar el afecto físico como refuerzo.' },
      ],
      respuestaCorrecta: 'B',
      justificacion: 'Se recibe el afecto del menor con calidez y límites claros, sin reforzar contacto físico ni rechazar de forma brusca.' },

    { id: 'et21', tipo: 'escenario_clinico', subarea: 'confidencialidad',
      enunciado: 'Estás en una reunión de padres y mencionas por error un caso. Lo ético es:',
      opciones: [
        { valor: 'A', etiqueta: 'Continuar y minimizar.' },
        { valor: 'B', etiqueta: 'Detener la conversación, no profundizar y ofrecer disculpa formal por escrito al equipo correspondiente.' },
        { valor: 'C', etiqueta: 'Culpar a otro.' },
        { valor: 'D', etiqueta: 'No hacer nada.' },
      ],
      respuestaCorrecta: 'B',
      justificacion: 'Ante una brecha de confidencialidad, se detiene, se documenta y se toman medidas de contención y reparación.' },

    { id: 'et22', tipo: 'escenario_clinico', subarea: 'documentacion',
      enunciado: 'Otro profesional de la salud te pide tu expediente de un paciente para continuar tratamiento. Lo ético es:',
      opciones: [
        { valor: 'A', etiqueta: 'Compartir todo por correo abierto.' },
        { valor: 'B', etiqueta: 'Obtener consentimiento de tutores, compartir lo necesario por canal seguro y documentar la transferencia.' },
        { valor: 'C', etiqueta: 'Negarse siempre.' },
        { valor: 'D', etiqueta: 'Compartir solo por WhatsApp.' },
      ],
      respuestaCorrecta: 'B',
      justificacion: 'La transferencia de expediente requiere consentimiento, canal seguro y registro. Nunca por canales informales.' },

    { id: 'et23', tipo: 'escenario_clinico', subarea: 'consentimiento_informado',
      enunciado: 'Un padre se niega a firmar el plan de intervención pero pide que su hijo reciba sesiones "de apoyo". Debes:',
      opciones: [
        { valor: 'A', etiqueta: 'Iniciar sesiones sin plan firmado.' },
        { valor: 'B', etiqueta: 'Explicar el plan nuevamente, ofrecer alternativas y, si continúa la negativa, no iniciar intervención estructurada hasta tener consentimiento.' },
        { valor: 'C', etiqueta: 'Firmar tú por él.' },
        { valor: 'D', etiqueta: 'Llamar a las autoridades.' },
      ],
      respuestaCorrecta: 'B',
      justificacion: 'Sin consentimiento informado escrito no se inicia intervención. Se dialoga y se ofrecen alternativas válidas.' },

    { id: 'et24', tipo: 'escenario_clinico', subarea: 'competencia_profesional',
      enunciado: 'Un colega te comparte un método de intervención sin evidencia científica que "le ha funcionado". Lo correcto es:',
      opciones: [
        { valor: 'A', etiqueta: 'Aplicarlo de inmediato.' },
        { valor: 'B', etiqueta: 'Aplicarlo solo con algunos pacientes.' },
        { valor: 'C', etiqueta: 'No aplicarlo sin evidencia suficiente y consultar literatura y supervisión antes de considerarlo.' },
        { valor: 'D', etiqueta: 'Recomendarlo a las familias.' },
      ],
      respuestaCorrecta: 'C',
      justificacion: 'La práctica basada en evidencia exige sustento científico. Métodos sin evidencia no se aplican.' },

    { id: 'et25', tipo: 'escenario_clinico', subarea: 'diversidad_cultural',
      enunciado: 'Los padres de un niño con TEA deciden no decirle a su familia extendida que tiene autismo. Lo correcto es:',
      opciones: [
        { valor: 'A', etiqueta: 'Contradecirlos en la reunión familiar.' },
        { valor: 'B', etiqueta: 'Respetar su decisión, explorar el motivo y trabajar el tema del estigma sin imponer.' },
        { valor: 'C', etiqueta: 'Publicar información para "normalizar".' },
        { valor: 'D', etiqueta: 'Ignorar la decisión.' },
      ],
      respuestaCorrecta: 'B',
      justificacion: 'La autonomía familiar y el estigma cultural se abordan con respeto. No se decide por ellos.' },

    { id: 'et26', tipo: 'escenario_clinico', subarea: 'limites_profesionales',
      enunciado: 'Una madre te llama a las 11 pm para contarte un problema familiar. Lo correcto es:',
      opciones: [
        { valor: 'A', etiqueta: 'Escuchar toda la conversación.' },
        { valor: 'B', etiqueta: 'Responder brevemente, establecer horario de contacto y agendar sesión de orientación familiar.' },
        { valor: 'C', etiqueta: 'No contestar nunca.' },
        { valor: 'D', etiqueta: 'Bloquear el número.' },
      ],
      respuestaCorrecta: 'B',
      justificacion: 'Los límites de disponibilidad protegen al terapeuta y a la familia. Se agendan espacios formales para el tema.' },

    { id: 'et27', tipo: 'escenario_clinico', subarea: 'reportes_obligatorios',
      enunciado: 'Un niño te dice que su padre lo golpeó "por portarse mal". Debes:',
      opciones: [
        { valor: 'A', etiqueta: 'Guardar el secreto.' },
        { valor: 'B', etiqueta: 'Minimizar porque el padre estaba educando.' },
        { valor: 'C', etiqueta: 'Documentar, valorar riesgo, reportar a autoridad competente si hay sospecha razonable y activar protocolo interno.' },
        { valor: 'D', etiqueta: 'Llamar al padre en la sesión frente al niño.' },
      ],
      respuestaCorrecta: 'C',
      justificacion: 'El castigo físico en menores es maltrato y de reporte obligatorio. Se documenta y activa protocolo.' },

    { id: 'et28', tipo: 'escenario_clinico', subarea: 'conflictos_interes',
      enunciado: 'Eres terapeuta de un niño y su madre te pide trabajar también para su empresa en recursos humanos. Lo correcto es:',
      opciones: [
        { valor: 'A', etiqueta: 'Aceptar porque es otra relación.' },
        { valor: 'B', etiqueta: 'Aceptar solo si no afecta la terapia.' },
        { valor: 'C', etiqueta: 'Rechazar por conflicto de rol y explicar por qué.' },
        { valor: 'D', etiqueta: 'Aceptar y no mencionar el doble rol.' },
      ],
      respuestaCorrecta: 'C',
      justificacion: 'El doble rol con un familiar de paciente compromete la objetividad y confunde límites. Se rechaza con claridad.' },

    { id: 'et29', tipo: 'escenario_clinico', subarea: 'documentacion',
      enunciado: 'Recibes una solicitud del seguro del paciente para cubrir el tratamiento. Lo correcto es:',
      opciones: [
        { valor: 'A', etiqueta: 'Enviar todo el expediente.' },
        { valor: 'B', etiqueta: 'Enviar solo la información autorizada con consentimiento del tutor y en formato que proteja la privacidad.' },
        { valor: 'C', etiqueta: 'No enviar nada.' },
        { valor: 'D', etiqueta: 'Enviar por mensajería informal.' },
      ],
      respuestaCorrecta: 'B',
      justificacion: 'Se comparte solo lo autorizado, con consentimiento y por canal seguro. El expediente completo no se comparte.' },

    { id: 'et30', tipo: 'escenario_clinico', subarea: 'competencia_profesional',
      enunciado: 'Llevas varios meses con un paciente sin avances claros. Lo profesional es:',
      opciones: [
        { valor: 'A', etiqueta: 'Continuar igual porque el padre insiste.' },
        { valor: 'B', etiqueta: 'Aumentar intensidad sin evaluar.' },
        { valor: 'C', etiqueta: 'Revisar el plan con supervisión, evaluar si es necesario derivar o ajustar intervención, y comunicarlo con transparencia a la familia.' },
        { valor: 'D', etiqueta: 'Culpar al paciente.' },
      ],
      respuestaCorrecta: 'C',
      justificacion: 'La falta de avance exige revisión del plan y transparencia con la familia. La derivación es parte de la buena práctica.' },
  ],
};
