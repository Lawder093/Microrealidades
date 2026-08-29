export type Project = {
  number: string;
  slug: string;
  title: string;
  text: string;
  description: string;
  color: "pink" | "blue" | "yellow";
  status: string;
  area: string;
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
];

export function getProject(slug: string) {
  return projects.find((project) => project.slug === slug);
}
