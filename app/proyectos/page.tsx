import { ProjectCard } from "@/components/project-card";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { projects } from "@/lib/projects";

export const metadata = {
  title: "Proyectos — Microrealidades",
  description: "Proyectos de psicología, tecnología y comunalidad en desarrollo.",
};

export default function ProjectsPage() {
  return (
    <main className="inner-page projects-page">
      <SiteHeader compact />
      <section className="page-intro" aria-labelledby="projects-page-title">
        <p className="section-label">[ 01 ] &nbsp; Proyectos</p>
        <h1 id="projects-page-title">Ideas que toman<br /><em>posición.</em></h1>
        <p>Procesos abiertos para observar lo que habitamos, ensayar otras preguntas y construir herramientas con otras personas.</p>
      </section>
      <section className="project-grid-section" aria-label="Proyectos en desarrollo">
        <div className="project-grid">
          {projects.map((project) => <ProjectCard key={project.slug} project={project} variant="grid" />)}
        </div>
      </section>
      <SiteFooter />
    </main>
  );
}
