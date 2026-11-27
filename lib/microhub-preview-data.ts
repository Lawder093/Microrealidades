// Datos exclusivos de la demostración pública. No forman parte del catálogo real de pruebas.
export type PreviewAreaId =
  | "tests"
  | "talento"
  | "laboratorio"
  | "proximo-1"
  | "proximo-2";
export type PreviewTool = { id: string; label: string };
export type PreviewArea = {
  id: PreviewAreaId;
  label: string;
  description: string;
  tools: PreviewTool[];
};

export const previewAreas: PreviewArea[] = [
  {
    id: "tests",
    label: "Tests",
    description: "Conoce el recorrido de una evaluación.",
    tools: [
      { id: "sample", label: "Ejercicio de muestra" },
      { id: "library", label: "Explorar pruebas" },
      { id: "results", label: "Ver resultados" },
    ],
  },
  {
    id: "talento",
    label: "Talento",
    description: "Organiza una aplicación de principio a fin.",
    tools: [
      { id: "battery", label: "Preparar batería" },
      { id: "invitation", label: "Invitación" },
      { id: "reports", label: "Seguimiento" },
    ],
  },
  {
    id: "laboratorio",
    label: "Laboratorio",
    description: "Un espacio para conectar y desarrollar ideas.",
    tools: [
      { id: "map", label: "Mapa de ideas" },
      { id: "notes", label: "Notas" },
      { id: "export", label: "Exportar muestra" },
    ],
  },
  {
    id: "proximo-1",
    label: "Próximo 01",
    description: "Un lugar reservado para una nueva área.",
    tools: [{ id: "overview", label: "Vista previa" }],
  },
  {
    id: "proximo-2",
    label: "Próximo 02",
    description: "Otro espacio para lo que viene.",
    tools: [{ id: "overview", label: "Vista previa" }],
  },
];

export const previewQuestions = [
  "Antes de comenzar una tarea, me ayuda definir pasos claros.",
  "Si cambian las prioridades, reviso mi plan de trabajo.",
  "Me resulta útil conversar con el equipo para resolver dudas.",
  "Al terminar un proyecto, hago una pausa para revisar lo aprendido.",
];

export const previewTests = [
  "Personalidad y estilo de trabajo",
  "Ética y profesionalismo",
  "Relación terapéutica",
  "Habilidades y conocimientos",
];
export const previewScores = [
  { name: "Organización", value: 76 },
  { name: "Colaboración", value: 84 },
  { name: "Adaptabilidad", value: 68 },
  { name: "Reflexión", value: 72 },
];
export const previewConcepts = [
  {
    name: "Psicología",
    text: "Poner atención a las experiencias y las formas de comprenderlas.",
  },
  {
    name: "Tecnología",
    text: "Crear herramientas que acompañen el trabajo y abran posibilidades.",
  },
  {
    name: "Comunalidad",
    text: "Pensar con otras personas y reconocer lo que construimos en común.",
  },
];
