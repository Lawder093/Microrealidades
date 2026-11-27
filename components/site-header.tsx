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
  const links = [...navigation, ...(session ? [] : [{ label: "Ingresar", href: "/ingresar" }])];
  const [menuOpen, setMenuOpen] = useState(false);
  const menuButton = useRef<HTMLButtonElement>(null);
  const header = useRef<HTMLElement>(null);

  useEffect(() => {
    if (!menuOpen) return;
    // Safari no siempre enfoca un botón al tocarlo; Escape también funciona desde el body.
    const closeOnEscape = (event: globalThis.KeyboardEvent) => {
      if (event.key !== "Escape") return;
      setMenuOpen(false);
      menuButton.current?.focus();
    };
    const closeOutside = (event: Event) => {
      if (event.target instanceof Node && !header.current?.contains(event.target)) setMenuOpen(false);
    };
    const mobile = window.matchMedia("(max-width: 980px)");
    const closeOnWideScreen = (event: MediaQueryListEvent) => { if (!event.matches) setMenuOpen(false); };
    window.addEventListener("keydown", closeOnEscape);
    document.addEventListener("pointerdown", closeOutside);
    document.addEventListener("focusin", closeOutside);
    mobile.addEventListener("change", closeOnWideScreen);
    return () => {
      window.removeEventListener("keydown", closeOnEscape);
      document.removeEventListener("pointerdown", closeOutside);
      document.removeEventListener("focusin", closeOutside);
      mobile.removeEventListener("change", closeOnWideScreen);
    };
  }, [menuOpen]);

  return (
    <header ref={header} className={`site-header${compact ? " page-header" : ""}${menuOpen ? " is-menu-open" : ""}`}>
      <div className="site-header-glass">
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
          return <Link prefetch={false} key={item.href} href={item.href} className={item.href === "/ingresar" ? "access-entry-button" : undefined} aria-current={active ? "page" : undefined} onClick={() => setMenuOpen(false)}>{item.label}</Link>;
        })}
      </nav>
      </div>
    </header>
  );
}
