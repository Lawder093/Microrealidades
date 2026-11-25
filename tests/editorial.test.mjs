import assert from "node:assert/strict";
import test, { after } from "node:test";
import { createServer } from "vite";
import { fileURLToPath } from "node:url";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";

process.env.NEXT_PUBLIC_SUPABASE_URL = "https://editorial-test.invalid";
process.env.SUPABASE_SECRET_KEY = "qa-service-not-real";
const root = fileURLToPath(new URL("..", import.meta.url));
const vite = await createServer({ appType: "custom", configFile: false, root, resolve: { alias: { "@": root } }, server: { middlewareMode: true } });
after(() => vite.close());
const { validateBlogInput, validateBlogImage, blogSlug } = await vite.ssrLoadModule("/lib/blog.ts");
const { requireRoot } = await vite.ssrLoadModule("/lib/root-access.ts");
const { supabaseStorageUpload } = await vite.ssrLoadModule("/lib/supabase-rest.ts");
const { BlogArticleBody } = await vite.ssrLoadModule("/components/blog-article-body.tsx");
const input = { title: "Psicología y comunidad", slug: "", excerpt: "Un resumen de prueba.", body: "Primer párrafo.\n\nSegundo párrafo.", category: "Notas de campo", author_name: "Microrealidades", tags: "comunidad, comunidad, psicología", source_url: "", color: "pink" };

test("editorial data keeps valid routes and rejects invalid fields without truncation", () => {
  const post = validateBlogInput(input);
  assert.equal(post.slug, "psicologia-y-comunidad");
  assert.deepEqual(post.tags, ["comunidad", "psicología"]);
  assert.equal(blogSlug("  Un TÍTULO: en comunidad  "), "un-titulo-en-comunidad");
  for (const slug of ["gestor", "autores"]) assert.throws(() => validateBlogInput({ ...input, slug }));
  for (const override of [{ body: "" }, { title: "a".repeat(181) }, { excerpt: "a".repeat(321) }, { tags: Array.from({ length: 13 }, (_, i) => `tag-${i}`).join(",") }, { color: "purple" }]) assert.throws(() => validateBlogInput({ ...input, ...override }));
});

test("editorial links cannot inject scripts, credential URLs or relative external redirects", () => {
  for (const source_url of ["javascript:alert(1)", "data:text/html,test", "//external.invalid", "https://user:password@example.invalid", "/relative"]) assert.throws(() => validateBlogInput({ ...input, source_url }));
  assert.equal(validateBlogInput({ ...input, source_url: "https://example.invalid/article" }).source_url, "https://example.invalid/article");
});

test("covers require matching file signatures and exclude renamed HTML and SVG", () => {
  assert.equal(validateBlogImage(new Uint8Array([255,216,255,0]), "image/jpeg"), "jpg");
  assert.equal(validateBlogImage(new Uint8Array([137,80,78,71,13,10,26,10]), "image/png"), "png");
  assert.throws(() => validateBlogImage(new TextEncoder().encode("<svg onload=alert(1)>"), "image/png"));
  assert.throws(() => validateBlogImage(new Uint8Array([255,216,255]), "image/webp"));
  assert.throws(() => validateBlogImage(new Uint8Array(5 * 1024 * 1024 + 1), "image/jpeg"));
});

test("article rendering treats HTML and scripts as ordinary text", () => {
  const html = renderToStaticMarkup(React.createElement(BlogArticleBody, { body: '<script>alert("qa")</script>\n\n<img src=x onerror=alert(1)>' }));
  assert.doesNotMatch(html, /<script>|<img/);
  assert.match(html, /&lt;script&gt;/);
  assert.equal((html.match(/<p>/g) ?? []).length, 2);
});

test("root permission is verified on the server and cannot come from email or signup metadata", async () => {
  const originalFetch = globalThis.fetch;
  let permitted = false;
  let userValid = true;
  let rolesUnavailable = false;
  const requests = [];
  globalThis.fetch = async (url) => {
    requests.push(String(url));
    if (String(url).endsWith("/auth/v1/user")) return Response.json(userValid ? { id: "qa-root", email: "root@example.invalid", user_metadata: { is_super_root: true } } : {}, { status: userValid ? 200 : 401 });
    if (rolesUnavailable) return Response.json({ code: "42P01" }, { status: 404 });
    return Response.json(permitted ? [{ user_id: "qa-root" }] : []);
  };
  const request = () => new Request("https://app.invalid/api/admin/blog", { headers: { Authorization: "Bearer qa-token" } });
  try {
    await assert.rejects(requireRoot(new Request("https://app.invalid/api/admin/blog")), { status: 401 });
    assert.equal(requests.length, 0);
    await assert.rejects(requireRoot(request()), { status: 403 });
    permitted = true;
    assert.equal((await requireRoot(request())).id, "qa-root");
    permitted = false;
    await assert.rejects(requireRoot(request()), { status: 403 });
    rolesUnavailable = true;
    await assert.rejects(requireRoot(request()), { status: 503 });
    userValid = false;
    await assert.rejects(requireRoot(request()), { status: 401 });
  } finally { globalThis.fetch = originalFetch; }
});

test("editorial image uploads preserve the existing PDF storage defaults", async () => {
  const originalFetch = globalThis.fetch;
  const uploads = [];
  globalThis.fetch = async (url, init) => { uploads.push({ url, headers: init.headers }); return Response.json({}); };
  try {
    await supabaseStorageUpload("evaluaciones-pdf/qa.pdf", new Uint8Array([37,80,68,70]));
    await supabaseStorageUpload("microrealidades-editorial/covers/qa.png", new Uint8Array([137,80,78,71]), "image/png", false);
    assert.equal(uploads[0].headers["Content-Type"], "application/pdf");
    assert.equal(uploads[0].headers["x-upsert"], "true");
    assert.equal(uploads[1].headers["Content-Type"], "image/png");
    assert.equal(uploads[1].headers["x-upsert"], "false");
  } finally { globalThis.fetch = originalFetch; }
});
