export type Project = {
  number: string;
  slug: string;
  href?: string;
  title: string;
  text: string;
  description: string;
  color: "pink" | "blue" | "yellow";
  status: string;
  area: string;
  visual?: "brain";
};

export const projects: Project[] = [
  {
    number: "01",
    slug: "acompanamiento-educativo-critico",
    title: "Acompañamiento Educativo Crítico",
    text: "Una propuesta para formar acompañantes y fortalecer comunidades educativas desde una mirada situada y no patologizante.",
    description: "Un espacio para pensar cómo acompañamos los procesos educativos, cuidando el contexto, los vínculos y las múltiples formas de aprender.",
    color: "pink",
    status: "En desarrollo",
    area: "Educación · Comunidad",
  },
  {
    number: "02",
    slug: "vidovic-01",
    title: "Vidovic 01",
    text: "Herramientas digitales para observar procesos psicológicos sin reducir a las personas a una puntuación.",
    description: "Un laboratorio de herramientas digitales para mirar procesos psicológicos con más matices, tiempo y conversación.",
    color: "blue",
    status: "En desarrollo",
    area: "Psicología · Tecnología",
  },
  {
    number: "03",
    slug: "escultismo-critico-popular",
    title: "Escultismo Crítico Popular",
    text: "Experiencias educativas comunitarias construidas desde los territorios y las realidades de América Latina.",
    description: "Experiencias para recuperar el juego, la organización y la vida al aire libre como prácticas de transformación colectiva.",
    color: "yellow",
    status: "En desarrollo",
    area: "Territorio · Organización",
  },
  {
    number: "04",
    slug: "super-bateria-01",
    href: "/evaluaciones-psicometricas",
    title: "Super batería 01",
    text: "Una matriz configurable para observar el perfil profesional de terapeutas durante procesos de reclutamiento.",
    description: "Una herramienta en construcción para reunir casos, conocimientos y escalas de trabajo en una experiencia protegida.",
    color: "pink",
    status: "En preparación",
    area: "Psicología · Evaluación",
  },
];

export const microrealidadesProject: Project = {
  number: "05",
  slug: "cerebro",
  href: "/proyectos/cerebro",
  title: "Microrealidades",
  text: "Una experiencia para observar el pensamiento en movimiento, entre anatomía, percepción y tecnología.",
  description: "Una experiencia visual para observar el pensamiento en movimiento desde una mirada humana, científica e introspectiva.",
  color: "blue",
  status: "Explorar",
  area: "Psicología · Experiencia",
  visual: "brain",
};

export const projectsForIndex: Project[] = [...projects, microrealidadesProject];

export function getProject(slug: string) {
  return projects.find((project) => project.slug === slug);
}
