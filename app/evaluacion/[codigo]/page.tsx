import { SuperBattery01 } from "@/components/super-battery-01";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";

export const metadata = {
  title: "Evaluación — Super batería 01",
  description: "Aplicación privada de una batería psicométrica de Microrealidades.",
};

export default function CandidateEvaluationPage({ params }: { params: { codigo: string } }) {
  return (
    <main className="inner-page psychometric-page">
      <SiteHeader compact />
      <section className="page-intro psychometric-page-intro" aria-labelledby="candidate-evaluation-title">
        <p className="section-label">[ 05 ] &nbsp; Aplicación privada</p>
        <h1 id="candidate-evaluation-title">Tu evaluación<br /><em>comienza aquí.</em></h1>
        <p>Responde la batería asignada por el equipo responsable. Esta liga es personal y de un solo uso.</p>
      </section>
      <SuperBattery01 initialCandidateCode={params.codigo} />
      <SiteFooter />
    </main>
  );
}
