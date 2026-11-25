import Link from "next/link";
import { notFound } from "next/navigation";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { PublicationCards } from "@/components/publication-cards";
import { listPublicBlog, publicAuthor } from "@/lib/blog-repository";

export const dynamic = "force-dynamic";
export const metadata = { title: "Autoría — Microrealidades" };

export default async function AuthorPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ pagina?: string }>;
}) {
  const { id } = await params;
  const { pagina } = await searchParams;
  const page = Math.max(1, Math.min(10000, Math.floor(Number(pagina) || 1)));
  let author;
  let result;
  try {
    [author, result] = await Promise.all([
      publicAuthor(id),
      listPublicBlog(page, { authorId: id }),
    ]);
  } catch {
    return (
      <main className="inner-page">
        <SiteHeader compact />
        <section className="hub-section">
          <p>No pudimos cargar este perfil. Inténtalo de nuevo más tarde.</p>
          <Link className="section-link" href="/publicaciones">
            Publicaciones ↗
          </Link>
        </section>
        <SiteFooter />
      </main>
    );
  }
  if (!author) notFound();
  return (
    <main className="inner-page publications-page">
      <SiteHeader compact />
      <section className="page-intro">
        <p className="section-label">Autoría</p>
        <h1>{author.display_name}</h1>
        <p>{author.bio}</p>
        <Link className="section-link" href="/publicaciones">
          Volver a Publicaciones ↗
        </Link>
      </section>
      <section className="publication-section">
        <div className="publication-list">
          <PublicationCards posts={result.posts} offset={(page - 1) * 12} />
          {!result.posts.length && <p>No hay publicaciones disponibles.</p>}
          <nav className="blog-pagination" aria-label="Paginación">
            {page > 1 && (
              <Link className="section-link" href={`?pagina=${page - 1}`}>
                ← Anterior
              </Link>
            )}
            {result.hasMore && (
              <Link className="section-link" href={`?pagina=${page + 1}`}>
                Siguiente →
              </Link>
            )}
          </nav>
        </div>
      </section>
      <SiteFooter />
    </main>
  );
}
