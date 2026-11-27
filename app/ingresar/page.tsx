import { Suspense } from "react";
import { MicrohubAuthForm } from "@/components/microhub-auth-form";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";

export const metadata = { title: "Ingresar — Microrealidades", description: "Inicia sesión o crea tu cuenta para acceder al ecosistema Microrealidades." };

export default function AuthPage() {
  return <main className="inner-page sign-in-page"><SiteHeader compact /><section className="access-panel microhub-auth-panel" aria-labelledby="access-title"><p className="section-label">MicroID · Tu acceso</p><div><h1 id="access-title">Entra a<br /><em>Microrealidades.</em></h1><p>Inicia sesión o crea tu cuenta para acceder a tus herramientas y publicaciones.</p></div><Suspense fallback={<p aria-busy="true">Preparando tu acceso…</p>}><MicrohubAuthForm /></Suspense></section><SiteFooter /></main>;
}
