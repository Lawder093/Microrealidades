"use client";

import Link from "next/link";
import { useEcosystem } from "@/components/ecosystem-provider";
import { EcosystemNavigation } from "@/components/module-catalog";
import { usePathname } from "next/navigation";
import { Fragment, type ReactNode } from "react";
import { useMicrohubAuth } from "@/components/microhub-auth-provider";

export function MicrohubAccount() {
  const { data } = useEcosystem();
  const { session, loading, signOut } = useMicrohubAuth();
  return <div className="microhub-account">
    {loading ? <p aria-busy="true">Preparando tu espacio…</p> : session ? <><p>Tu espacio, {data?.profile.display_name || session.user.user_metadata?.display_name || session.user.email}.</p><button type="button" className="super-battery-small-action" onClick={() => void signOut()}>Cerrar sesión ↗</button><EcosystemNavigation /></> : <><p>Reúne tus herramientas en un solo lugar. Crea tu cuenta para empezar, sin aprobación manual.</p><div className="microhub-account-actions"><Link prefetch={false} className="access-entry-button" href="/ingresar">Ingresar</Link></div></>}
  </div>;
}

export function MicrohubAccess({ children }: { children: ReactNode }) {
  const { session, loading } = useMicrohubAuth();
  const pathname = usePathname();
  if (loading) return <section className="hub-section" aria-busy="true"><p>Preparando tu espacio…</p></section>;
  if (!session) return <section className="hub-section"><div className="hub-section-heading"><p className="section-label">Tu espacio profesional</p><h2>Entra a tu <em>Microhub.</em></h2><p>Inicia sesión o crea tu cuenta para usar estas herramientas.</p><div className="microhub-account-actions"><Link prefetch={false} className="access-entry-button" href={`/ingresar?next=${encodeURIComponent(pathname)}`} onClick={(event) => { if (pathname === "/micro-id/invitacion") { event.preventDefault(); window.location.assign(`/ingresar?next=${encodeURIComponent(pathname + window.location.search)}`); } }}>Ingresar</Link></div></div></section>;
  return <Fragment key={session.user.id}>{children}</Fragment>;
}
