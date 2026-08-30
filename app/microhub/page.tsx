import { PatientWorkspace } from "@/components/patient-workspace";
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
      <section className="hub-section" aria-labelledby="patient-section-title">
        <div className="hub-section-heading">
          <p className="section-label">Primera arquitectura</p>
          <h2 id="patient-section-title">Un expediente que <em>acompaña.</em></h2>
          <p>Una vista sencilla para ordenar la historia, el presente y los próximos pasos de cada persona. Esta primera versión usa únicamente datos simulados.</p>
        </div>
        <PatientWorkspace />
        <div className="hub-journal-divider" aria-hidden="true" />
        <div className="hub-section-heading hub-journal-heading">
          <p className="section-label">Espacio personal</p>
          <h2>Volver a lo que <em>viviste.</em></h2>
          <p>Esta bitácora permanece separada del expediente: es una herramienta local de autoobservación y no un registro clínico.</p>
        </div>
        <MicrohubJournal />
      </section>
      <SiteFooter />
    </main>
  );
}
