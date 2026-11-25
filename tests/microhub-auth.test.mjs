import assert from "node:assert/strict";
import test, { after } from "node:test";
import { createServer } from "vite";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("..", import.meta.url));
const vite = await createServer({ appType: "custom", configFile: false, root, resolve: { alias: { "@": root } }, server: { middlewareMode: true } });
after(() => vite.close());
const { microhubReturnPath, readMicrohubSession, readMicrohubUser } = await vite.ssrLoadModule("/lib/microhub-auth.ts");

test("authentication return paths cannot navigate outside Microhub", () => {
  for (const input of [null, "https://external.invalid/microhub", "//external.invalid/microhub", "/\\external.invalid/microhub", "javascript:alert(1)", "/microhub/../../registro", "/microhub-other", "/registro", "/microhub\n/evaluaciones"]) {
    assert.equal(microhubReturnPath(input), "/microhub", String(input));
  }
  assert.equal(microhubReturnPath("/microhub/evaluaciones"), "/microhub/evaluaciones");
  assert.equal(microhubReturnPath("/microhub/bitacora?view=entries#journal"), "/microhub/bitacora?view=entries#journal");
});

test("partial signup responses and corrupt sessions never authenticate a user", () => {
  for (const value of [null, {}, { user: { id: "qa" } }, { access_token: "qa", user: { id: "qa" } }, { access_token: "qa", refresh_token: "qa", user: {} }, { access_token: "qa", refresh_token: "qa", expires_at: Infinity, user: { id: "qa" } }]) {
    assert.equal(readMicrohubSession(value), null);
  }
});

test("session expiration survives persistence and supports Supabase expires_in", () => {
  const value = { access_token: "qa-access", refresh_token: "qa-refresh", user: { id: "qa-user" }, expires_at: 12345 };
  assert.deepEqual(readMicrohubSession(JSON.parse(JSON.stringify(value))), value);
  const before = Date.now() / 1000;
  const parsed = readMicrohubSession({ ...value, expires_at: undefined, expires_in: 90 });
  assert.ok(parsed.expires_at >= before + 90 && parsed.expires_at <= Date.now() / 1000 + 90);
});

test("user-controlled metadata cannot become an invalid React child", () => {
  assert.deepEqual(readMicrohubUser({ id: "qa", user_metadata: { display_name: { invalid: true } } }), { id: "qa" });
  assert.equal(readMicrohubUser({ id: "" }), null);
});
