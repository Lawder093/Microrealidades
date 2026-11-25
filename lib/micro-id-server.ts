import { supabaseUser } from "@/lib/supabase-rest";

export class AccessError extends Error {
  constructor(message: string, public readonly status = 403) { super(message); }
}

export function requestToken(request: Request): string {
  const token = /^Bearer\s+(.+)$/i.exec(request.headers.get("authorization") ?? "")?.[1];
  if (!token) throw new AccessError("Inicia sesión para continuar.", 401);
  return token;
}

// Las solicitudes profesionales viajan con el JWT del usuario para aplicar RLS.
export async function identityRest<T>(token: string, path: string, init: RequestInit = {}): Promise<T> {
  const url = process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) throw new AccessError("MicroID aún no está configurado.", 503);
  let response: Response;
  try {
    response = await fetch(`${url}/rest/v1/${path}`, {
      ...init,
      headers: { apikey: key, Authorization: `Bearer ${token}`, "Content-Type": "application/json", ...init.headers },
      cache: "no-store",
    });
  } catch { throw new AccessError("No se pudo conectar con MicroID.", 503); }
  if (!response.ok) {
    const detail = await response.json().catch(() => ({})) as { message?: string; code?: string };
    if (response.status === 404) throw new AccessError("El ecosistema necesita sus migraciones de preparación.", 503);
    throw new AccessError(detail.message ?? "Operación no autorizada.", response.status === 401 ? 401 : response.status === 409 ? 409 : 403);
  }
  const text = await response.text();
  return (text ? JSON.parse(text) : null) as T;
}

export async function identityRpc<T>(token: string, name: string, body: Record<string, unknown> = {}): Promise<T> {
  return identityRest<T>(token, `rpc/${name}`, { method: "POST", body: JSON.stringify(body) });
}

export async function identityUser(request: Request) {
  const token = requestToken(request);
  const user = await supabaseUser(token);
  if (!user) throw new AccessError("Tu sesión expiró.", 401);
  return { token, user };
}

export function accessFailure(error: unknown): Response {
  return Response.json({ error: error instanceof Error ? error.message : "No se pudo completar la operación." }, {
    status: error instanceof AccessError ? error.status : 500,
    headers: { "Cache-Control": "no-store" },
  });
}
