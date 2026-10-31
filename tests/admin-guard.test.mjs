import assert from "node:assert/strict";
import test from "node:test";
import bcrypt from "bcrypt";
import { buildSync } from "esbuild";
import { mkdirSync, writeFileSync } from "node:fs";
import { pathToFileURL } from "node:url";
import path from "node:path";

const bundled = buildSync({
  entryPoints: ["server/adminPermissions.ts"],
  bundle: true, write: false, format: "esm", platform: "node", packages: "external",
}).outputFiles[0].text;
// Written inside the project so the bundle can find the real bcrypt package.
const cacheDir = path.resolve("node_modules", ".cache");
mkdirSync(cacheDir, { recursive: true });
const bundlePath = path.join(cacheDir, "admin-guard-under-test.mjs");
writeFileSync(bundlePath, bundled);
const { createAdminGuard } = await import(pathToFileURL(bundlePath).href);

const ADMIN = "info@australianjumping.com.au";
const goodHash = await bcrypt.hash("a-strong-new-admin-password", 4);
const retiredHash = await bcrypt.hash("AdminPro2025!", 4);

const users = {
  1: { email: "seller@example.com", password: goodHash },       // an ordinary seller
  2: { email: ADMIN, password: goodHash },                      // admin, safe password
  3: { email: ADMIN, password: retiredHash },                   // admin, old public seed password (hashed)
  4: { email: ADMIN, password: "AdminPro2025!" },               // admin, old public seed password (plain)
};
const storage = { getUserById: async (id) => users[id] };
// stands in for the real token check: "token-N" means user N
const authenticateToken = (req, res, next) => {
  const m = /token-(\d+)/.exec(req.headers.authorization || "");
  if (!m) return res.status(401).json({ message: "Authentication required" });
  req.userId = Number(m[1]);
  return next();
};
const guard = createAdminGuard(storage, authenticateToken);

async function call(req) {
  return new Promise((resolve) => {
    const res = { code: 200, status(c) { this.code = c; return this; }, json(b) { resolve({ code: this.code, body: b }); } };
    guard({ headers: {}, session: {}, ...req }, res, () => resolve({ code: 200, passed: true }));
  });
}

test("no login at all is refused", async () => {
  assert.equal((await call({})).code, 401);
});

test("an ordinary logged-in seller cannot use admin routes (token)", async () => {
  const r = await call({ headers: { authorization: "Bearer token-1" } });
  assert.equal(r.code, 403);
  assert.equal(r.passed, undefined);
});

test("an ordinary logged-in seller cannot use admin routes (browser session)", async () => {
  assert.equal((await call({ session: { userId: 1 } })).code, 403);
});

test("a forged or invalid token is refused, even with a valid session", async () => {
  const r = await call({ headers: { authorization: "Bearer nonsense" }, session: { userId: 2 } });
  assert.equal(r.code, 401);
});

test("the administrator gets through", async () => {
  assert.equal((await call({ headers: { authorization: "Bearer token-2" } })).passed, true);
  assert.equal((await call({ session: { userId: 2 } })).passed, true);
});

test("the administrator is blocked while still on the old public seed password", async () => {
  assert.equal((await call({ headers: { authorization: "Bearer token-3" } })).code, 403);
  assert.equal((await call({ headers: { authorization: "Bearer token-4" } })).code, 403);
});

test("a deleted account is refused", async () => {
  assert.equal((await call({ headers: { authorization: "Bearer token-99" } })).code, 403);
});
