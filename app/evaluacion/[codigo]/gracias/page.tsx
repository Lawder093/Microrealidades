import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";

export const metadata = {
  title: "Gracias — Microtalento",
  description: "Confirmación de recepción de la evaluación.",
};

export default function EvaluationThanksPage() {
  return (
    <main className="inner-page psychometric-page">
      <SiteHeader compact />
      <section className="page-intro psychometric-page-intro" aria-labelledby="thanks-title">
        <p className="section-label">[ 05 ] &nbsp; Aplicación recibida</p>
        <h1 id="thanks-title">Gracias por<br /><em>participar.</em></h1>
        <p>Tu evaluación fue recibida correctamente. El reporte queda disponible para el reclutador responsable, quien revisará la información como parte del proceso profesional.</p>
      </section>
      <SiteFooter />
    </main>
  );
}
