import Link from "next/link";
import { MicrohubAccount } from "@/components/microhub-access";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";

export const metadata = {
  title: "Microhub — Microrealidades",
  description: "Evaluaciones, tests y herramientas para psicólogos en un mismo espacio.",
};

const tools = [
  { number: "01", href: "/microhub/evaluaciones", title: "Evaluaciones", text: "Microtalento: crea baterías, asigna tests con una sola liga y revisa resultados y reportes PDF.", status: "Microtalento · Acceso profesional" },
  { number: "02", href: "/microhub/expediente", title: "Expediente", text: "Una vista para ordenar la historia y el acompañamiento de cada persona. Por ahora, únicamente datos simulados.", status: "Demostración · Datos simulados" },
  { number: "03", href: "/microhub/bitacora", title: "Bitácora", text: "Un espacio de autoobservación para registrar experiencias. Se guarda localmente en este navegador.", status: "Herramienta local" },
];

export default function MicrohubPage() {
  return <main className="inner-page microhub-page">
    <SiteHeader compact />
    <section className="page-intro" aria-labelledby="microhub-title">
      <p className="section-label">[ 02 ] &nbsp; Herramientas para psicólogos</p>
      <h1 id="microhub-title">Tu espacio en<br /><em>Microhub.</em></h1>
      <p>Evaluaciones, tests y herramientas para acompañar tu práctica, en un mismo lugar.</p>
    </section>
    <section className="hub-section" aria-labelledby="microhub-tools-title">
      <div className="hub-section-heading"><p className="section-label">Espacio profesional</p><h2 id="microhub-tools-title">Herramientas que <em>acompañan.</em></h2></div>
      <MicrohubAccount />
      <div className="hub-grid">{tools.map((tool) => <Link prefetch={false} className="hub-card" href={tool.href} key={tool.href}><span>{tool.number}</span><h2>{tool.title}</h2><p>{tool.text}</p><small>{tool.status} ↗</small></Link>)}</div>
    </section>
    <SiteFooter />
  </main>;
}
