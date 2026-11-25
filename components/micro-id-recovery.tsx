"use client";

import Link from "next/link";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { useMicrohubAuth } from "@/components/microhub-auth-provider";

export function MicroIdRecovery() {
  const { session, loading, recoverPassword, updatePassword, confirm } = useMicrohubAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [repeat, setRepeat] = useState("");
  const [message, setMessage] = useState("");
  const [pending, setPending] = useState(false);
  const request = useRef<Promise<void> | null>(null);
  useEffect(() => {
    if (loading || request.current) return;
    const params = new URLSearchParams(window.location.search);
    for (const [key,value] of new URLSearchParams(window.location.hash.slice(1))) params.set(key,value);
    if (!params.get("token_hash") && !params.get("refresh_token") && !params.get("error")) return;
    window.history.replaceState(null,"",window.location.pathname);
    request.current = confirm(params);
    void request.current.catch((error: unknown) => setMessage(error instanceof Error ? error.message : "El enlace expiró."));
  }, [confirm, loading]);
  async function submit(event: FormEvent) {
    event.preventDefault(); setPending(true); setMessage("");
    try {
      if (session) {
        if (password.length < 8 || password !== repeat) throw new Error("Usa al menos ocho caracteres y confirma la contraseña.");
        await updatePassword(password); setPassword(""); setRepeat(""); setMessage("Contraseña actualizada. Puedes continuar navegando.");
      } else { await recoverPassword(email); setMessage("Si el correo está registrado, recibirás un enlace para recuperar tu acceso."); }
    } catch (error) { setMessage(error instanceof Error ? error.message : "No se pudo completar la solicitud."); }
    finally { setPending(false); }
  }
  return <form className="super-battery-login microhub-auth-form" onSubmit={submit}><h2>{session ? "Elige tu nueva contraseña" : "Recupera tu acceso"}</h2>{session ? <><label>Nueva contraseña<input type="password" required minLength={8} autoComplete="new-password" value={password} onChange={(event) => setPassword(event.target.value)} /></label><label>Confirmar contraseña<input type="password" required minLength={8} autoComplete="new-password" value={repeat} onChange={(event) => setRepeat(event.target.value)} /></label></> : <label>Correo electrónico<input type="email" required autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} /></label>}<button className="super-battery-action" disabled={pending || loading}>{session ? "Actualizar contraseña" : "Enviar enlace de recuperación"}</button><p role="status">{message}</p><Link className="microhub-text-link" href={session ? "/micro-id" : "/ingresar"}>Continuar ↗</Link></form>;
}
