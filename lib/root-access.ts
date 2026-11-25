import { supabaseIsConfigured, supabaseRest, supabaseUser } from "@/lib/supabase-rest";

export class RootAccessError extends Error {
  constructor(message: string, public readonly status: number) { super(message); }
}
export type RootUser = { id: string; email?: string };

export async function requireRoot(request: Request): Promise<RootUser> {
  const token = /^Bearer\s+(.+)$/i.exec(request.headers.get("authorization") ?? "")?.[1];
  if (!token) throw new RootAccessError("Inicia sesión para continuar.", 401);
  if (!supabaseIsConfigured()) throw new RootAccessError("El panel editorial aún no está configurado.", 503);
  let user: RootUser | null;
  try { user = await supabaseUser(token); }
  catch { throw new RootAccessError("No se pudo verificar la sesión. Inténtalo de nuevo.", 503); }
  if (!user) throw new RootAccessError("Tu sesión expiró. Inicia sesión de nuevo.", 401);
  // Siempre verificar en servidor. Ningún correo ni user_metadata otorgan privilegios.
  let rows: Array<{ user_id: string }>;
  try { rows = await supabaseRest<Array<{ user_id: string }>>(`microhub_admins?user_id=eq.${encodeURIComponent(user.id)}&is_super_root=eq.true&is_active=eq.true&select=user_id&limit=1`); }
  catch { throw new RootAccessError("Falta preparar los permisos editoriales. Ejecuta el SQL de instalación de Microhub.", 503); }
  if (!rows.length) throw new RootAccessError("Esta cuenta no tiene acceso al panel super root.", 403);
  return user;
}
