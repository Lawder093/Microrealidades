import { PublicationEditor } from "@/components/publication-editor";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import Link from "next/link";
import { featuredBlog, listPublicBlog } from "@/lib/blog-repository";
import { type BlogSummary } from "@/lib/blog";
import { PublicationCards } from "@/components/publication-cards";

export const metadata = {
  title: "Publicaciones — Microrealidades",
  description: "Notas, conversaciones y herramientas para pensar las realidades que habitamos.",
};

export const dynamic = "force-dynamic";

export default async function PublicationsPage({ searchParams }: { searchParams: Promise<{ pagina?: string; q?: string; categoria?: string }> }) {
  const params = await searchParams;
  const page = Math.max(1, Math.min(10000, Math.floor(Number(params.pagina) || 1)));
  let posts: BlogSummary[] = [];
  let hasMore = false;
  let unavailable = false;
  const query = typeof params.q === "string" ? params.q.slice(0, 80) : "";
  const categories = ["Psicología", "Tecnología", "Comunalidad"];
  const category = categories.includes(params.categoria ?? "") ? params.categoria! : "";
  let featured: BlogSummary[] = [];
  try {
    const [result, highlighted] = await Promise.all([listPublicBlog(page, { query, category }), !query && !category && page === 1 ? featuredBlog() : Promise.resolve([])]);
    posts = result.posts; hasMore = result.hasMore; featured = highlighted;
  }
  catch { unavailable = true; }
  const pageLink = (number: number) => `/publicaciones?${new URLSearchParams({ pagina: String(number), ...(query ? {q:query} : {}), ...(category ? {categoria:category} : {}) })}#archivo-editorial`;
  return (
    <main className="inner-page publications-page">
      <SiteHeader compact />
      <section className="page-intro" aria-labelledby="publications-title">
        <p className="section-label">[ 03 ] &nbsp; Publicaciones</p>
        <h1 id="publications-title">Pensar en<br /><em>voz alta.</em></h1>
        <p>Un espacio editorial para compartir notas de campo, conversaciones y herramientas que acompañen otros procesos.</p>
      </section>
      {featured.length > 0 && <section className="publication-section" aria-label="Artículos destacados"><div className="publication-list"><p className="section-label">Destacados</p><PublicationCards posts={featured} /></div></section>}
      <section id="archivo-editorial" className="publication-section" aria-label="Publicaciones">
        <div className="publication-list">
          <form className="editorial-filters" action="/publicaciones" method="get"><label>Buscar publicaciones<input type="search" name="q" maxLength={80} defaultValue={query} /></label><label>Categoría<select name="categoria" defaultValue={category}><option value="">Todas</option>{categories.map((name) => <option key={name}>{name}</option>)}</select></label><button className="section-link">Buscar ↗</button></form>
          <Link prefetch={false} className="section-link" href="/publicaciones/gestor">Gestor editorial ↗</Link>
          {unavailable ? <p className="blog-empty" role="status">No pudimos cargar el archivo editorial. Inténtalo de nuevo más tarde.</p> : posts.length ? <PublicationCards posts={posts} offset={(page - 1) * 12} /> : <p className="blog-empty">{query || category ? "No encontramos publicaciones con esos filtros." : "Todavía no hay entradas publicadas. Este espacio está listo para las próximas historias de Microrealidades."}</p>}
          {!unavailable && (page > 1 || hasMore) && <div className="blog-pagination" aria-label="Paginación de publicaciones">{page > 1 && <Link prefetch={false} className="section-link" href={pageLink(page-1)}>← Anterior</Link>}<span>Página {page}</span>{hasMore && <Link prefetch={false} className="section-link" href={pageLink(page+1)}>Siguiente →</Link>}</div>}
        </div>
      </section>
      <PublicationEditor />
      <SiteFooter />
    </main>
  );
}
