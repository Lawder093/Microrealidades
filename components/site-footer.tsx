import Link from "next/link";

export function SiteFooter() {
  return (
    <footer>
      <p>Microrealidades</p>
      <h2>Psicología,<br /><span>Tecnología</span> y<br /><em>Comunalidad.</em></h2>
      <p className="footer-note">Desde América Latina para las realidades que estamos construyendo.</p>
      <Link href="/" aria-label="Volver al inicio">↑</Link>
    </footer>
  );
}
