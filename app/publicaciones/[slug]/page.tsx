import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { cache } from "react";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { BlogArticleBody } from "@/components/blog-article-body";
import { blogDate } from "@/lib/blog";
import { findPublicBlog } from "@/lib/blog-repository";

export const dynamic = "force-dynamic";
const loadPost = cache(findPublicBlog);

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  try {
    const post = await loadPost(slug);
    return post ? { title: `${post.title} — Microrealidades`, description: post.excerpt, openGraph: { title: post.title, description: post.excerpt, type: "article", publishedTime: post.published_at ?? undefined, authors: [post.author_name] } } : { title: "Publicación no encontrada", robots: { index: false, follow: false } };
  } catch { return { title: "Publicaciones — Microrealidades", robots: { index: false, follow: false } }; }
}

export default async function PostPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  let post;
  try { post = await loadPost(slug); }
  catch { return <main className="inner-page"><SiteHeader compact /><section className="hub-section"><div className="hub-section-heading"><h2>Volvemos en <em>un momento.</em></h2><p>No pudimos cargar esta publicación. Inténtalo de nuevo más tarde.</p><Link prefetch={false} className="section-link" href="/publicaciones">Volver a Publicaciones ↗</Link></div></section><SiteFooter /></main>; }
  if (!post) notFound();
  return <main className="inner-page publications-page"><SiteHeader compact /><section className="blog-reading-section"><article className="publication-preview-paper blog-reading-paper"><Link prefetch={false} className="back-link" href="/publicaciones">↖ Volver a Publicaciones</Link><p className="publication-preview-type">{post.category} · {blogDate(post.published_at)}</p><h1>{post.title}</h1><p className="publication-preview-byline">{post.author_user_id ? <Link href={`/publicaciones/autores/${post.author_user_id}`}>{post.author_name}</Link> : post.author_name}</p><p className="blog-reading-excerpt">{post.excerpt}</p>
    {/* eslint-disable-next-line @next/next/no-img-element -- ruta propia con autorización de visibilidad en servidor. */}
    {post.cover_image_path && <img className="blog-reading-cover" src={`/api/publicaciones/portada/${post.id}`} alt={`Portada de ${post.title}`} />}
    <BlogArticleBody body={post.body} />
    {post.tags.length > 0 && <ul className="blog-tags" aria-label="Etiquetas">{post.tags.map((tag) => <li key={tag}>{tag}</li>)}</ul>}
    {post.source_url && <a className="section-link" href={post.source_url} rel="noreferrer noopener" target="_blank">Ver fuente original ↗</a>}
  </article></section><SiteFooter /></main>;
}
