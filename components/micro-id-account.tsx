"use client";

import Link from "next/link";
import { useEffect, useState, type FormEvent } from "react";
import { useMicrohubAuth } from "@/components/microhub-auth-provider";

type IdentityData = { profile: { display_name: string; bio: string }; sessions: Array<{ id: string; device_label: string; last_seen_at: string; revoked_at: string | null; is_current: boolean }> };

export function MicroIdAccount() {
  const { authFetch, signOut } = useMicrohubAuth();
  const [data, setData] = useState<IdentityData | null>(null);
  const [name, setName] = useState("");
  const [bio, setBio] = useState("");
  const [message, setMessage] = useState("");
  const [pending, setPending] = useState(false);
  useEffect(() => {
    let active = true;
    void authFetch("/api/micro-id").then(async (response) => {
      const result = await response.json() as IdentityData & { error?: string };
      if (!response.ok) throw new Error(result.error);
      if (active) { setData(result); setName(result.profile.display_name); setBio(result.profile.bio); }
    }).catch((error: unknown) => { if (active) setMessage(error instanceof Error ? error.message : "No se pudo cargar tu perfil."); });
    return () => { active = false; };
  }, [authFetch]);

  async function save(event: FormEvent) {
    event.preventDefault();
    setPending(true);
    try {
      const response = await authFetch("/api/micro-id", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "profile", name, bio }) });
      const result = await response.json() as { error?: string };
      if (!response.ok) throw new Error(result.error);
      setMessage("Perfil actualizado.");
    } catch (error) { setMessage(error instanceof Error ? error.message : "No se pudo guardar."); }
    finally { setPending(false); }
  }

  async function revoke(id?: string) {
    const response = await authFetch("/api/micro-id", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: id ? "revoke-session" : "revoke-all", sessionId: id }) });
    const result = await response.json() as { error?: string };
    if (!response.ok) { setMessage(result.error || "No se pudo cerrar la sesión."); return; }
    if (!id || data?.sessions.find((entry) => entry.id === id)?.is_current) await signOut(!id);
    else setData((current) => current ? { ...current, sessions: current.sessions.filter((entry) => entry.id !== id) } : null);
  }

  return <section className="hub-section"><div className="hub-section-heading"><p className="section-label">MicroID</p><h1>Tu identidad en <em>Microrealidades.</em></h1><Link className="section-link" href="/microhub">Ir a MicroHub ↗</Link></div>
    <form className="root-blog-form" onSubmit={save}><div className="root-form-grid"><label>Nombre público<input required maxLength={120} value={name} onChange={(event) => setName(event.target.value)} /></label><label>Presentación<textarea maxLength={1500} value={bio} onChange={(event) => setBio(event.target.value)} /></label></div><button className="publication-primary-action" disabled={pending || !data}>Guardar perfil</button></form>
    <p role="status">{message}</p><h2>Sesiones</h2>{data?.sessions.filter((entry) => !entry.revoked_at).map((entry) => <article className="root-post-row" key={entry.id}><div><p>{entry.is_current ? "Este navegador" : entry.device_label}</p><small>{new Date(entry.last_seen_at).toLocaleString("es-MX")}</small></div><button className="super-battery-small-action" onClick={() => void revoke(entry.id)}>Cerrar sesión</button></article>)}<button className="section-link" onClick={() => void revoke()}>Cerrar todas las sesiones</button>
  </section>;
}
