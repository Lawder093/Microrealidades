// Ejecutar sobre un Next build con las variables ficticias indicadas en docs/ecosystem-core.md.
import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { createHash } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";
import {
  evaluationGateway,
  QA_SERVICE_KEY,
  QA_PUBLIC_KEY,
  QA_PASSWORD,
} from "../tests/ecosystem-gateway.mjs";

const app = "http://127.0.0.1:4882",
  output = process.env.E2E_OUTPUT ?? "/private/tmp/ecosystem-core-e2e";
await mkdir(output, { recursive: true });
const gateway = await evaluationGateway();
const log = [];
const server = spawn(
  process.execPath,
  [
    "node_modules/next/dist/bin/next",
    "start",
    "--hostname",
    "127.0.0.1",
    "--port",
    "4882",
  ],
  {
    env: {
      ...process.env,
      NEXT_PUBLIC_SUPABASE_URL: gateway.origin,
      NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: QA_PUBLIC_KEY,
      SUPABASE_SECRET_KEY: QA_SERVICE_KEY,
    },
    stdio: ["ignore", "pipe", "pipe"],
  },
);
server.stdout.on("data", (bytes) => log.push(bytes.toString()));
server.stderr.on("data", (bytes) => log.push(bytes.toString()));
const report = { checks: [], browsers: [], testDataOnly: true };
const liveBrowsers = [];
const check = (name) => {
  report.checks.push(name);
  process.stdout.write(`OK ${name}\n`);
};
const headers = (session, workspace) => ({
  Authorization: `Bearer ${session.access_token}`,
  ...(workspace ? { "X-Microhub-Workspace": workspace } : {}),
});
async function call(
  path,
  session,
  body,
  workspace,
  method = body ? "POST" : "GET",
) {
  const response = await fetch(`${app}${path}`, {
    method,
    headers: {
      ...headers(session ?? { access_token: "" }, workspace),
      "Content-Type": "application/json",
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
  const value = await response.json();
  assert.ok(
    response.ok,
    `${path}: ${response.status} ${JSON.stringify(value)}`,
  );
  return value;
}
try {
  let ready = false;
  for (let attempt = 0; attempt < 150; attempt++) {
    try {
      const r = await fetch(`${app}/ingresar`);
      if (r.ok) {
        ready = true;
        break;
      }
    } catch {}
    if (server.exitCode !== null)
      throw new Error(`Next failed: ${log.join("")}`);
    await new Promise((done) => setTimeout(done, 200));
  }
  assert.ok(ready, "Next server available");
  const root = await gateway.session(gateway.ids.root),
    professional = await gateway.session(gateway.ids.professional),
    other = await gateway.session(gateway.ids.other),
    author = await gateway.session(gateway.ids.registered);
  const command = (action, data) =>
    call("/api/ecosystem/admin", root, { action, data });
  assert.equal((await fetch(`${app}/api/ecosystem/admin`)).status, 401);
  const a = await command("organization.create", { name: "Institución QA A" }),
    b = await command("organization.create", { name: "Institución QA B" });
  await command("membership.set", {
    organization_id: a.id,
    workspace_id: a.workspace_id,
    email: "professional@example.invalid",
    role: "professional",
  });
  await command("membership.set", {
    organization_id: b.id,
    workspace_id: b.workspace_id,
    email: "other@example.invalid",
    role: "professional",
  });
  const pkg = await command("package.save", {
    name: "Paquete QA",
    modules: ["microtalento"],
  });
  const service = await command("contract.create", {
    organization_id: a.id,
    package_id: pkg.id,
    kind: "paid",
    amount: "1500.00",
    currency: "MXN",
    reference: "QA-EXTERNAL-001",
  });
  await command("contract.create", {
    organization_id: b.id,
    kind: "trial",
    modules: ["microtalento"],
  });
  assert.equal(
    (await call("/api/ecosystem", professional)).access.find(
      (e) =>
        e.workspace_id === a.workspace_id && e.module_id === "microtalento",
    ).allowed,
    true,
  );
  assert.equal(
    (
      await fetch(`${app}/api/evaluaciones/recruiter`, {
        headers: headers(other, a.workspace_id),
      })
    ).status,
    403,
  );
  assert.equal(
    (
      await fetch(`${app}/api/evaluaciones/recruiter`, {
        headers: headers(root, a.workspace_id),
      })
    ).status,
    403,
  );
  check("API: permisos, pago externo, paquete y aislamiento institucional");
  await command("contract.update", { id: service.id, status: "suspended" });
  assert.equal(
    (
      await fetch(`${app}/api/evaluaciones/recruiter`, {
        headers: headers(professional, a.workspace_id),
      })
    ).status,
    403,
  );
  await command("contract.update", { id: service.id, status: "active" });
  check("API: suspensión y reactivación inmediata");
  await command("role.set", {
    email: "registered@example.invalid",
    role: "author",
  });
  await command("role.set", { email: "other@example.invalid", role: "editor" });
  assert.deepEqual(await call("/api/admin/access", author), {
    canWrite: true,
    canPublish: false,
  });
  const form = new FormData();
  for (const [key, value] of Object.entries({
    title: "Psicología en comunidad QA",
    slug: "psicologia-comunidad-qa",
    excerpt: "Resumen ficticio",
    body: "Artículo ficticio para verificar el flujo editorial.\n\nSegundo párrafo.",
    category: "Psicología",
    author_name: "Autor QA",
    tags: "comunidad",
    source_url: "",
    color: "pink",
    publish: "false",
  }))
    form.set(key, value);
  const saved = await fetch(`${app}/api/admin/blog`, {
    method: "POST",
    headers: headers(author),
    body: form,
  });
  const created = await saved.json();
  assert.ok(saved.ok, JSON.stringify(created));
  const review = await call(
    "/api/admin/blog",
    author,
    {
      id: created.post.id,
      updated_at: created.post.updated_at,
      action: "review",
    },
    undefined,
    "PATCH",
  );
  assert.equal(
    (await fetch(`${app}/publicaciones/${created.post.slug}`)).status,
    404,
  );
  const denied = await fetch(`${app}/api/admin/blog`, {
    method: "PATCH",
    headers: { ...headers(author), "Content-Type": "application/json" },
    body: JSON.stringify({
      id: created.post.id,
      updated_at: review.post.updated_at,
      action: "publish",
    }),
  });
  assert.equal(denied.status, 403);
  const published = await call(
    "/api/admin/blog",
    other,
    {
      id: created.post.id,
      updated_at: review.post.updated_at,
      action: "publish",
    },
    undefined,
    "PATCH",
  );
  await call(
    "/api/admin/blog",
    other,
    {
      id: created.post.id,
      updated_at: published.post.updated_at,
      action: "feature",
    },
    undefined,
    "PATCH",
  );
  for (const path of [
    "/publicaciones?q=comunidad&categoria=Psicolog%C3%ADa",
    `/publicaciones/${created.post.slug}`,
    `/publicaciones/autores/${gateway.ids.registered}`,
  ])
    assert.equal((await fetch(`${app}${path}`)).status, 200, path);
  check(
    "Editorial: autor sin contrato, borrador, revisión, publicación, destacado, búsqueda y perfil público",
  );
  const invite = await call("/api/ecosystem/admin", root, {
    action: "invitation.create",
    data: {
      email: "registered@example.invalid",
      role: "professional",
      organization_id: a.id,
      workspace_id: a.workspace_id,
    },
    emailDelivery: true,
  });
  const token = new URL(invite.link).searchParams.get("token");
  await call("/api/ecosystem/admin", author, { token }, undefined, "PATCH");
  assert.equal(gateway.mail.at(-1).type, "otp");
  assert.equal(
    (
      await fetch(`${app}/api/ecosystem/admin`, {
        method: "PATCH",
        headers: { ...headers(author), "Content-Type": "application/json" },
        body: JSON.stringify({ token }),
      })
    ).status,
    403,
  );
  check(
    "Invitación: correo simulado, identidad coincidente y token de un solo uso",
  );

  if (!process.env.E2E_PLAYWRIGHT_PATH)
    throw new Error("E2E_PLAYWRIGHT_PATH es necesario para comprobar la UI.");
  const { chromium, webkit } = await import(
    pathToFileURL(resolve(process.env.E2E_PLAYWRIGHT_PATH, "index.mjs")).href
  );
  const browser = await chromium.launch({
    headless: true,
    executablePath:
      process.env.E2E_CHROME ??
      "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
    args: ["--no-sandbox"],
  });
  liveBrowsers.push(browser);
  const errors = [];
  const recruiter = await browser.newContext({
    viewport: { width: 1440, height: 1000 },
    reducedMotion: "reduce",
  });
  const page = await recruiter.newPage();
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto(`${app}/ingresar?next=/microhub/evaluaciones`);
  await page
    .getByLabel("Correo electrónico")
    .fill("professional@example.invalid");
  await page.getByLabel("Contraseña", { exact: true }).fill(QA_PASSWORD);
  await page.getByRole("button", { name: /Iniciar sesión/ }).click();
  await page.getByRole("heading", { name: /Configurar una batería/ }).waitFor();
  await page
    .getByLabel("Nombre", { exact: true })
    .fill("Prueba 01 · QA ficticia");
  assert.equal(
    await page.locator(".super-battery-test-toggle input:checked").count(),
    7,
  );
  await page.getByRole("button", { name: /Crear batería/ }).click();
  await page
    .getByRole("button", { name: /Generar liga para candidato/ })
    .first()
    .waitFor();
  await page
    .getByRole("button", { name: /Generar liga para candidato/ })
    .first()
    .click();
  const share = page.getByLabel("Liga para el candidato", { exact: true });
  await share.waitFor();
  const link = await share.inputValue();
  assert.match(link, /\/evaluacion\/IB-\d+\?t=[a-f0-9-]+$/);
  await page.screenshot({
    path: `${output}/microtalento-desktop.png`,
    fullPage: true,
  });
  const code = new URL(link).pathname.split("/").at(-1),
    secret = new URL(link).searchParams.get("t");
  const missing = await fetch(`${app}/api/evaluaciones/sesion`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action: "start", code, name: "QA", age: 30 }),
  });
  assert.equal(missing.status, 403);
  const candidate = await browser.newContext({
    viewport: { width: 390, height: 844 },
    isMobile: true,
    hasTouch: true,
    reducedMotion: "reduce",
  });
  const screen = await candidate.newPage();
  screen.on("pageerror", (error) => errors.push(error.message));
  await screen.goto(link);
  await screen
    .getByLabel("Nombre", { exact: true })
    .fill("Candidatura QA ficticia");
  await screen.getByLabel("Edad", { exact: true }).fill("30");
  await screen.getByLabel("Empresa a la que aplicas").fill("Institución QA A");
  await screen.screenshot({
    path: `${output}/candidato-formulario-390.png`,
    fullPage: true,
  });
  await screen.getByRole("button", { name: /Comenzar evaluación/ }).click();
  await screen.locator(".super-battery-dimension article").first().waitFor();
  const active = (
    await gateway.db.query(
      "select id from sesiones_evaluacion where codigo=$1",
      [code],
    )
  ).rows[0];
  const stolen = await fetch(`${app}/api/evaluaciones/sesion`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      action: "start",
      code,
      accessToken: secret,
      name: "Otro",
      age: 30,
    }),
  });
  assert.equal(stolen.status, 409);
  let count = 0;
  for (let index = 0; index < 7; index++) {
    const articles = screen.locator(".super-battery-dimension article"),
      items = await articles.count();
    assert.equal(items, index === 0 ? 24 : 30);
    for (let item = 0; item < items; item++) {
      const options = articles.nth(item).locator("label");
      await options.nth(item % (await options.count())).click();
      count++;
    }
    assert.equal(
      await screen.evaluate(
        () => document.documentElement.scrollWidth > innerWidth,
      ),
      false,
    );
    if (index === 0)
      await screen.screenshot({
        path: `${output}/candidato-test-390.png`,
        fullPage: false,
      });
    await screen
      .getByRole("button", {
        name: index < 6 ? /Terminar prueba y descansar/ : /Enviar batería/,
      })
      .click();
    if (index < 6) {
      await screen.getByRole("heading", { name: /Toma un descanso/ }).waitFor();
      await screen.getByRole("button", { name: /Continuar/ }).click();
    }
  }
  await screen
    .getByRole("heading", { name: /Gracias por participar/ })
    .waitFor();
  assert.equal(count, 204);
  const completed = (
    await gateway.db.query("select * from sesiones_evaluacion where id=$1", [
      active.id,
    ])
  ).rows[0];
  assert.equal(completed.estado, "completado");
  assert.equal(Object.keys(completed.respuestas).length, 204);
  assert.equal(
    completed.resultados.clinicalResult.resultadosPorPrueba.length,
    7,
  );
  assert.equal(completed.pdf_hash.length, 64);
  await page
    .getByRole("button", { name: /Actualizar/ })
    .last()
    .click();
  await page
    .getByRole("button", { name: /Ver resultados/ })
    .first()
    .waitFor();
  await page
    .getByRole("button", { name: /Ver resultados/ })
    .first()
    .click();
  await page.getByText("Resultado individual", { exact: true }).waitFor();
  const download = page.waitForEvent("download");
  await page
    .getByRole("button", { name: /Descargar PDF/ })
    .first()
    .click();
  await (await download).saveAs(`${output}/reporte-qa.pdf`);
  const bytes = gateway.objects.get(completed.pdf_path)?.bytes;
  assert.ok(bytes);
  assert.equal(bytes.subarray(0, 4).toString(), "%PDF");
  assert.equal(
    createHash("sha256").update(bytes).digest("hex"),
    completed.pdf_hash,
  );
  const pdfResponse = await fetch(
    `${app}/api/evaluaciones/pdf?sessionId=${completed.id}`,
    { headers: headers(professional, a.workspace_id) },
  );
  assert.equal(pdfResponse.status, 200);
  assert.deepEqual(Buffer.from(await pdfResponse.arrayBuffer()), bytes);
  assert.equal(
    (
      await fetch(`${app}/api/evaluaciones/pdf?sessionId=${completed.id}`, {
        headers: headers(other, b.workspace_id),
      })
    ).status,
    404,
  );
  assert.equal(errors.length, 0, JSON.stringify(errors));
  check(
    "Chrome móvil/escritorio: crear batería, copiar liga, formulario anónimo, 204 respuestas, 6 descansos, resultados y PDF privado",
  );
  report.browsers.push({
    name: "Chrome",
    mobileWidth: 390,
    items: count,
    consoleErrors: errors,
  });
  const identityContext = await browser.newContext({
    viewport: { width: 390, height: 844 },
  });
  const account = await identityContext.newPage();
  account.on("pageerror", (error) => errors.push(error.message));
  await account.goto(`${app}/registro?next=/micro-id`);
  await account.getByLabel("Nombre", { exact: true }).fill("Cuenta QA nueva");
  await account.getByLabel("Correo electrónico").fill("new-qa@example.invalid");
  await account.getByLabel("Contraseña", { exact: true }).fill(QA_PASSWORD);
  await account
    .getByLabel("Confirmar contraseña", { exact: true })
    .fill(QA_PASSWORD);
  await account.getByRole("button", { name: /Crear cuenta/ }).click();
  await account.getByLabel("Nombre público", { exact: true }).waitFor();
  await account
    .getByLabel("Nombre público", { exact: true })
    .fill("Nombre público QA");
  await account
    .getByLabel("Presentación pública")
    .fill("Biografía ficticia de pruebas.");
  await account
    .getByRole("button", { name: "Guardar perfil", exact: true })
    .click();
  await account.getByText("Perfil actualizado.", { exact: true }).waitFor();
  await account.goto(`${app}/microhub`);
  await account
    .getByText("Tu espacio, Nombre público QA.", { exact: true })
    .waitFor();
  await account.goto(`${app}/micro-id`);
  await account
    .getByRole("button", { name: "Cerrar todas las sesiones", exact: true })
    .click();
  await account
    .getByRole("link", { name: /Iniciar sesión/ })
    .last()
    .waitFor();
  await account.goto(`${app}/micro-id/recuperar`);
  await account.getByLabel("Correo electrónico").fill("new-qa@example.invalid");
  await account
    .getByRole("button", { name: "Enviar enlace de recuperación" })
    .click();
  await account.getByText(/Si el correo está registrado/).waitFor();
  assert.equal(gateway.mail.at(-1).type, "recover");
  const newUser = (
    await gateway.db.query(
      "select id from auth.users where email='new-qa@example.invalid'",
    )
  ).rows[0];
  const recovery = await gateway.session(newUser.id);
  await account.goto(
    `${app}/micro-id/recuperar#refresh_token=${recovery.refresh_token}&type=recovery`,
  );
  await account.getByLabel("Nueva contraseña", { exact: true }).waitFor();
  await account
    .getByLabel("Nueva contraseña", { exact: true })
    .fill("Otra-prueba-002!");
  await account
    .getByLabel("Confirmar contraseña", { exact: true })
    .fill("Otra-prueba-002!");
  await account.getByRole("button", { name: "Actualizar contraseña" }).click();
  await account.getByText(/Contraseña actualizada/).waitFor();
  assert.equal(gateway.mail.at(-1).type, "password-change");
  assert.equal(new URL(account.url()).hash, "");
  check(
    "MicroID en navegador: registro, perfil, navegación compartida, cierre global y recuperación simulada",
  );
  assert.equal(errors.length, 0, JSON.stringify(errors));
  await identityContext.close();
  await candidate.close();
  await recruiter.close();
  await browser.close();
  try {
    const safari = await webkit.launch({ headless: true });
    liveBrowsers.push(safari);
    const context = await safari.newContext({
      viewport: { width: 390, height: 844 },
      isMobile: true,
      hasTouch: true,
    });
    const tab = await context.newPage();
    const safariErrors = [];
    tab.on("pageerror", (error) => safariErrors.push(error.message));
    await tab.goto(`${app}/ingresar`);
    await tab.getByLabel("Correo electrónico").fill("root@example.invalid");
    await tab.getByLabel("Contraseña", { exact: true }).fill(QA_PASSWORD);
    await tab.getByRole("button", { name: /Iniciar sesión/ }).click();
    await tab.getByRole("link", { name: /MicroAdmin/ }).waitFor();
    await tab.getByRole("link", { name: /MicroAdmin/ }).click();
    await tab
      .getByRole("heading", { name: /Administrar el ecosistema/ })
      .waitFor();
    const institutionForm = tab
      .locator(".ecosystem-admin-form")
      .filter({
        has: tab.getByRole("heading", {
          name: "Crear institución",
          exact: true,
        }),
      });
    await institutionForm
      .getByLabel("Nombre", { exact: true })
      .fill("Institución QA desde WebKit");
    await institutionForm
      .getByRole("button", { name: "Guardar", exact: true })
      .click();
    await tab
      .getByRole("heading", {
        name: "Institución QA desde WebKit",
        exact: true,
      })
      .waitFor();
    assert.equal(
      await tab.evaluate(
        () => document.documentElement.scrollWidth > innerWidth,
      ),
      false,
    );
    await tab.screenshot({
      path: `${output}/microadmin-webkit-390.png`,
      fullPage: true,
    });
    assert.equal(safariErrors.length, 0, JSON.stringify(safariErrors));
    report.browsers.push({
      name: "WebKit",
      mobileWidth: 390,
      consoleErrors: safariErrors,
    });
    check("WebKit: inicio de sesión compartido y MicroAdmin a 390 px");
    await safari.close();
  } catch (error) {
    throw new Error(`WebKit no completó la verificación: ${error.message}`);
  }
  const identity = await call("/api/micro-id", professional);
  assert.ok(identity.sessions.length);
  await call(
    "/api/micro-id",
    professional,
    { action: "revoke-current" },
    undefined,
    "PATCH",
  );
  assert.equal(
    (await fetch(`${app}/api/ecosystem`, { headers: headers(professional) }))
      .status,
    403,
  );
  check("MicroID: revocación comprobada en servidor con el token anterior");
  await writeFile(`${output}/report.json`, JSON.stringify(report, null, 2));
} finally {
  await Promise.allSettled(liveBrowsers.map((browser) => browser.close()));
  await writeFile(`${output}/report.json`, JSON.stringify(report, null, 2));
  server.kill("SIGTERM");
  await new Promise((done) =>
    server.exitCode !== null ? done() : server.once("exit", done),
  );
  await writeFile(`${output}/next-server.log`, log.join(""));
  await gateway.close();
}
