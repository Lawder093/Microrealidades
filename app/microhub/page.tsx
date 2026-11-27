import { ModuleCatalog } from "@/components/module-catalog";
import { MicrohubPreview } from "@/components/microhub-preview";
import { MicrohubAccount } from "@/components/microhub-access";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";

export const metadata = {
  title: "Microhub — Microrealidades",
  description: "Evaluaciones, tests y herramientas para psicólogos en un mismo espacio.",
};

export default function MicrohubPage() {
  return <main className="inner-page microhub-page">
    <SiteHeader compact />
    <section className="page-intro" aria-labelledby="microhub-title">
      <p className="section-label">[ 02 ] &nbsp; Herramientas para psicólogos</p>
      <h1 id="microhub-title">Tu espacio en<br /><em>Microhub.</em></h1>
      <p>Evaluaciones, tests y herramientas para acompañar tu práctica, en un mismo lugar.</p>
    </section>
    <MicrohubPreview />
    <section className="hub-section" aria-labelledby="microhub-tools-title">
      <div className="hub-section-heading"><p className="section-label">Espacio profesional</p><h2 id="microhub-tools-title">Herramientas que <em>acompañan.</em></h2></div>
      <MicrohubAccount />
      <ModuleCatalog />
    </section>
    <SiteFooter />
  </main>;
}
