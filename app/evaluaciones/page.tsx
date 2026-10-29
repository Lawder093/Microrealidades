import { Suspense } from "react";
import { SuperBattery01 } from "@/components/super-battery-01";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";

export const metadata = {
  title: "Evaluaciones — Super batería 01",
  description: "Módulo de trabajo para baterías psicométricas orientadas al perfil de terapeuta.",
};

export default function EvaluationsPage() {
  return (
    <main className="inner-page psychometric-page">
      <SiteHeader compact />
      <section className="page-intro psychometric-page-intro" aria-labelledby="psychometric-title">
        <p className="section-label">[ 05 ] &nbsp; Super batería 01</p>
        <h1 id="psychometric-title">Evaluaciones<br /><em>Psicométricas.</em></h1>
        <p>Una primera herramienta para configurar baterías, generar códigos de aplicación y acompañar la revisión profesional de resultados.</p>
      </section>
      <Suspense fallback={<div className="super-battery-module" aria-busy="true"><p className="section-label">Preparando evaluaciones…</p></div>}>
        <SuperBattery01 />
      </Suspense>
      <SiteFooter />
    </main>
  );
}
