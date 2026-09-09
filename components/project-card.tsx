import Link from "next/link";
import { BrainCardMark } from "@/components/brain/brain-card-mark";
import type { Project } from "@/lib/projects";

export function ProjectCard({ project, variant = "list" }: { project: Project; variant?: "list" | "grid" }) {
  return (
    <Link className={`project-card ${project.color} project-card-${variant}`} href={project.href ?? `/proyectos/${project.slug}`}>
      {project.visual === "brain" && <span className="project-card-visual"><BrainCardMark /></span>}
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
