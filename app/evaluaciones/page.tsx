import { Suspense } from "react";
import { SuperBattery01 } from "@/components/super-battery-01";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";

export const metadata = {
  title: "Evaluaciones — Microtalento",
  description: "Módulo de trabajo para baterías psicométricas orientadas al perfil de terapeuta.",
};

export default function EvaluationsPage() {
  return (
    <main className="inner-page psychometric-page">
      <SiteHeader compact />
      <Suspense fallback={<div className="super-battery-module" aria-busy="true"><p className="section-label">Preparando evaluaciones…</p></div>}>
        <SuperBattery01 />
      </Suspense>
      <SiteFooter />
    </main>
  );
}
