import { supabaseRest } from "@/lib/supabase-rest";
import { BLOG_PAGE_SIZE, type BlogPost, type BlogSummary } from "@/lib/blog";

export class BlogUnavailableError extends Error {}
// La lectura pública usa la llave pública y RLS; la llave del servidor se reserva al panel.
async function publicRest<T>(path: string): Promise<T> {
  const url = process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) throw new BlogUnavailableError("Publicaciones aún no está disponible.");
  try {
    const response = await fetch(`${url}/rest/v1/${path}`, { headers: { apikey: key }, cache: "no-store" });
    if (!response.ok) throw new Error();
    return await response.json() as T;
  } catch { throw new BlogUnavailableError("No pudimos cargar las publicaciones. Inténtalo de nuevo más tarde."); }
}

function visibleQuery(): string { return `is_published=eq.true&is_archived=eq.false&published_at=lte.${encodeURIComponent(new Date().toISOString())}`; }

export async function listPublicBlog(page = 1): Promise<{ posts: BlogSummary[]; hasMore: boolean }> {
  const rows = await publicRest<Array<Omit<BlogSummary, "has_cover"> & { cover_image_path: string | null }>>(`blog_posts?${visibleQuery()}&select=id,slug,title,excerpt,category,author_name,tags,source_url,color,is_published,published_at,created_at,cover_image_path&order=published_at.desc,id.desc&limit=${BLOG_PAGE_SIZE + 1}&offset=${(page - 1) * BLOG_PAGE_SIZE}`);
  return { posts: rows.slice(0, BLOG_PAGE_SIZE).map(({ cover_image_path, ...post }) => ({ ...post, has_cover: Boolean(cover_image_path) })), hasMore: rows.length > BLOG_PAGE_SIZE };
}

export async function findPublicBlog(slug: string): Promise<BlogPost | null> {
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug) || slug.length > 180) return null;
  const rows = await publicRest<BlogPost[]>(`blog_posts?${visibleQuery()}&slug=eq.${encodeURIComponent(slug)}&select=id,slug,title,excerpt,body,category,author_name,tags,source_url,cover_image_path,color,is_published,published_at,is_archived,created_at,updated_at&limit=1`);
  return rows[0] ?? null;
}

export async function findPublicCover(id: string): Promise<Pick<BlogPost, "id" | "cover_image_path"> | null> {
  const rows = await publicRest<Array<Pick<BlogPost, "id" | "cover_image_path">>>(`blog_posts?${visibleQuery()}&id=eq.${encodeURIComponent(id)}&select=id,cover_image_path&limit=1`);
  return rows[0] ?? null;
}

export async function findAdminBlog(id: string): Promise<BlogPost | null> {
  const rows = await supabaseRest<BlogPost[]>(`blog_posts?id=eq.${encodeURIComponent(id)}&select=*&limit=1`);
  return rows[0] ?? null;
}
