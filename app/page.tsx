const projects = [
  { number: "01", title: "Acompañamiento Educativo Crítico", text: "Una propuesta para formar acompañantes y fortalecer comunidades educativas desde una mirada situada y no patologizante.", color: "pink" },
  { number: "02", title: "Vidovic 01", text: "Herramientas digitales para observar procesos psicológicos sin reducir a las personas a una puntuación.", color: "blue" },
  { number: "03", title: "Escultismo Crítico Popular", text: "Experiencias educativas comunitarias construidas desde los territorios y las realidades de América Latina.", color: "yellow" },
];
const siteTools = [
  ["Instrumentos", "Recursos de observación y seguimiento"],
  ["Bitácoras", "Guías para registrar procesos cotidianos"],
  ["Aplicaciones", "Prototipos interactivos para acompañar"],
  ["Materiales", "Recursos abiertos para comunidades"],
];

export default function Home() {
  return (
    <main>
      <header className="site-header">
        <a className="brand" href="#inicio" aria-label="Microrealidades, inicio">
          <span className="brand-mark" aria-hidden="true"><i /><i /><i /></span>
          <span>MICRO<br />REALIDADES</span>
        </a>
        <nav aria-label="Navegación principal">
          <a href="#inicio">Inicio</a><a href="#proyectos">Proyectos</a><a href="#herramientas">Herramientas</a>
        </nav>
      </header>
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
          <p>Están hechas de relaciones, territorios, tecnologías, afectos y formas de comprender el mundo. Microrealidades investiga esos espacios y diseña maneras de intervenirlos.</p>
          <ol className="process" aria-label="Nuestro proceso"><li>Observar</li><li>Nombrar</li><li>Comprender</li><li>Diseñar</li><li>Transformar</li></ol>
        </div>
      </section>
      <section className="projects" id="proyectos" aria-labelledby="project-title">
        <div className="section-heading"><p className="section-label">[ 01 ] &nbsp; Proyectos</p><h2 id="project-title">Ideas que toman<br /><em>posición.</em></h2></div>
        <div className="project-list">
          {projects.map((project) => (
            <article className={`project-card ${project.color}`} key={project.number}>
              <span className="project-number">{project.number}</span>
              <div><h3>{project.title}</h3><p>{project.text}</p></div>
              <span className="status">En desarrollo</span><span className="arrow" aria-hidden="true">↗</span>
            </article>
          ))}
        </div>
      </section>
      <section className="tool-section" id="herramientas" aria-labelledby="tool-title">
        <div className="tool-intro"><p className="section-label">[ 02 ] &nbsp; Herramientas</p><h2 id="tool-title">Conocimiento que se puede <em>usar.</em></h2><p>No nos interesa acumular conceptos. Diseñamos recursos para comprender procesos y actuar sobre ellos.</p></div>
        <div className="tool-grid">
          {siteTools.map(([title, description], index) => <article key={title}><span>0{index + 1}</span><h3>{title}</h3><p>{description}</p><small>Próximamente</small></article>)}
        </div>
      </section>
      <footer>
        <p>Microrealidades</p><h2>Psicología,<br /><span>Tecnología</span> y<br /><em>Comunalidad.</em></h2>
        <p className="footer-note">Desde América Latina para las realidades que estamos construyendo.</p><a href="#inicio" aria-label="Volver al inicio">↑</a>
      </footer>
    </main>
  );
}
