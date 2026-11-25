import { MicrohubAuthConfirm } from "@/components/microhub-auth-confirm";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";

export const metadata = { title: "Confirma tu cuenta — Microhub", robots: { index: false, follow: false }, referrer: "no-referrer" };

export default function ConfirmPage() {
  return <main className="inner-page sign-in-page"><SiteHeader compact /><section className="access-panel microhub-auth-panel"><p className="section-label">Microhub · Confirmación</p><h1>Tu cuenta,<br /><em>tu espacio.</em></h1><MicrohubAuthConfirm /></section><SiteFooter /></main>;
}
