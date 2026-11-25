"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { useMicrohubAuth } from "@/components/microhub-auth-provider";
import { BlogPostForm } from "@/components/admin/blog-post-form";
import { blogDate, type BlogPost } from "@/lib/blog";

export function RootDashboard() {
  const { session, authFetch, signOut } = useMicrohubAuth();
  const [canPublish,setCanPublish] = useState(false);
  const [access, setAccess] = useState<"loading" | "allowed" | "denied" | "error">("loading");
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [editing, setEditing] = useState<BlogPost | null>(null);
  const [formVersion, setFormVersion] = useState(0);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);
  const editor = useRef<HTMLElement>(null);

  const load = useCallback(async (pageNumber: number) => {
    const response = await authFetch(`/api/admin/blog?page=${pageNumber}`);
    const value = await response.json() as { posts?: BlogPost[]; hasMore?: boolean; error?: string };
    if (!response.ok) throw new Error(value.error || "No se pudieron cargar las entradas.");
    setPosts(value.posts ?? []); setHasMore(Boolean(value.hasMore)); setPage(pageNumber);
  }, [authFetch]);

  useEffect(() => {
    let active = true;
    void (async () => {
      try {
        const response = await authFetch("/api/admin/access");
        const value = await response.json() as { canWrite?: boolean; canPublish?: boolean; error?: string };
        if (!active) return;
        if (!response.ok || !value.canWrite) { setAccess(response.status === 403 || response.status === 401 ? "denied" : "error"); setError(value.error || "No se pudo verificar el acceso."); return; }
        setCanPublish(Boolean(value.canPublish));
        await load(1);
        if (active) setAccess("allowed");
      } catch (failure) { if (active) { setAccess("error"); setError(failure instanceof Error ? failure.message : "No se pudo cargar el panel."); } }
    })();
    return () => { active = false; };
  }, [authFetch, load, session?.user.id]);

  async function refresh(pageNumber = page) {
    setPending(true); setError("");
    try { await load(pageNumber); } catch (failure) { setError(failure instanceof Error ? failure.message : "No se pudo actualizar la lista."); }
    finally { setPending(false); }
  }

  async function update(post: BlogPost, action: "publish" | "unpublish" | "archive" | "restore" | "review" | "feature") {
    if (pending) return;
    setPending(true); setMessage(""); setError("");
    try {
      const response = await authFetch("/api/admin/blog", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: post.id, updated_at: post.updated_at, action }) });
      const value = await response.json() as { error?: string };
      if (!response.ok) throw new Error(value.error || "No se pudo actualizar la entrada.");
      if (editing?.id === post.id) { setEditing(null); setFormVersion((version) => version + 1); }
      await load(page);
      setMessage(action === "publish" ? "Entrada publicada." : action === "archive" ? "Entrada archivada; puedes restaurarla desde esta lista." : action === "restore" ? "Entrada restaurada como borrador." : action === "review" ? "Entrada enviada a revisión." : action === "feature" ? "Destacado actualizado." : "Entrada retirada del blog público.");
    } catch (failure) { setError(failure instanceof Error ? failure.message : "No se pudo actualizar la entrada."); }
    finally { setPending(false); }
  }

  if (access === "loading") return <section className="hub-section" aria-busy="true"><p>Preparando tu dashboard…</p></section>;
  if (access !== "allowed") return <section className="hub-section"><div className="hub-section-heading"><p className="section-label">Acceso restringido</p><h2>{access === "denied" ? "Un espacio" : "Preparando el panel"} <em>{access === "denied" ? "privado." : "editorial."}</em></h2><p role="alert">{error}</p><Link prefetch={false} className="super-battery-action" href="/microhub">Volver a Microhub ↗</Link>{access === "error" && <button className="super-battery-action" type="button" onClick={() => window.location.reload()}>Reintentar ↻</button>}</div></section>;

  return <section className="root-dashboard hub-section">
    <div className="root-dashboard-heading"><div><p className="section-label">Microrealidades · Gestor editorial</p><h1>Tu espacio <em>editorial.</em></h1><p>Crea, revisa y publica en Microrealidades.</p></div><div className="root-actions"><Link prefetch={false} className="super-battery-small-action" href="/publicaciones">Ver Publicaciones ↗</Link><Link prefetch={false} className="super-battery-small-action" href="/microhub">Microhub ↗</Link><button className="super-battery-small-action" type="button" onClick={() => void signOut()}>Cerrar sesión</button></div></div>
    <section ref={editor} className="root-editor" aria-labelledby="root-editor-title"><p className="section-label">{editing ? "Editar entrada" : "Nueva entrada"}</p><h2 id="root-editor-title">{editing ? "Continuar" : "Escribir para"} <em>{editing ? "la historia." : "la comunidad."}</em></h2><BlogPostForm canPublish={canPublish} key={`${editing?.id ?? "new"}-${formVersion}`} post={editing} onCancel={() => { setEditing(null); setFormVersion((version) => version + 1); }} onSaved={(post) => { setEditing(null); setFormVersion((version) => version + 1); setMessage(post.is_published ? "Publicación disponible en /publicaciones." : "Borrador guardado en Supabase."); void refresh(1); }} /></section>
    <section className="root-posts" aria-labelledby="root-posts-title"><div className="root-posts-heading"><div><p className="section-label">Archivo editorial</p><h2 id="root-posts-title">Entradas <em>guardadas.</em></h2></div><button className="super-battery-small-action" type="button" disabled={pending} onClick={() => void refresh()}>Actualizar ↻</button></div>
      <p className="root-status" role="status">{message}</p>{error && <p className="super-battery-error" role="alert">{error}</p>}
      {posts.length ? <div className="root-post-list">{posts.map((post) => <article key={post.id} className="root-post-row"><div><p className="section-label">{post.is_archived ? "Archivada" : post.is_published ? "Publicada" : post.review_status==="review" ? "En revisión" : "Borrador"} · {post.category} · {blogDate(post.published_at || post.created_at)}</p><h3>{post.title}</h3><p className="root-post-slug">/publicaciones/{post.slug}</p></div><div className="root-actions">{!post.is_archived && <><button className="super-battery-small-action" type="button" disabled={pending || (!canPublish && post.is_published)} onClick={() => { setEditing(post); setFormVersion((version) => version + 1); editor.current?.scrollIntoView({ behavior: "instant", block: "start" }); }}>Editar</button>{canPublish && <button className="super-battery-small-action" type="button" disabled={pending} onClick={() => void update(post, post.is_published ? "unpublish" : "publish")}>{post.is_published ? "Despublicar" : "Publicar"}</button>}{canPublish && post.is_published && <button className="super-battery-small-action" disabled={pending} onClick={() => void update(post,"feature")}>{post.featured?"Quitar destacado":"Destacar"}</button>}{!post.is_published && !post.is_archived && <button className="super-battery-small-action" disabled={pending || post.review_status==="review"} onClick={() => void update(post,"review")}>{post.review_status==="review"?"En revisión":"Enviar a revisión"}</button>}{post.is_published && <Link prefetch={false} className="super-battery-small-action" href={`/publicaciones/${post.slug}`}>Ver entrada ↗</Link>}</>}<button className="super-battery-small-action" type="button" disabled={pending || (!canPublish && post.is_published)} onClick={() => void update(post, post.is_archived ? "restore" : "archive")}>{post.is_archived ? "Restaurar" : "Archivar"}</button></div></article>)}</div> : <p>No hay entradas todavía. Guarda tu primer borrador arriba.</p>}
      {(page > 1 || hasMore) && <div className="root-actions" aria-label="Paginación del archivo"><button className="super-battery-small-action" type="button" disabled={pending || page === 1} onClick={() => void refresh(page - 1)}>Anterior</button><span>Página {page}</span><button className="super-battery-small-action" type="button" disabled={pending || !hasMore} onClick={() => void refresh(page + 1)}>Siguiente</button></div>}
    </section>
  </section>;
}
