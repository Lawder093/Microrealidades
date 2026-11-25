import { MicroIdRecovery } from "@/components/micro-id-recovery";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
export const metadata = { title: "Recuperar acceso — MicroID", robots: { index: false } };
export default function RecoveryPage() {
  return <main className="inner-page"><SiteHeader compact /><section className="hub-section"><MicroIdRecovery /></section><SiteFooter /></main>;
}
