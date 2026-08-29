import Link from "next/link";
import { notFound } from "next/navigation";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { getProject, projects } from "@/lib/projects";

export function generateStaticParams() {
  return projects.map((project) => ({ slug: project.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const project = getProject(slug);
  return project
    ? { title: `${project.title} — Microrealidades`, description: project.text }
    : { title: "Proyecto — Microrealidades" };
}

export default async function ProjectPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const project = getProject(slug);
  if (!project) notFound();

  return (
    <main className={`inner-page project-detail-page ${project.color}`}>
      <SiteHeader compact />
      <article className="project-detail">
        <Link className="back-link" href="/proyectos">↖ Volver a proyectos</Link>
        <div className="detail-kicker"><span>{project.number}</span><span>{project.area}</span></div>
        <h1>{project.title}</h1>
        <div className="detail-columns">
          <p className="detail-lead">{project.text}</p>
          <div>
            <p>{project.description}</p>
            <span className="status">{project.status}</span>
          </div>
        </div>
      </article>
      <SiteFooter />
    </main>
  );
}
