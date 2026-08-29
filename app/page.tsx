import Link from "next/link";
import { ProjectCard } from "@/components/project-card";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { projects } from "@/lib/projects";

const siteTools = [
  ["Instrumentos", "Recursos de observación y seguimiento"],
  ["Bitácoras", "Guías para registrar procesos cotidianos"],
  ["Aplicaciones", "Prototipos interactivos para acompañar"],
  ["Materiales", "Recursos abiertos para comunidades"],
];

export default function Home() {
  return (
    <main>
      <SiteHeader />
      <section className="hero" id="inicio">
        <div className="hero-kicker"><span>Laboratorio independiente</span><span>MX · LATAM</span></div>
        <h1>Mirar lo<br />cotidiano para<br /><em>transformarlo.</em></h1>
        <p className="hero-copy">Psicología, tecnología y comunalidad para observar, nombrar y transformar las realidades que habitamos.</p>
        <a className="hero-link" href="#proyectos">Explorar lo que hacemos <span aria-hidden="true">↘</span></a>
        <div className="color-path" aria-hidden="true"><span className="path-pink" /><span className="path-blue" /><span className="path-yellow" /></div>
      </section>
      <section className="manifesto" aria-labelledby="que-es">
        <p className="section-label">[ 00 ] &nbsp; Punto de partida</p>
        <div>
          <h2 id="que-es">Las realidades que habitamos <strong>no son neutrales.</strong></h2>
          <div className="manifesto-copy">
            <p>En un mundo donde la forma aparentemente más sencilla de vivir es hacerlo en “piloto automático”, los espacios y contenidos para conectar con uno mismo son los mejores regalos que nos podemos dar.</p>
            <p>Microrealidades representa una ventana mediante la cual podemos admirar y curiosear sobre las experiencias, emociones, pensamientos, personas y realidades que aún nos faltan por descubrir.</p>
            <p>A través de una ventana también podemos contemplar el interior que se resguarda en cada unidad, si así lo decidimos. Recordemos que, el autoconocimiento comienza cuando elegimos mirar hacia dentro.</p>
          </div>
          <p className="manifesto-support">Están hechas de relaciones, territorios, tecnologías, afectos y formas de comprender el mundo. Microrealidades investiga esos espacios y diseña maneras de intervenirlos.</p>
          <ol className="process" aria-label="Nuestro proceso"><li>Observar</li><li>Nombrar</li><li>Comprender</li><li>Diseñar</li><li>Transformar</li></ol>
        </div>
      </section>
      <section className="projects" id="proyectos" aria-labelledby="project-title">
        <div className="section-heading"><p className="section-label">[ 01 ] &nbsp; Proyectos</p><h2 id="project-title">Ideas que toman<br /><em>posición.</em></h2></div>
        <div className="project-list">
          {projects.map((project) => <ProjectCard key={project.slug} project={project} />)}
        </div>
        <Link className="section-link" href="/proyectos">Ver todos los proyectos <span aria-hidden="true">↗</span></Link>
      </section>
      <section className="tool-section" id="herramientas" aria-labelledby="tool-title">
        <div className="tool-intro"><p className="section-label">[ 02 ] &nbsp; Herramientas</p><h2 id="tool-title">Conocimiento que se puede <em>usar.</em></h2><p>No nos interesa acumular conceptos. Diseñamos recursos para comprender procesos y actuar sobre ellos.</p></div>
        <div className="tool-grid">
          {siteTools.map(([title, description], index) => <article key={title}><span>0{index + 1}</span><h3>{title}</h3><p>{description}</p><small>Próximamente</small></article>)}
        </div>
      </section>
      <SiteFooter />
    </main>
  );
}
