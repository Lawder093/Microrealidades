import Link from "next/link";
import type { Project } from "@/lib/projects";

export function ProjectCard({ project, variant = "list" }: { project: Project; variant?: "list" | "grid" }) {
  return (
    <Link className={`project-card ${project.color} project-card-${variant}`} href={`/proyectos/${project.slug}`}>
      <span className="project-number">{project.number}</span>
      <div>
        <h3>{project.title}</h3>
        <p>{project.text}</p>
      </div>
      <span className="status">{project.status}</span>
      <span className="arrow" aria-hidden="true">↗</span>
    </Link>
  );
}
