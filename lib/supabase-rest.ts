const supabaseUrl = process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

export function supabaseIsConfigured() {
  return Boolean(supabaseUrl && supabaseKey);
}

export async function supabaseRest<T>(path: string, init: RequestInit = {}) {
  if (!supabaseUrl || !supabaseKey) throw new Error("Supabase no está configurado en el entorno del servidor.");
  const response = await fetch(`${supabaseUrl}/rest/v1/${path}`, {
    ...init,
    headers: {
      apikey: supabaseKey,
      Authorization: `Bearer ${supabaseKey}`,
      "Content-Type": "application/json",
      ...(init.headers ?? {}),
    },
    cache: "no-store",
  });
  if (!response.ok) throw new Error(`Supabase respondió ${response.status}.`);
  const text = await response.text();
  return (text ? JSON.parse(text) : null) as T;
}

export async function supabaseUser(accessToken: string) {
  if (!supabaseUrl || !supabaseKey) throw new Error("Supabase no está configurado en el entorno del servidor.");
  const response = await fetch(`${supabaseUrl}/auth/v1/user`, { headers: { apikey: supabaseKey, Authorization: `Bearer ${accessToken}` }, cache: "no-store" });
  if (!response.ok) return null;
  return response.json() as Promise<{ id: string; email?: string }>;
}

export async function supabaseStorageUpload(path: string, body: BodyInit) {
  if (!supabaseUrl || !supabaseKey) throw new Error("Supabase no está configurado en el entorno del servidor.");
  const response = await fetch(`${supabaseUrl}/storage/v1/object/${path}`, { method: "POST", headers: { apikey: supabaseKey, Authorization: `Bearer ${supabaseKey}`, "Content-Type": "application/pdf", "x-upsert": "true" }, body, cache: "no-store" });
  if (!response.ok) throw new Error(`Storage respondió ${response.status}.`);
}

export { supabaseUrl };
