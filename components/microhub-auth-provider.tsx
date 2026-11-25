"use client";

import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import { MicrohubAuthError, microhubAuthConfigured, microhubAuthRequest, microhubSessionKey, readMicrohubSession, readMicrohubUser, type MicrohubSession } from "@/lib/microhub-auth";

type MicrohubAuth = {
  session: MicrohubSession | null; loading: boolean; configured: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (name: string, email: string, password: string) => Promise<boolean>;
  signOut: () => Promise<void>;
  confirm: (params: URLSearchParams) => Promise<void>;
  authFetch: (input: string, init?: RequestInit) => Promise<Response>;
};
const AuthContext = createContext<MicrohubAuth | null>(null);

export function MicrohubAuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<MicrohubSession | null>(null);
  const [loading, setLoading] = useState(true);
  const currentSession = useRef<MicrohubSession | null>(null);
  const refreshing = useRef<Promise<MicrohubSession | null> | null>(null);
  const generation = useRef(0);

  const store = useCallback((next: MicrohubSession | null) => {
    currentSession.current = next;
    setSession(next);
    try {
      if (next) window.localStorage.setItem(microhubSessionKey, JSON.stringify(next));
      else window.localStorage.removeItem(microhubSessionKey);
    } catch { /* En navegación privada la sesión permanece en memoria. */ }
  }, []);

  const refreshSession = useCallback(async (): Promise<MicrohubSession | null> => {
    if (refreshing.current) return refreshing.current;
    const previous = currentSession.current;
    if (!previous) return null;
    const revision = generation.current;
    const promise = (async () => {
      try {
        const next = readMicrohubSession(await microhubAuthRequest("token?grant_type=refresh_token", { refresh_token: previous.refresh_token }));
        if (!next) throw new MicrohubAuthError("La sesión expiró. Inicia sesión de nuevo.", 401);
        if (revision !== generation.current) return null;
        store(next);
        return next;
      } catch (error) {
        // Una desconexión temporal no elimina la sesión ni el token de renovación.
        if (revision === generation.current && error instanceof MicrohubAuthError && error.status >= 400 && error.status < 500 && error.status !== 429) store(null);
        return null;
      }
    })();
    refreshing.current = promise;
    try { return await promise; } finally { if (refreshing.current === promise) refreshing.current = null; }
  }, [store]);

  useEffect(() => {
    let active = true;
    const revision = generation.current;
    async function restore() {
      try {
        const stored: unknown = JSON.parse(window.localStorage.getItem(microhubSessionKey) ?? "null");
        const saved = readMicrohubSession(stored);
        if (!saved || !microhubAuthConfigured) return;
        currentSession.current = saved;
        if (saved.expires_at <= Date.now() / 1000 + 60) await refreshSession();
        else {
          const user = readMicrohubUser(await microhubAuthRequest("user", undefined, saved.access_token));
          if (active && revision === generation.current && user?.id === saved.user.id) store({ ...saved, user });
        }
      } catch (error) {
        if (active && revision === generation.current && error instanceof MicrohubAuthError && error.status === 401) await refreshSession();
      } finally { if (active) setLoading(false); }
    }
    void restore();
    const sync = (event: StorageEvent) => {
      if (event.key !== microhubSessionKey) return;
      generation.current += 1;
      try { const next = readMicrohubSession(JSON.parse(event.newValue ?? "null")); currentSession.current = next; setSession(next); } catch { currentSession.current = null; setSession(null); }
    };
    window.addEventListener("storage", sync);
    return () => { active = false; window.removeEventListener("storage", sync); };
  }, [refreshSession, store]);

  useEffect(() => {
    if (!session) return;
    const renew = () => { if (document.visibilityState === "visible" && currentSession.current && currentSession.current.expires_at <= Date.now() / 1000 + 60) void refreshSession(); };
    const timer = window.setInterval(renew, 30000);
    document.addEventListener("visibilitychange", renew);
    return () => { window.clearInterval(timer); document.removeEventListener("visibilitychange", renew); };
  }, [session, refreshSession]);

  const signIn = useCallback(async (email: string, password: string) => {
    const next = readMicrohubSession(await microhubAuthRequest("token?grant_type=password", { email: email.trim(), password }));
    if (!next) throw new Error("No se pudo iniciar sesión.");
    generation.current += 1; store(next);
  }, [store]);

  const signUp = useCallback(async (name: string, email: string, password: string) => {
    const data = await microhubAuthRequest(`signup?redirect_to=${encodeURIComponent(`${window.location.origin}/auth/confirm`)}`, { email: email.trim(), password, data: { display_name: name.trim() } });
    const next = readMicrohubSession(data);
    if (next) { generation.current += 1; store(next); }
    return Boolean(next);
  }, [store]);

  const signOut = useCallback(async () => {
    const token = currentSession.current?.access_token;
    generation.current += 1; store(null);
    if (token) await microhubAuthRequest("logout?scope=local", {}, token).catch(() => undefined);
  }, [store]);

  const confirm = useCallback(async (params: URLSearchParams) => {
    if (params.has("error")) throw new Error("El enlace de confirmación expiró o no es válido. Intenta iniciar sesión o solicita un nuevo correo.");
    let next: MicrohubSession | null = null;
    if (params.get("token_hash")) {
      const type = params.get("type");
      if (type !== "signup" && type !== "email") throw new Error("Este enlace no corresponde a una confirmación de cuenta.");
      next = readMicrohubSession(await microhubAuthRequest("verify", { token_hash: params.get("token_hash"), type }));
    } else if (params.get("refresh_token")) {
      // Intercambiar el token valida el enlace antes de persistir la sesión.
      next = readMicrohubSession(await microhubAuthRequest("token?grant_type=refresh_token", { refresh_token: params.get("refresh_token") }));
    }
    if (!next) throw new Error("No encontramos una confirmación válida. Si ya confirmaste tu correo, inicia sesión.");
    generation.current += 1; store(next);
  }, [store]);

  const authFetch = useCallback(async (input: string, init: RequestInit = {}) => {
    let active = currentSession.current;
    if (active && active.expires_at <= Date.now() / 1000 + 60) active = await refreshSession();
    if (!active) return Response.json({ error: "Inicia sesión para continuar." }, { status: 401 });
    const send = (token: string) => { const headers = new Headers(init.headers); headers.set("Authorization", `Bearer ${token}`); return fetch(input, { ...init, headers, cache: "no-store" }); };
    const response = await send(active.access_token);
    if (response.status !== 401) return response;
    const renewed = await refreshSession();
    return renewed ? send(renewed.access_token) : response;
  }, [refreshSession]);

  return <AuthContext.Provider value={{ session, loading, configured: microhubAuthConfigured, signIn, signUp, signOut, confirm, authFetch }}>{children}</AuthContext.Provider>;
}

export function useMicrohubAuth(): MicrohubAuth {
  const value = useContext(AuthContext);
  if (!value) throw new Error("MicrohubAuthProvider no está disponible.");
  return value;
}
