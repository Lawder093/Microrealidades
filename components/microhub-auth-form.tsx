"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, type FormEvent } from "react";
import { useMicrohubAuth } from "@/components/microhub-auth-provider";
import { microhubReturnPath } from "@/lib/microhub-auth";

export function MicrohubAuthForm({ register = false }: { register?: boolean }) {
  const { session, loading, configured, signIn, signUp } = useMicrohubAuth();
  const router = useRouter();
  const params = useSearchParams();
  const next = microhubReturnPath(params.get("next"));
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const [sent, setSent] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pending) return;
    setError("");
    if (register && password !== confirmation) { setError("Las contraseñas no coinciden."); return; }
    setPending(true);
    try {
      if (register) {
        const authenticated = await signUp(name, email, password);
        setPassword(""); setConfirmation("");
        if (!authenticated) { setSent(true); return; }
      } else { await signIn(email, password); setPassword(""); }
      router.replace(next);
    } catch (failure) { setError(failure instanceof Error ? failure.message : "No se pudo completar el acceso."); }
    finally { setPending(false); }
  }

  if (loading) return <div className="microhub-auth-form" aria-busy="true"><p>Preparando tu acceso…</p></div>;
  if (session) return <div className="microhub-auth-form"><p>Ya iniciaste sesión como {session.user.email}.</p><Link prefetch={false} className="super-battery-action" href={next}>Continuar a Microhub ↗</Link></div>;
  if (sent) return <div className="microhub-auth-form" role="status"><h2>Revisa tu <em>correo.</em></h2><p>Si el registro puede completarse, recibirás un enlace en <strong>{email}</strong>. Confírmalo para entrar; no necesitas aprobación manual. Revisa también spam.</p><Link prefetch={false} className="super-battery-action" href={`/ingresar?next=${encodeURIComponent(next)}`}>Ir a iniciar sesión ↗</Link><button className="super-battery-back" type="button" onClick={() => setSent(false)}>Usar otro correo</button></div>;

  return <form className="super-battery-login microhub-auth-form" onSubmit={submit} aria-busy={pending}>
    {!configured && <p className="super-battery-error" role="status">El acceso aún no está configurado en este entorno.</p>}
    {register && <label>Nombre<input autoComplete="name" value={name} onChange={(event) => setName(event.target.value)} required maxLength={100} /></label>}
    <label>Correo electrónico<input type="email" inputMode="email" autoComplete="email" autoCapitalize="none" spellCheck={false} value={email} onChange={(event) => setEmail(event.target.value)} required maxLength={254} /></label>
    <label>Contraseña<input type="password" autoComplete={register ? "new-password" : "current-password"} value={password} onChange={(event) => setPassword(event.target.value)} required minLength={register ? 8 : 1} maxLength={128} aria-describedby={register ? "microhub-password-help" : undefined} /></label>
    {register && <><p id="microhub-password-help">Usa al menos 8 caracteres. Solo pedimos los datos necesarios para crear tu acceso.</p><label>Confirmar contraseña<input type="password" autoComplete="new-password" value={confirmation} onChange={(event) => setConfirmation(event.target.value)} required minLength={8} maxLength={128} /></label></>}
    {error && <p className="super-battery-error" role="alert">{error}</p>}
    <button className="super-battery-action" type="submit" disabled={pending || !configured}>{pending ? "Un momento…" : register ? "Crear cuenta ↗" : "Iniciar sesión ↗"}</button>
    {!register && <Link prefetch={false} className="microhub-text-link" href="/micro-id/recuperar">Recuperar contraseña</Link>}
    <p>{register ? "¿Ya tienes cuenta?" : "¿Es tu primera vez?"} <Link prefetch={false} className="microhub-text-link" href={`${register ? "/ingresar" : "/registro"}?next=${encodeURIComponent(next)}`}>{register ? "Inicia sesión" : "Crea tu cuenta"} ↗</Link></p>
  </form>;
}
