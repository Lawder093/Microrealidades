import { MicrohubJournal } from "@/components/microhub-journal";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";

export const metadata = {
  title: "Microhub — Microrealidades",
  description: "El espacio propio de Microrealidades para reunir herramientas, procesos y conversaciones.",
};

export default function MicrohubPage() {
  return (
    <main className="inner-page microhub-page">
      <SiteHeader compact />
      <section className="page-intro" aria-labelledby="microhub-title">
        <p className="section-label">[ 02 ] &nbsp; Espacio propio</p>
        <h1 id="microhub-title">Bienvenidas al<br /><em>Microhub.</em></h1>
        <p>Un punto de encuentro para explorar lo que estamos pensando, haciendo y compartiendo desde Microrealidades.</p>
      </section>
      <section className="hub-section" aria-label="Bitácora del Microhub">
        <div className="hub-section-heading">
          <p className="section-label">Una casa en construcción</p>
          <h2>Un lugar para volver a lo que <em>viviste.</em></h2>
          <p>Registra una experiencia, una pregunta o algo que quieras seguir mirando. No tienes que resolverlo todo en una sola entrada.</p>
        </div>
        <MicrohubJournal />
      </section>
      <SiteFooter />
    </main>
  );
}
