import { requireRoot, RootAccessError } from "@/lib/root-access";
import { findAdminBlog } from "@/lib/blog-repository";
import { BLOG_IMAGE_BUCKET, blogImageMime } from "@/lib/blog";
import { supabaseStorageDownload } from "@/lib/supabase-rest";

export async function GET(request: Request) {
  try {
    await requireRoot(request);
    const id = new URL(request.url).searchParams.get("id") ?? "";
    if (!/^[a-f0-9-]{36}$/i.test(id)) return new Response(null, { status: 404 });
    const post = await findAdminBlog(id);
    const type = blogImageMime(post?.cover_image_path ?? null);
    if (!type || !post?.cover_image_path) return new Response(null, { status: 404 });
    return new Response(await supabaseStorageDownload(`${BLOG_IMAGE_BUCKET}/${post.cover_image_path}`), { headers: { "Content-Type": type, "Cache-Control": "private, no-store", "X-Content-Type-Options": "nosniff" } });
  } catch (error) { return Response.json({ error: error instanceof RootAccessError ? error.message : "No se pudo cargar la portada." }, { status: error instanceof RootAccessError ? error.status : 503 }); }
}
