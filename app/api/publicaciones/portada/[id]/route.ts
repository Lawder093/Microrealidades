import { findPublicCover } from "@/lib/blog-repository";
import { BLOG_IMAGE_BUCKET, blogImageMime } from "@/lib/blog";
import { supabaseStorageDownload } from "@/lib/supabase-rest";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    if (!/^[a-f0-9-]{36}$/i.test(id)) return new Response(null, { status: 404 });
    // Los borradores, archivos huérfanos y entradas archivadas nunca entregan portadas públicas.
    const post = await findPublicCover(id);
    const type = blogImageMime(post?.cover_image_path ?? null);
    if (!type || !post?.cover_image_path) return new Response(null, { status: 404 });
    return new Response(await supabaseStorageDownload(`${BLOG_IMAGE_BUCKET}/${post.cover_image_path}`), { headers: { "Content-Type": type, "Cache-Control": "no-store", "X-Content-Type-Options": "nosniff" } });
  } catch { return new Response(null, { status: 503 }); }
}
