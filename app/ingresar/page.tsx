import { Suspense } from "react";
import { MicrohubAuthForm } from "@/components/microhub-auth-form";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";

export const metadata = { title: "Iniciar sesión — Microhub", description: "Accede a tus evaluaciones y herramientas profesionales." };

export default function AuthPage() {
  return <main className="inner-page sign-in-page"><SiteHeader compact /><section className="access-panel microhub-auth-panel" aria-labelledby="access-title"><p className="section-label">Microhub · Acceso profesional</p><div><h1 id="access-title">Entra a tu<br /><em>Microhub.</em></h1><p>Inicia sesión para crear evaluaciones y continuar con tus herramientas.</p></div><Suspense fallback={<p aria-busy="true">Preparando tu acceso…</p>}><MicrohubAuthForm /></Suspense></section><SiteFooter /></main>;
}
