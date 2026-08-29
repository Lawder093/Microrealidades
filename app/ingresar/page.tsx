import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";

export const metadata = {
  title: "Ingresar — Microrealidades",
  description: "Acceso al espacio de trabajo de Microrealidades.",
};

export default function SignInPage() {
  return (
    <main className="inner-page sign-in-page">
      <SiteHeader compact />
      <section className="access-panel" aria-labelledby="access-title">
        <p className="section-label">[ 04 ] &nbsp; Acceso</p>
        <h1 id="access-title">Entrar a<br /><em>Microrealidades.</em></h1>
        <p>Este espacio estará disponible muy pronto para quienes participan en nuestros procesos.</p>
        <span className="status">Próximamente</span>
      </section>
      <SiteFooter />
    </main>
  );
}
