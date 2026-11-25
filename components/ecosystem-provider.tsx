"use client";

import {
  createContext,
  useContext,
  useEffect,
  useCallback,
  useState,
  type ReactNode,
} from "react";
import { useMicrohubAuth } from "@/components/microhub-auth-provider";
import type { EcosystemContext } from "@/lib/ecosystem";

type EcosystemState = {
  data: EcosystemContext | null;
  loading: boolean;
  error: string;
  workspaceId: string;
  selectWorkspace: (id: string) => void;
  reload: () => Promise<void>;
  workspaceFetch: (url: string, init?: RequestInit) => Promise<Response>;
};
const Context = createContext<EcosystemState | null>(null);

export function EcosystemProvider({ children }: { children: ReactNode }) {
  const { session, loading: authLoading, authFetch } = useMicrohubAuth();
  const [context, setContext] = useState<{
    userId: string;
    data: EcosystemContext;
  } | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [selected, setSelected] = useState<{
    userId: string;
    id: string;
  } | null>(null);
  const data =
    session && context?.userId === session.user.id ? context.data : null;
  const workspaceId =
    data?.workspaces.find(
      (entry) =>
        entry.id === selected?.id && selected.userId === session?.user.id,
    )?.id ??
    data?.workspaces[0]?.id ??
    "";

  const reload = useCallback(async () => {
    if (!session) return;
    setLoading(true);
    try {
      const response = await authFetch("/api/ecosystem");
      const value = (await response.json()) as EcosystemContext & {
        error?: string;
      };
      if (!response.ok)
        throw new Error(value.error || "No se pudo cargar MicroHub.");
      setContext({ userId: session.user.id, data: value });
      setError("");
      try {
        const saved = localStorage.getItem(
          `microhub:workspace:${session.user.id}`,
        );
        if (saved) setSelected({ userId: session.user.id, id: saved });
      } catch {
        /* La selección puede funcionar en memoria. */
      }
    } catch (failure) {
      setContext(null);
      setError(
        failure instanceof Error
          ? failure.message
          : "No se pudo cargar MicroHub.",
      );
    } finally {
      setLoading(false);
    }
  }, [authFetch, session]);

  useEffect(() => {
    if (!session) return;
    const initial = window.setTimeout(() => {
      void reload();
    }, 0);
    const interval = window.setInterval(() => {
      if (document.visibilityState === "visible") void reload();
    }, 60000);
    return () => {
      clearTimeout(initial);
      clearInterval(interval);
    };
  }, [session, reload]);

  function selectWorkspace(id: string) {
    if (!session || !data?.workspaces.some((entry) => entry.id === id)) return;
    setSelected({ userId: session.user.id, id });
    try {
      localStorage.setItem(`microhub:workspace:${session.user.id}`, id);
    } catch {
      /* Mantener la selección en memoria. */
    }
  }
  const workspaceFetch = useCallback(
    (url: string, init: RequestInit = {}) => {
      const headers = new Headers(init.headers);
      if (workspaceId) headers.set("X-Microhub-Workspace", workspaceId);
      return authFetch(url, { ...init, headers });
    },
    [workspaceId, authFetch],
  );

  return (
    <Context.Provider
      value={{
        data,
        loading: authLoading || loading || Boolean(session && !data && !error),
        error,
        workspaceId,
        selectWorkspace,
        reload,
        workspaceFetch,
      }}
    >
      {children}
    </Context.Provider>
  );
}

export function useEcosystem(): EcosystemState {
  const context = useContext(Context);
  if (!context) throw new Error("EcosystemProvider no está disponible.");
  return context;
}
