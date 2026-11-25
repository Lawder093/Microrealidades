import Link from "next/link";
import { MicrohubJournal } from "@/components/microhub-journal";
import { ModuleAccess } from "@/components/module-catalog";
import { MicrohubAccess } from "@/components/microhub-access";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";

export const metadata = { title: "Bitácora — Microhub", description: "Bitácora local de experiencias y autoobservación." };

export default function ToolPage() {
  return <main className="inner-page microhub-page"><SiteHeader compact /><MicrohubAccess><ModuleAccess moduleId="swap"><section className="hub-section"><Link prefetch={false} className="back-link" href="/microhub">↖ Volver a Microhub</Link><div className="hub-section-heading"><p className="section-label">Microhub · Espacio personal</p><h2>Volver a lo que <em>viviste.</em></h2><p>Esta bitácora es una herramienta local de autoobservación y no un registro clínico. Sus entradas permanecen en este navegador.</p></div><MicrohubJournal /></section></ModuleAccess></MicrohubAccess><SiteFooter /></main>;
}
