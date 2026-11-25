import { Suspense } from "react";
import { MicrohubAuthForm } from "@/components/microhub-auth-form";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";

export const metadata = { title: "Crear cuenta — Microhub", description: "Crea tu cuenta de Microhub sin aprobación manual." };

export default function AuthPage() {
  return <main className="inner-page sign-in-page"><SiteHeader compact /><section className="access-panel microhub-auth-panel" aria-labelledby="access-title"><p className="section-label">Microhub · Registro</p><div><h1 id="access-title">Crea tu<br /><em>Microhub.</em></h1><p>Tu cuenta, tus herramientas. Regístrate con tu correo para empezar.</p></div><Suspense fallback={<p aria-busy="true">Preparando tu acceso…</p>}><MicrohubAuthForm register /></Suspense></section><SiteFooter /></main>;
}
