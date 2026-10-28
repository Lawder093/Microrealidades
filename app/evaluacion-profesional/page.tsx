import { ProfessionalEvaluation } from "@/components/professional-evaluation";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";

export const metadata = {
  title: "Evaluación Profesional — Microrealidades",
  description: "Instrumento de trabajo en revisión para el perfil de puesto de terapeuta.",
};

export default function ProfessionalEvaluationPage() {
  return (
    <main className="inner-page evaluation-page">
      <SiteHeader compact />
      <section className="page-intro evaluation-page-intro" aria-labelledby="evaluation-page-title">
        <p className="section-label">[ 05 ] &nbsp; Instrumento de trabajo</p>
        <h1 id="evaluation-page-title">Evaluación<br /><em>Profesional.</em></h1>
        <p>Una primera versión para revisar el perfil de puesto de terapeuta desde la práctica, la ética y la relación con las personas.</p>
      </section>
      <ProfessionalEvaluation />
      <SiteFooter />
    </main>
  );
}
