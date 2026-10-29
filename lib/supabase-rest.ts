const supabaseUrl = process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL;
// Acepta el nombre legacy y el nombre recomendado para no obligar a duplicar
// la misma llave en Vercel. Ambos deben permanecer exclusivamente en servidor.
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.SUPABASE_SECRET_KEY;

export function supabaseIsConfigured() {
  return Boolean(supabaseUrl && supabaseKey);
}

export function supabaseConfigurationError() {
  if (!supabaseUrl) return "Falta SUPABASE_URL o NEXT_PUBLIC_SUPABASE_URL en las variables del servidor.";
  if (!supabaseKey) return "Falta SUPABASE_SECRET_KEY o SUPABASE_SERVICE_ROLE_KEY en las variables del servidor de Vercel.";
  return null;
}

function getSupabaseConfig() {
  const configurationError = supabaseConfigurationError();
  if (configurationError || !supabaseUrl || !supabaseKey) throw new Error(configurationError ?? "Supabase no está configurado en el entorno del servidor.");
  return { url: supabaseUrl, key: supabaseKey };
}

export async function supabaseRest<T>(path: string, init: RequestInit = {}) {
  const { url, key } = getSupabaseConfig();
  const response = await fetch(`${url}/rest/v1/${path}`, {
    ...init,
    headers: {
      apikey: key,
      Authorization: `Bearer ${key}`,
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
  const { url, key } = getSupabaseConfig();
  const response = await fetch(`${url}/auth/v1/user`, { headers: { apikey: key, Authorization: `Bearer ${accessToken}` }, cache: "no-store" });
  if (!response.ok) return null;
  return response.json() as Promise<{ id: string; email?: string }>;
}

export async function supabaseStorageUpload(path: string, body: BodyInit) {
  const { url, key } = getSupabaseConfig();
  const response = await fetch(`${url}/storage/v1/object/${path}`, { method: "POST", headers: { apikey: key, Authorization: `Bearer ${key}`, "Content-Type": "application/pdf", "x-upsert": "true" }, body, cache: "no-store" });
  if (!response.ok) throw new Error(`Storage respondió ${response.status}.`);
}

export { supabaseUrl };
