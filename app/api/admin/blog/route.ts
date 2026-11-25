import { revalidatePath } from "next/cache";
import { requireRoot, RootAccessError } from "@/lib/root-access";
import { BLOG_IMAGE_BUCKET, BlogValidationError, MAX_BLOG_IMAGE_SIZE, validateBlogImage, validateBlogInput, type BlogPost } from "@/lib/blog";
import { findAdminBlog } from "@/lib/blog-repository";
import { SupabaseRestError, supabaseRest, supabaseStorageRemove, supabaseStorageUpload } from "@/lib/supabase-rest";

export const dynamic = "force-dynamic";
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function json(data: unknown, status = 200): Response { return Response.json(data, { status, headers: { "Cache-Control": "no-store" } }); }
function failure(error: unknown): Response {
  if (error instanceof RootAccessError) return json({ error: error.message }, error.status);
  if (error instanceof BlogValidationError) return json({ error: error.message }, 400);
  if (error instanceof SupabaseRestError && error.code === "23505") return json({ error: "Ya existe una publicación con esa ruta. Elige otra." }, 409);
  if (error instanceof SupabaseRestError && error.status === 404) return json({ error: "El espacio editorial no está instalado. Ejecuta el SQL de instalación de Microhub." }, 503);
  return json({ error: "No se pudo guardar el cambio. Revisa la conexión e inténtalo de nuevo." }, 500);
}
function invalidate(previous?: string, current?: string): void {
  revalidatePath("/publicaciones");
  if (previous) revalidatePath(`/publicaciones/${previous}`);
  if (current && current !== previous) revalidatePath(`/publicaciones/${current}`);
}

export async function GET(request: Request) {
  try {
    await requireRoot(request);
    const params = new URL(request.url).searchParams;
    const page = Math.max(1, Math.min(10000, Number(params.get("page")) || 1));
    const posts = await supabaseRest<BlogPost[]>(`blog_posts?select=*&order=created_at.desc,id.desc&limit=26&offset=${(Math.floor(page) - 1) * 25}`);
    return json({ posts: posts.slice(0,25), hasMore: posts.length > 25 });
  } catch (error) { return failure(error); }
}

async function save(request: Request, editing: boolean): Promise<Response> {
  let uploadedPath: string | null = null;
  let committed = false;
  try {
    const user = await requireRoot(request);
    const declaredSize = Number(request.headers.get("content-length"));
    if (Number.isFinite(declaredSize) && declaredSize > MAX_BLOG_IMAGE_SIZE + 300000) throw new BlogValidationError("La portada debe pesar hasta 5 MB.");
    let form: FormData;
    try { form = await request.formData(); } catch { throw new BlogValidationError("No se pudo leer el formulario."); }
    const id = form.get("id");
    if (editing && (typeof id !== "string" || !UUID.test(id))) throw new BlogValidationError("Identificador de publicación inválido.");
    const current = editing ? await findAdminBlog(String(id)) : null;
    if (editing && !current) return json({ error: "No encontramos esa publicación." }, 404);
    const input = validateBlogInput(Object.fromEntries(form.entries()));
    const publish = form.get("publish");
    if (publish !== "true" && publish !== "false") throw new BlogValidationError("Elige guardar un borrador o publicar.");
    if (current?.is_archived) throw new BlogValidationError("Restaura la entrada antes de editarla.");
    if (current && form.get("updated_at") !== current.updated_at) return json({ error: "La entrada cambió en otra pestaña. Recárgala antes de guardar." }, 409);
    const file = form.get("coverImage");
    let coverPath = current?.cover_image_path ?? null;
    if (file instanceof File && file.size > 0) {
      if (file.size > MAX_BLOG_IMAGE_SIZE) throw new BlogValidationError("La portada debe pesar hasta 5 MB.");
      const bytes = new Uint8Array(await file.arrayBuffer());
      const extension = validateBlogImage(bytes, file.type);
      uploadedPath = `covers/${crypto.randomUUID()}.${extension}`;
      try { await supabaseStorageUpload(`${BLOG_IMAGE_BUCKET}/${uploadedPath}`, bytes, file.type, false); }
      catch { throw new BlogValidationError("No se pudo subir la portada. Comprueba que el almacenamiento editorial esté instalado e inténtalo de nuevo."); }
      coverPath = uploadedPath;
    } else if (form.get("removeCover") === "true") { coverPath = null; }
    const isPublished = publish === "true";
    const record = { ...input, cover_image_path: coverPath, is_published: isPublished, published_at: isPublished ? current?.published_at ?? new Date().toISOString() : null, updated_by: user.id };
    // El updated_at en el filtro evita sobrescribir una edición concurrente.
    const path = editing ? `blog_posts?id=eq.${id}&updated_at=eq.${encodeURIComponent(current!.updated_at)}` : "blog_posts";
    const posts = await supabaseRest<BlogPost[]>(path, { method: editing ? "PATCH" : "POST", headers: { Prefer: "return=representation" }, body: JSON.stringify(editing ? record : { ...record, created_by: user.id }) });
    if (!posts[0]) return json({ error: "La entrada cambió. Recárgala antes de guardar." }, 409);
    committed = true;
    // El archivo antiguo se conserva: otros lectores podrían tenerlo abierto.
    invalidate(current?.slug, posts[0].slug);
    return json({ post: posts[0], message: isPublished ? "Publicación disponible en el blog." : "Borrador guardado en tu panel." }, editing ? 200 : 201);
  } catch (error) { return failure(error); }
  finally {
    // Si falla la escritura, retirar solamente el archivo nuevo de esta solicitud.
    if (uploadedPath && !committed) await supabaseStorageRemove(BLOG_IMAGE_BUCKET, uploadedPath).catch(() => undefined);
  }
}

export async function POST(request: Request) { return save(request, false); }
export async function PUT(request: Request) { return save(request, true); }

export async function PATCH(request: Request) {
  try {
    const user = await requireRoot(request);
    let value: unknown;
    try { value = await request.json(); } catch { throw new BlogValidationError("Solicitud inválida."); }
    if (!value || typeof value !== "object") throw new BlogValidationError("Solicitud inválida.");
    const body = value as Record<string, unknown>;
    if (typeof body.id !== "string" || !UUID.test(body.id)) throw new BlogValidationError("Identificador inválido.");
    const current = await findAdminBlog(body.id);
    if (!current) return json({ error: "No encontramos esa publicación." }, 404);
    if (typeof body.updated_at !== "string" || body.updated_at !== current.updated_at) return json({ error: "La entrada cambió en otra pestaña. Actualiza la lista." }, 409);
    const now = new Date().toISOString();
    let change: Partial<BlogPost>;
    if (body.action === "publish" && !current.is_archived) change = { is_published: true, published_at: current.published_at ?? now };
    else if (body.action === "unpublish") change = { is_published: false, published_at: null };
    else if (body.action === "archive") change = { is_archived: true, is_published: false, published_at: null };
    else if (body.action === "restore") change = { is_archived: false, is_published: false, published_at: null };
    else throw new BlogValidationError("Acción no disponible para esta entrada.");
    const posts = await supabaseRest<BlogPost[]>(`blog_posts?id=eq.${body.id}&updated_at=eq.${encodeURIComponent(current.updated_at)}`, { method: "PATCH", headers: { Prefer: "return=representation" }, body: JSON.stringify({ ...change, updated_by: user.id }) });
    if (!posts[0]) return json({ error: "La entrada cambió. Actualiza la lista." }, 409);
    invalidate(current.slug);
    return json({ post: posts[0], message: "Entrada actualizada." });
  } catch (error) { return failure(error); }
}
