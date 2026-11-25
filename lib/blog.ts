// Contrato editorial compartido. El contenido se guarda como texto, nunca como HTML ejecutable.
export type BlogColor = "pink" | "blue" | "yellow";
export type BlogPost = {
  id: string; slug: string; title: string; excerpt: string; body: string; category: string;
  author_name: string; tags: string[]; source_url: string | null; cover_image_path: string | null;
  color: BlogColor; is_published: boolean; published_at: string | null; is_archived: boolean;
  author_user_id: string | null; review_status: "draft" | "review" | "published" | "withdrawn"; featured: boolean;
  created_at: string; updated_at: string;
};
export type BlogSummary = Omit<BlogPost, "body" | "cover_image_path" | "is_archived" | "updated_at"> & { has_cover: boolean };
export type BlogInput = Pick<BlogPost, "slug" | "title" | "excerpt" | "body" | "category" | "author_name" | "tags" | "source_url" | "color">;
export const BLOG_PAGE_SIZE = 12;
export const BLOG_IMAGE_BUCKET = "microrealidades-editorial";
export const MAX_BLOG_IMAGE_SIZE = 5 * 1024 * 1024;

export class BlogValidationError extends Error {}

export function blogSlug(value: string): string {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 180).replace(/-$/, "");
}

function field(value: unknown, label: string, max: number, required = true): string {
  if (typeof value !== "string") { if (!required && value == null) return ""; throw new BlogValidationError(`Revisa el campo ${label}.`); }
  const clean = value.trim();
  if ((required && !clean) || clean.length > max) throw new BlogValidationError(`${label}: ${required ? "completa el campo y usa" : "usa"} hasta ${max} caracteres.`);
  return clean;
}

export function validateBlogInput(value: Record<string, unknown>): BlogInput {
  const title = field(value.title, "Título", 180);
  const slug = blogSlug(field(value.slug, "Ruta", 180, false) || title);
  if (!slug) throw new BlogValidationError("Escribe una ruta con letras o números.");
  const source = field(value.source_url, "Enlace original", 600, false);
  if (source) {
    try { const url = new URL(source); if (!/^https?:$/.test(url.protocol) || url.username || url.password) throw new Error(); }
    catch { throw new BlogValidationError("El enlace original debe ser una dirección http o https válida."); }
  }
  const rawTags = field(value.tags, "Etiquetas", 500, false);
  const tags = [...new Set(rawTags.split(",").map((tag) => tag.trim()).filter(Boolean))];
  if (tags.length > 12 || tags.some((tag) => tag.length > 60)) throw new BlogValidationError("Usa hasta 12 etiquetas, de 60 caracteres cada una.");
  const color = value.color ?? "pink";
  if (color !== "pink" && color !== "blue" && color !== "yellow") throw new BlogValidationError("Elige uno de los colores disponibles.");
  return { title, slug, excerpt: field(value.excerpt, "Resumen", 320), body: field(value.body, "Contenido", 50000), category: field(value.category, "Categoría", 80), author_name: field(value.author_name, "Autoría", 120), tags, source_url: source || null, color };
}

export function blogDate(value: string | null): string {
  return value ? new Intl.DateTimeFormat("es-MX", { day: "2-digit", month: "short", year: "numeric", timeZone: "UTC" }).format(new Date(value)) : "Sin publicar";
}

export function blogParagraphs(body: string): string[] { return body.split(/\n\s*\n/).map((part) => part.trim()).filter(Boolean); }

export function blogImageMime(path: string | null): string | null {
  if (!path || !/^covers\/[a-f0-9-]+\.(jpg|png|webp)$/.test(path)) return null;
  return path.endsWith(".jpg") ? "image/jpeg" : path.endsWith(".png") ? "image/png" : "image/webp";
}

export function validateBlogImage(bytes: Uint8Array, declaredType: string): "jpg" | "png" | "webp" {
  if (!bytes.length || bytes.length > MAX_BLOG_IMAGE_SIZE) throw new BlogValidationError("La portada debe pesar entre 1 byte y 5 MB.");
  const jpeg = bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;
  const png = [137,80,78,71,13,10,26,10].every((byte, index) => bytes[index] === byte);
  const webp = new TextDecoder().decode(bytes.slice(0,4)) === "RIFF" && new TextDecoder().decode(bytes.slice(8,12)) === "WEBP";
  if (declaredType === "image/jpeg" && jpeg) return "jpg";
  if (declaredType === "image/png" && png) return "png";
  if (declaredType === "image/webp" && webp) return "webp";
  throw new BlogValidationError("Usa una imagen JPG, PNG o WebP válida. No se aceptan SVG ni archivos renombrados.");
}
