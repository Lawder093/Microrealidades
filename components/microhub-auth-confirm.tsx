"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { useMicrohubAuth } from "@/components/microhub-auth-provider";

export function MicrohubAuthConfirm() {
  const { confirm, loading } = useMicrohubAuth();
  const router = useRouter();
  const request = useRef<Promise<void> | null>(null);
  const [error, setError] = useState("");
  useEffect(() => {
    if (loading) return;
    let active = true;
    if (!request.current) {
      const params = new URLSearchParams(window.location.search);
      for (const [key, value] of new URLSearchParams(window.location.hash.slice(1))) params.set(key, value);
      // Retirar credenciales del historial antes de cualquier navegación o recurso adicional.
      window.history.replaceState(null, "", window.location.pathname);
      request.current = confirm(params);
    }
    void request.current.then(() => { if (active) router.replace("/microhub"); }, (failure: unknown) => { if (active) setError(failure instanceof Error ? failure.message : "No se pudo confirmar la cuenta."); });
    return () => { active = false; };
  }, [confirm, loading, router]);
  return <div className="microhub-auth-form" aria-busy={!error}>{error ? <><p className="super-battery-error" role="alert">{error}</p><Link prefetch={false} className="super-battery-action" href="/ingresar">Iniciar sesión ↗</Link></> : <p role="status">Confirmando tu cuenta…</p>}</div>;
}
