import Link from "next/link";
import { ModuleAccess } from "@/components/module-catalog";
import { Suspense } from "react";
import { SuperBattery01 } from "@/components/super-battery-01";
import { MicrohubAccess } from "@/components/microhub-access";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";

export const metadata = { title: "Evaluaciones — Microhub", description: "Crea baterías, comparte una liga por candidato y consulta tus resultados de Microtalento." };

export default function MicrohubEvaluationsPage() {
  return <main className="inner-page psychometric-page"><SiteHeader compact /><MicrohubAccess><ModuleAccess moduleId="microtalento"><div className="microhub-tool-back"><Link prefetch={false} className="back-link" href="/microhub">↖ Volver a Microhub</Link></div><Suspense fallback={<p aria-busy="true">Preparando evaluaciones…</p>}><SuperBattery01 initialMode="recruiter" /></Suspense></ModuleAccess></MicrohubAccess><SiteFooter /></main>;
}
