export type EvaluationDimension =
  | "personality"
  | "ethics"
  | "skills"
  | "therapeutic"
  | "judgment";

export type EvaluationItemType = "likert" | "case" | "knowledge";

export type EvaluationOption = {
  value: string;
  label: string;
  score: number;
};

export type EvaluationItem = {
  id: string;
  dimension: EvaluationDimension;
  type: EvaluationItemType;
  prompt: string;
  active: boolean;
  options?: EvaluationOption[];
};

export const evaluationDimensions: Array<{
  id: EvaluationDimension;
  label: string;
  shortLabel: string;
  description: string;
  color: "pink" | "blue" | "yellow";
}> = [
  {
    id: "personality",
    label: "Personalidad y estilo de trabajo",
    shortLabel: "Personalidad",
    description: "Autoconciencia, flexibilidad y organización del trabajo terapéutico.",
    color: "pink",
  },
  {
    id: "ethics",
    label: "Ética y profesionalismo",
    shortLabel: "Ética",
    description: "Límites, confidencialidad, consentimiento y responsabilidad profesional.",
    color: "blue",
  },
  {
    id: "skills",
    label: "Habilidades y conocimientos",
    shortLabel: "Habilidades",
    description: "Fundamentos, documentación, evaluación situada y uso responsable de herramientas.",
    color: "yellow",
  },
  {
    id: "therapeutic",
    label: "Relación terapéutica",
    shortLabel: "Relación",
    description: "Escucha, alianza, comunicación y capacidad de reparar una ruptura.",
    color: "pink",
  },
  {
    id: "judgment",
    label: "Juicio y razonamiento profesional",
    shortLabel: "Juicio",
    description: "Integración de información, incertidumbre, riesgo y supervisión.",
    color: "blue",
  },
];

