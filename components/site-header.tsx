"use client";

import Link from "next/link";
import { useMicrohubAuth } from "@/components/microhub-auth-provider";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";

const navigation = [
  { label: "Inicio", href: "/" },
  { label: "Proyectos", href: "/proyectos" },
  { label: "Microhub", href: "/microhub" },
  { label: "Publicaciones", href: "/publicaciones" },
];

export function SiteHeader({ compact = false }: { compact?: boolean }) {
  const pathname = usePathname();
  const { session, loading } = useMicrohubAuth();
  const links = [...navigation, ...(session ? [] : [{ label: "Iniciar sesión", href: "/ingresar" }, { label: "Crear cuenta", href: "/registro" }])];
  const [menuOpen, setMenuOpen] = useState(false);
  const menuButton = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!menuOpen) return;
    // Safari no siempre enfoca un botón al tocarlo; Escape también funciona desde el body.
    const closeOnEscape = (event: globalThis.KeyboardEvent) => {
      if (event.key !== "Escape") return;
      setMenuOpen(false);
      menuButton.current?.focus();
    };
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [menuOpen]);

  return (
    <header className={`site-header${compact ? " page-header" : ""}${menuOpen ? " is-menu-open" : ""}`}>
      <Link prefetch={false} className="brand" href="/" aria-label="Microrealidades, inicio" onClick={() => setMenuOpen(false)}>
        <span className="brand-mark" aria-hidden="true"><i /><i /><i /></span>
        <span>MICRO<br />REALIDADES</span>
      </Link>
      <button ref={menuButton} className="site-menu-toggle" type="button" aria-expanded={menuOpen} aria-controls="site-navigation" aria-label={menuOpen ? "Cerrar menú" : "Abrir menú"} onClick={() => setMenuOpen((open) => !open)}>
        <span>{menuOpen ? "Cerrar" : "Menú"}</span>
        <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
          {menuOpen ? <path d="m4 4 10 10M14 4 4 14" /> : <path d="M2 5h14M2 9h14M2 13h14" />}
        </svg>
      </button>
      <nav id="site-navigation" aria-label="Navegación principal" aria-busy={loading}>
        {/* El acceso cambia con la sesión: evitar precargas que sobrevivan al cambio de cuenta. */}
        {links.map((item) => {
          const active = pathname === item.href || (item.href !== "/" && pathname?.startsWith(`${item.href}/`)) || (item.href === "/microhub" && (pathname === "/evaluaciones" || pathname?.startsWith("/evaluacion/")));
          return <Link prefetch={false} key={item.href} href={item.href} aria-current={active ? "page" : undefined} onClick={() => setMenuOpen(false)}>{item.label}</Link>;
        })}
      </nav>
    </header>
  );
}
