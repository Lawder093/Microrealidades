import { Suspense } from "react";
import { SuperBattery01 } from "@/components/super-battery-01";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";

export const metadata = {
  title: "Evaluación — Microtalento",
  description: "Aplicación privada de una batería psicométrica de Microrealidades.",
};

export default function CandidateEvaluationPage({ params }: { params: { codigo: string } }) {
  return (
    <main className="inner-page psychometric-page">
      <SiteHeader compact />
      <Suspense fallback={<p aria-busy="true">Preparando Microtalento…</p>}><SuperBattery01 initialCandidateCode={params.codigo} /></Suspense>
      <SiteFooter />
    </main>
  );
}
