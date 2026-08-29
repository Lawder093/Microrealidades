export type Publication = {
  number: string;
  category: string;
  title: string;
  excerpt: string;
  date: string;
  color: "pink" | "blue" | "yellow";
};

export const publications: Publication[] = [
  {
    number: "01",
    category: "Notas de campo",
    title: "Lo cotidiano también piensa",
    excerpt: "Una primera aproximación a las escenas pequeñas donde se producen nuestras realidades.",
    date: "Próximamente",
    color: "pink",
  },
  {
    number: "02",
    category: "Conversaciones",
    title: "Acompañar no es resolver",
    excerpt: "Apuntes para construir relaciones de apoyo sin borrar la autonomía de quienes participan.",
    date: "Próximamente",
    color: "blue",
  },
  {
    number: "03",
    category: "Herramientas",
    title: "Preguntar antes de medir",
    excerpt: "Sobre las preguntas que abren procesos y las respuestas que una cifra no alcanza a contar.",
    date: "Próximamente",
    color: "yellow",
  },
];
