import Link from "next/link";
import { PatientWorkspace } from "@/components/patient-workspace";
import { MicrohubAccess } from "@/components/microhub-access";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";

export const metadata = { title: "Expediente — Microhub", description: "Demostración del expediente de acompañamiento." };

export default function ToolPage() {
  return <main className="inner-page microhub-page"><SiteHeader compact /><MicrohubAccess><section className="hub-section"><Link prefetch={false} className="back-link" href="/microhub">↖ Volver a Microhub</Link><div className="hub-section-heading"><p className="section-label">Microhub · Datos simulados</p><h2>Un expediente que <em>acompaña.</em></h2><p>Una vista sencilla para ordenar la historia, el presente y los próximos pasos de cada persona. Esta primera versión usa únicamente datos simulados.</p></div><PatientWorkspace /></section></MicrohubAccess><SiteFooter /></main>;
}
