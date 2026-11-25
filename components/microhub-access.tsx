"use client";

import Link from "next/link";
import { RootDashboardLink } from "@/components/admin/root-dashboard-link";
import { usePathname } from "next/navigation";
import { Fragment, type ReactNode } from "react";
import { useMicrohubAuth } from "@/components/microhub-auth-provider";

export function MicrohubAccount() {
  const { session, loading, signOut } = useMicrohubAuth();
  return <div className="microhub-account">
    {loading ? <p aria-busy="true">Preparando tu espacio…</p> : session ? <><p>Tu espacio, {session.user.user_metadata?.display_name || session.user.email}.</p><button type="button" className="super-battery-small-action" onClick={() => void signOut()}>Cerrar sesión ↗</button><RootDashboardLink /></> : <><p>Reúne tus herramientas en un solo lugar. Crea tu cuenta para empezar, sin aprobación manual.</p><div className="microhub-account-actions"><Link prefetch={false} className="section-link" href="/ingresar">Iniciar sesión ↗</Link><Link prefetch={false} className="section-link" href="/registro">Crear cuenta ↗</Link></div></>}
  </div>;
}

export function MicrohubAccess({ children }: { children: ReactNode }) {
  const { session, loading } = useMicrohubAuth();
  const pathname = usePathname();
  if (loading) return <section className="hub-section" aria-busy="true"><p>Preparando tu espacio…</p></section>;
  if (!session) return <section className="hub-section"><div className="hub-section-heading"><p className="section-label">Tu espacio profesional</p><h2>Entra a tu <em>Microhub.</em></h2><p>Inicia sesión o crea tu cuenta para usar estas herramientas.</p><div className="microhub-account-actions"><Link prefetch={false} className="super-battery-action" href={`/ingresar?next=${encodeURIComponent(pathname)}`}>Iniciar sesión ↗</Link><Link prefetch={false} className="super-battery-action" href={`/registro?next=${encodeURIComponent(pathname)}`}>Crear cuenta ↗</Link></div></div></section>;
  return <Fragment key={session.user.id}>{children}</Fragment>;
}