export const defaultEvaluationItems: EvaluationItem[] = [
  {
    id: "personality-01",
    dimension: "personality",
    type: "likert",
    prompt: "Puedo reconocer cómo mis emociones influyen en la sesión y pedir una pausa o supervisión cuando la necesito.",
    active: true,
  },
  {
    id: "personality-02",
    dimension: "personality",
    type: "case",
    prompt: "Una sesión cambia de dirección y aparece un tema que no estaba previsto. ¿Qué respuesta describe mejor tu forma de trabajar?",
    active: true,
    options: [
      { value: "p02-a", label: "Regreso al plan inicial aunque el tema sea relevante.", score: 2 },
      { value: "p02-b", label: "Exploro el cambio, aclaro prioridades y acuerdamos cómo continuar.", score: 5 },
      { value: "p02-c", label: "Cambio de tema sin explicarlo para aprovechar el tiempo.", score: 1 },
      { value: "p02-d", label: "Cierro la sesión y dejo la decisión para otra ocasión.", score: 3 },
    ],
  },
  {
    id: "personality-03",
    dimension: "personality",
    type: "likert",
    prompt: "Puedo sostener un proceso ordenado sin perder sensibilidad ante el contexto y el ritmo de la persona.",
    active: true,
  },
  {
    id: "ethics-01",
    dimension: "ethics",
    type: "likert",
    prompt: "Explico los límites de la confidencialidad y los reviso cuando cambian las circunstancias del acompañamiento.",
    active: true,
  },
  {
    id: "ethics-02",
    dimension: "ethics",
    type: "case",
    prompt: "Una persona atendida te invita a participar en un proyecto personal fuera del espacio terapéutico. ¿Qué haces primero?",
    active: true,
    options: [
      { value: "e02-a", label: "Acepto para fortalecer el vínculo.", score: 1 },
      { value: "e02-b", label: "Reviso el posible conflicto, los límites y lo converso de forma transparente.", score: 5 },
      { value: "e02-c", label: "Rechazo sin explicarlo para evitar incomodidad.", score: 3 },
      { value: "e02-d", label: "Consulto el caso con una persona supervisora antes de responder.", score: 4 },
    ],
  },
  {
    id: "ethics-03",
    dimension: "ethics",
    type: "knowledge",
    prompt: "¿Qué debe ocurrir antes de iniciar una intervención profesional?",
    active: true,
    options: [
      { value: "e03-a", label: "Definir objetivos sin necesidad de hablar de límites.", score: 2 },
      { value: "e03-b", label: "Acordar alcance, consentimiento, límites y condiciones del servicio.", score: 5 },
      { value: "e03-c", label: "Solicitar únicamente datos de contacto.", score: 1 },
      { value: "e03-d", label: "Esperar a que aparezca un problema para explicarlo.", score: 1 },
    ],
  },
  {
    id: "skills-01",
    dimension: "skills",
    type: "knowledge",
    prompt: "¿Cuál es una diferencia importante entre un instrumento de tamizaje y un diagnóstico clínico?",
    active: true,
    options: [
      { value: "s01-a", label: "El tamizaje orienta una exploración; no confirma por sí solo un diagnóstico.", score: 5 },
      { value: "s01-b", label: "Son equivalentes si se aplican en línea.", score: 1 },
      { value: "s01-c", label: "El diagnóstico no necesita contexto ni entrevista.", score: 1 },
      { value: "s01-d", label: "El tamizaje sustituye la conversación profesional.", score: 1 },
    ],
  },
  {
    id: "skills-02",
    dimension: "skills",
    type: "likert",
    prompt: "Puedo documentar observaciones y acuerdos distinguiendo hechos, hipótesis profesionales y decisiones tomadas.",
    active: true,
  },
  {
    id: "skills-03",
    dimension: "skills",
    type: "case",
    prompt: "Una herramienta digital produce un resultado llamativo, pero no coincide con la conversación. ¿Cómo lo incorporas?",
    active: true,
    options: [
      { value: "s03-a", label: "Tomo el resultado como la evidencia principal.", score: 1 },
      { value: "s03-b", label: "Lo considero una señal para explorar, no como una conclusión independiente.", score: 5 },
      { value: "s03-c", label: "Descarto la herramienta y no registro la discrepancia.", score: 2 },
      { value: "s03-d", label: "Comparto el resultado sin explicar sus límites.", score: 1 },
    ],
  },
  {
    id: "therapeutic-01",
    dimension: "therapeutic",
    type: "likert",
    prompt: "Puedo escuchar una experiencia difícil sin apresurarme a corregir, interpretar o dar soluciones.",
    active: true,
  },
  {
    id: "therapeutic-02",
    dimension: "therapeutic",
    type: "case",
    prompt: "La persona expresa que no se sintió escuchada en la sesión anterior. ¿Qué haces?",
    active: true,
    options: [
      { value: "t02-a", label: "Explico por qué mi intervención era adecuada.", score: 1 },
      { value: "t02-b", label: "Agradezco que lo diga, exploro la experiencia y reparo el acuerdo de trabajo.", score: 5 },
      { value: "t02-c", label: "Cambio de tema para no aumentar la tensión.", score: 2 },
      { value: "t02-d", label: "Concluyo que la alianza no es posible.", score: 1 },
    ],
  },
  {
    id: "therapeutic-03",
    dimension: "therapeutic",
    type: "knowledge",
    prompt: "¿Qué ayuda a construir una alianza terapéutica revisable?",
    active: true,
    options: [
      { value: "t03-a", label: "Mantener objetivos y roles claros, y revisarlos con la persona.", score: 5 },
      { value: "t03-b", label: "Evitar hablar de expectativas para no influir.", score: 2 },
      { value: "t03-c", label: "Usar el mismo estilo con todas las personas.", score: 1 },
      { value: "t03-d", label: "Dejar toda la responsabilidad del proceso en la persona atendida.", score: 1 },
    ],
  },
  {
    id: "judgment-01",
    dimension: "judgment",
    type: "likert",
    prompt: "Cuando la información es incompleta, puedo explicitar qué sé, qué desconozco y qué necesito explorar antes de decidir.",
    active: true,
  },
  {
    id: "judgment-02",
    dimension: "judgment",
    type: "case",
    prompt: "Aparece una señal que podría indicar riesgo, pero no tienes suficiente información. ¿Cuál es el siguiente paso más responsable?",
    active: true,
    options: [
      { value: "j02-a", label: "No la considero hasta tener certeza.", score: 1 },
      { value: "j02-b", label: "Exploro directamente, documento la incertidumbre y consulto el protocolo o supervisión pertinente.", score: 5 },
      { value: "j02-c", label: "Informo a otras personas sin conversar primero con quien atiendo.", score: 1 },
      { value: "j02-d", label: "Cierro el proceso para evitar responsabilidad.", score: 2 },
    ],
  },
  {
    id: "judgment-03",
    dimension: "judgment",
    type: "knowledge",
    prompt: "¿Qué caracteriza una decisión profesional razonada?",
    active: true,
    options: [
      { value: "j03-a", label: "Se apoya en una sola señal para ser rápida.", score: 1 },
      { value: "j03-b", label: "Integra contexto, evidencia disponible, límites y revisión posterior.", score: 5 },
      { value: "j03-c", label: "Evita registrar el razonamiento para proteger la relación.", score: 1 },
      { value: "j03-d", label: "Sigue una regla idéntica sin atender diferencias de contexto.", score: 2 },
    ],
  },
];

export const likertLabels = [
  "1 · Nunca / no me describe",
  "2 · Rara vez",
  "3 · A veces",
  "4 · Frecuentemente",
  "5 · Siempre / me describe",
];

export function getDimension(id: EvaluationDimension) {
  return evaluationDimensions.find((dimension) => dimension.id === id) ?? evaluationDimensions[0];
}
