"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { useMicrohubAuth } from "@/components/microhub-auth-provider";
import { BlogArticleBody } from "@/components/blog-article-body";
import { MAX_BLOG_IMAGE_SIZE, type BlogPost } from "@/lib/blog";

function SavedCover({ post }: { post: BlogPost }) {
  const { authFetch } = useMicrohubAuth();
  const [image, setImage] = useState("");
  useEffect(() => {
    if (!post.cover_image_path) return;
    let url = "";
    let active = true;
    const abort = new AbortController();
    void authFetch(`/api/admin/blog/cover?id=${post.id}`, { signal: abort.signal }).then(async (response) => {
      if (!response.ok) return;
      const blob = await response.blob();
      if (active) { url = URL.createObjectURL(blob); setImage(url); }
    }).catch(() => undefined);
    return () => { active = false; abort.abort(); if (url) URL.revokeObjectURL(url); };
  }, [authFetch, post.id, post.cover_image_path]);
  // eslint-disable-next-line @next/next/no-img-element -- blob privado, cargado con autorización.
  return image ? <img className="root-cover-preview" src={image} alt="Portada guardada" /> : null;
}

export function BlogPostForm({ post, onSaved, onCancel, canPublish = false }: { canPublish?: boolean; post: BlogPost | null; onSaved: (post: BlogPost) => void; onCancel: () => void }) {
  const { authFetch } = useMicrohubAuth();
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState("");
  const [preview, setPreview] = useState<{ title: string; excerpt: string; body: string; author: string } | null>(null);
  const [coverUrl, setCoverUrl] = useState("");
  const coverRef = useRef("");
  const formRef = useRef<HTMLFormElement>(null);
  useEffect(() => () => { if (coverRef.current) URL.revokeObjectURL(coverRef.current); }, []);

  function previewArticle() {
    if (!formRef.current) return;
    const data = new FormData(formRef.current);
    setPreview({ title: String(data.get("title") || "Sin título"), excerpt: String(data.get("excerpt") || ""), body: String(data.get("body") || ""), author: String(data.get("author_name") || "Microrealidades") });
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pending) return;
    const form = new FormData(event.currentTarget);
    const intent = (event.nativeEvent as SubmitEvent).submitter as HTMLButtonElement | null;
    form.set("publish", intent?.value === "publish" ? "true" : "false");
    if (post) { form.set("id", post.id); form.set("updated_at", post.updated_at); }
    setPending(true); setMessage("");
    try {
      const response = await authFetch("/api/admin/blog", { method: post ? "PUT" : "POST", body: form });
      const data = await response.json() as { post?: BlogPost; error?: string };
      if (!response.ok || !data.post) throw new Error(data.error || "No se pudo guardar la entrada.");
      onSaved(data.post);
    } catch (error) { setMessage(error instanceof Error ? error.message : "No se pudo guardar la entrada."); }
    finally { setPending(false); }
  }

  return <form ref={formRef} className="root-blog-form" onSubmit={submit} aria-busy={pending}>
    <fieldset disabled={pending}>
      <div className="root-form-grid">
        <label className="root-field-wide">Título<input name="title" required maxLength={180} defaultValue={post?.title ?? ""} /></label>
        <label>Categoría<select name="category" defaultValue={post?.category ?? "Psicología"}>{[...new Set(["Psicología","Tecnología","Comunalidad",...(post ? [post.category] : [])])].map((category)=><option key={category}>{category}</option>)}</select></label>
        <label>Ruta de la publicación <span>(opcional)</span><input name="slug" maxLength={180} defaultValue={post?.slug ?? ""} placeholder="Se genera a partir del título" autoCapitalize="none" spellCheck={false} /></label>
        <label className="root-field-wide">Resumen<textarea name="excerpt" required maxLength={320} rows={3} defaultValue={post?.excerpt ?? ""} /></label>
        <label className="root-field-wide">Contenido<textarea name="body" required maxLength={50000} rows={15} defaultValue={post?.body ?? ""} /><span>Separa los párrafos con una línea en blanco. Puedes escribir o pegar tu texto editorial.</span></label>
        <label>Autoría<input name="author_name" required maxLength={120} defaultValue={post?.author_name ?? "Microrealidades"} /></label>
        <label>Etiquetas <span>(separadas por coma)</span><input name="tags" maxLength={500} defaultValue={post?.tags.join(", ") ?? ""} /></label>
        <label>Color de la ficha<select name="color" defaultValue={post?.color ?? "pink"}><option value="pink">Rosa</option><option value="blue">Azul</option><option value="yellow">Amarillo</option></select></label>
        <label>Enlace original <span>(opcional)</span><input name="source_url" type="url" maxLength={600} defaultValue={post?.source_url ?? ""} placeholder="https://…" /></label>
        <label className="root-field-wide">Portada <span>(opcional · JPG, PNG o WebP · máximo 5 MB)</span><input name="coverImage" type="file" accept="image/jpeg,image/png,image/webp" onChange={(event) => {
          const file = event.currentTarget.files?.[0];
          if (file && (file.size > MAX_BLOG_IMAGE_SIZE || !["image/jpeg","image/png","image/webp"].includes(file.type))) { setMessage("Elige una portada JPG, PNG o WebP de hasta 5 MB."); event.currentTarget.value = ""; return; }
          if (coverRef.current) URL.revokeObjectURL(coverRef.current);
          coverRef.current = file ? URL.createObjectURL(file) : "";
          setCoverUrl(coverRef.current); setMessage("");
        }} /></label>
        {/* eslint-disable-next-line @next/next/no-img-element -- previsualización local temporal. */}
        {coverUrl ? <img className="root-cover-preview root-field-wide" src={coverUrl} alt="Vista previa de portada" /> : post?.cover_image_path ? <div className="root-field-wide"><SavedCover post={post} /><label className="root-checkbox"><input type="checkbox" name="removeCover" value="true" />Retirar la portada guardada</label></div> : null}
      </div>
      {message && <p className="super-battery-error" role="alert">{message}</p>}
      <div className="root-actions">
        <button className="publication-secondary-action" type="button" onClick={previewArticle}>Vista previa</button>
        <button className="publication-secondary-action" type="submit" name="intent" value="draft">{pending ? "Guardando…" : "Guardar borrador"}</button>
        {canPublish && <button className="publication-primary-action" type="submit" name="intent" value="publish">{post?.is_published ? "Actualizar publicación ↗" : "Publicar en el blog ↗"}</button>}
        {post && <button className="publication-quiet-action" type="button" onClick={onCancel}>Cancelar edición</button>}
      </div>
    </fieldset>
    {preview && <section className="publication-preview-paper root-article-preview" aria-label="Vista previa de entrada"><div className="publication-preview-topline"><span>Vista previa · sin publicar</span><button type="button" onClick={() => setPreview(null)}>Cerrar vista previa</button></div><h1>{preview.title}</h1><p>{preview.author}</p><p>{preview.excerpt}</p><BlogArticleBody body={preview.body} /></section>}
  </form>;
}
