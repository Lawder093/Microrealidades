// Se reutiliza la API de Supabase Auth del proyecto, sin incorporar otro SDK.
export type MicrohubUser = { id: string; email?: string; user_metadata?: { display_name?: string } };
export type MicrohubSession = { access_token: string; refresh_token: string; expires_at: number; user: MicrohubUser };
type AuthResponse = Partial<MicrohubSession> & { expires_in?: number; msg?: string; message?: string; error_description?: string; error_code?: string; code?: string };

const authUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const publicKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
export const microhubAuthConfigured = Boolean(authUrl && publicKey);
// Una sesión de otro proyecto Supabase nunca se reutiliza por accidente.
export const microhubSessionKey = `microrealidades:microhub:auth:${authUrl ?? "unconfigured"}`;

export function readMicrohubUser(value: unknown): MicrohubUser | null {
  if (!value || typeof value !== "object") return null;
  const user = value as MicrohubUser;
  if (typeof user.id !== "string" || !user.id) return null;
  return {
    id: user.id,
    ...(typeof user.email === "string" ? { email: user.email } : {}),
    ...(typeof user.user_metadata?.display_name === "string" ? { user_metadata: { display_name: user.user_metadata.display_name } } : {}),
  };
}

export function microhubReturnPath(value: string | null): string {
  if (!value || /[\\\u0000-\u001f]/.test(value)) return "/microhub";
  try {
    const url = new URL(value, "https://microhub.local");
    if (url.origin !== "https://microhub.local" || !(url.pathname === "/microhub" || url.pathname.startsWith("/microhub/"))) return "/microhub";
    return `${url.pathname}${url.search}${url.hash}`;
  } catch { return "/microhub"; }
}

export function readMicrohubSession(value: unknown): MicrohubSession | null {
  if (!value || typeof value !== "object") return null;
  const data = value as AuthResponse;
  const user = readMicrohubUser(data.user);
  if (typeof data.access_token !== "string" || !data.access_token || typeof data.refresh_token !== "string" || !data.refresh_token || !user) return null;
  const expiresAt = typeof data.expires_at === "number" ? data.expires_at : Date.now() / 1000 + (data.expires_in ?? 3600);
  if (!Number.isFinite(expiresAt)) return null;
  return { access_token: data.access_token, refresh_token: data.refresh_token, expires_at: expiresAt, user };
}

export class MicrohubAuthError extends Error {
  constructor(message: string, public readonly status: number) { super(message); }
}

export async function microhubAuthRequest(path: string, body?: Record<string, unknown>, token?: string): Promise<AuthResponse> {
  if (!authUrl || !publicKey) throw new MicrohubAuthError("El acceso a Microhub aún no está configurado. Intenta más tarde.", 503);
  let response: Response;
  try {
    response = await fetch(`${authUrl}/auth/v1/${path}`, {
      method: body ? "POST" : "GET",
      headers: { apikey: publicKey, "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      ...(body ? { body: JSON.stringify(body) } : {}), cache: "no-store",
    });
  } catch { throw new MicrohubAuthError("No pudimos conectar. Revisa tu conexión e inténtalo de nuevo.", 0); }
  const data = await response.json().catch(() => ({})) as AuthResponse;
  if (!response.ok) {
    const code = data.error_code ?? data.code;
    const errors: Record<string, string> = {
      invalid_credentials: "Correo o contraseña incorrectos.",
      email_not_confirmed: "Confirma tu correo antes de iniciar sesión. Revisa también la carpeta de spam.",
      signup_disabled: "El registro no está disponible por el momento. Intenta más tarde.",
      email_address_not_authorized: "Por el momento no podemos enviar el correo de confirmación. Intenta más tarde.",
      over_email_send_rate_limit: "Se alcanzó el límite de envío de correos. Espera unos minutos antes de reintentarlo.",
      user_already_exists: "Si ya tienes una cuenta, inicia sesión con tu correo.",
      weak_password: "Elige una contraseña más segura, de al menos 8 caracteres.",
    };
    throw new MicrohubAuthError(errors[code ?? ""] ?? (response.status === 429 ? "Demasiados intentos. Espera unos minutos." : "No se pudo completar el acceso. Verifica tus datos e inténtalo de nuevo."), response.status);
  }
  return data;
}
