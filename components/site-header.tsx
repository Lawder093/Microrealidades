import Link from "next/link";

const navigation = [
  { label: "Inicio", href: "/" },
  { label: "Proyectos", href: "/proyectos" },
  { label: "Microhub", href: "/microhub" },
  { label: "Publicaciones", href: "/publicaciones" },
  { label: "Ingresar", href: "/ingresar" },
];

export function SiteHeader({ compact = false }: { compact?: boolean }) {
  return (
    <header className={`site-header${compact ? " page-header" : ""}`}>
      <Link className="brand" href="/" aria-label="Microrealidades, inicio">
        <span className="brand-mark" aria-hidden="true"><i /><i /><i /></span>
        <span>MICRO<br />REALIDADES</span>
      </Link>
      <nav aria-label="Navegación principal">
        {navigation.map((item) => <Link key={item.href} href={item.href}>{item.label}</Link>)}
      </nav>
    </header>
  );
}
