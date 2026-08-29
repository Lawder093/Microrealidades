import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";

export const metadata = {
  title: "Microhub — Microrealidades",
  description: "El espacio propio de Microrealidades para reunir herramientas, procesos y conversaciones.",
};

const spaces = [
  ["01", "Archivo vivo", "Un lugar para reunir preguntas, referencias y hallazgos."],
  ["02", "Mesa de trabajo", "Prototipos y materiales que se construyen en proceso."],
  ["03", "En común", "Una puerta para compartir prácticas y abrir conversaciones."],
];

export default function MicrohubPage() {
  return (
    <main className="inner-page microhub-page">
      <SiteHeader compact />
      <section className="page-intro" aria-labelledby="microhub-title">
        <p className="section-label">[ 02 ] &nbsp; Espacio propio</p>
        <h1 id="microhub-title">Bienvenidas al<br /><em>Microhub.</em></h1>
        <p>Un punto de encuentro para explorar lo que estamos pensando, haciendo y compartiendo desde Microrealidades.</p>
      </section>
      <section className="hub-section" aria-label="Espacios del Microhub">
        <p className="section-label">Una casa en construcción</p>
        <div className="hub-grid">
          {spaces.map(([number, title, description]) => (
            <article key={number} className="hub-card">
              <span>{number}</span><h2>{title}</h2><p>{description}</p><small>Próximamente</small>
            </article>
          ))}
        </div>
      </section>
      <SiteFooter />
    </main>
  );
}
