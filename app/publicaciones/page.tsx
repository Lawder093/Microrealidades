import { PublicationEditor } from "@/components/publication-editor";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import Link from "next/link";
import { listPublicBlog } from "@/lib/blog-repository";
import { blogDate, type BlogSummary } from "@/lib/blog";

export const metadata = {
  title: "Publicaciones — Microrealidades",
  description: "Notas, conversaciones y herramientas para pensar las realidades que habitamos.",
};

export const dynamic = "force-dynamic";

export default async function PublicationsPage({ searchParams }: { searchParams: Promise<{ pagina?: string }> }) {
  const params = await searchParams;
  const page = Math.max(1, Math.min(10000, Math.floor(Number(params.pagina) || 1)));
  let posts: BlogSummary[] = [];
  let hasMore = false;
  let unavailable = false;
  try { const result = await listPublicBlog(page); posts = result.posts; hasMore = result.hasMore; }
  catch { unavailable = true; }
  return (
    <main className="inner-page publications-page">
      <SiteHeader compact />
      <section className="page-intro" aria-labelledby="publications-title">
        <p className="section-label">[ 03 ] &nbsp; Publicaciones</p>
        <h1 id="publications-title">Pensar en<br /><em>voz alta.</em></h1>
        <p>Un espacio editorial para compartir notas de campo, conversaciones y herramientas que acompañen otros procesos.</p>
      </section>
      <section id="archivo-editorial" className="publication-section" aria-label="Publicaciones">
        <div className="publication-list">
          {unavailable ? <p className="blog-empty" role="status">No pudimos cargar el archivo editorial. Inténtalo de nuevo más tarde.</p> : posts.length ? posts.map((publication, index) => (
            <Link prefetch={false} href={`/publicaciones/${publication.slug}`} className={`publication-card ${publication.color}`} key={publication.id}>
              <div className="publication-meta"><span>{String((page - 1) * 12 + index + 1).padStart(2,"0")}</span><span>{publication.category}</span></div>
              <h2>{publication.title}</h2><p>{publication.excerpt}</p><small>{blogDate(publication.published_at)}</small>
            </Link>
          )) : <p className="blog-empty">Todavía no hay entradas publicadas. Este espacio está listo para las próximas historias de Microrealidades.</p>}
          {!unavailable && (page > 1 || hasMore) && <div className="blog-pagination" aria-label="Paginación de publicaciones">{page > 1 && <Link prefetch={false} className="section-link" href={`/publicaciones?pagina=${page - 1}#archivo-editorial`}>← Anterior</Link>}<span>Página {page}</span>{hasMore && <Link prefetch={false} className="section-link" href={`/publicaciones?pagina=${page + 1}#archivo-editorial`}>Siguiente →</Link>}</div>}
        </div>
      </section>
      <PublicationEditor />
      <SiteFooter />
    </main>
  );
}
