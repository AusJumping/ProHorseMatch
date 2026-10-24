import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { buildSync, transformSync } from "esbuild";
import express from "express";
import bcrypt from "bcrypt";

const require = createRequire(import.meta.url);
function load(path) {
  const code = buildSync({
    entryPoints: [path], bundle: true, write: false, platform: "node", format: "cjs", packages: "external",
  }).outputFiles[0].text;
  const module = { exports: {} };
  new Function("require", "module", "exports", code)(require, module, module.exports);
  return module.exports;
}
const { createAdminGuard } = load("server/adminPermissions.ts");
const { mayDeleteImage } = load("server/mediaPermissions.ts");
const { hasRetiredAdminPassword } = load("server/adminCredentials.ts");
const source = readFileSync("server/routes.ts", "utf8");
const users = [
  { id: 1, email: "buyer@example.test", is_selling: false },
  { id: 2, email: "seller@example.test", is_selling: true },
  { id: 3, email: "other@example.test", is_selling: true },
  { id: 4, email: "info@australianjumping.com.au", is_selling: false, password: bcrypt.hashSync("fictional-unique-test-password", 4) },
];
const url = (id, type = "image") => `https://res.cloudinary.com/test-cloud/${type}/upload/v1/${id}.jpg`;
function fixture(horses = [{ id: 10, owner_id: 2, photos: [url("horses/legacy")], videos: [] }]) {
  const effects = [];
  return {
    effects,
    storage: {
      getUserById: async id => users.find(u => u.id === id),
      getHorses: async () => horses,
      getHorseById: async id => horses.find(h => h.id === id),
      deleteHorse: async id => { effects.push(["delete", id]); return true; },
      updateHorse: async (id, data) => { effects.push(["update", id, data]); return { id, ...data }; },
      createHorse: async data => { effects.push(["create", data]); return { id: 11, ...data }; },
    },
  };
}
// Compile only a route's registration, never import routes.ts or its database/
// notification/startup side effects. Real HTTP below runs against fictional memory.
function mountRoute(app, method, path, context) {
  const start = source.indexOf(`  app.${method}("${path}",`);
  assert.ok(start >= 0);
  const end = source.indexOf("\n  });", start) + "\n  });".length;
  const code = transformSync(source.slice(start, end), { loader: "ts", format: "cjs" }).code;
  const args = {
    app, isAuthenticated: (_req, _res, next) => next(),
    requireAdministrator: createAdminGuard(context.storage, fakeToken),
    console: { log() {}, warn() {}, error() {} }, ...context,
  };
  new Function(...Object.keys(args), code)(...Object.values(args));
}
function fakeToken(req, res, next) {
  const token = req.headers.authorization?.replace("Bearer ", "") ||
    /auth_token=([^;]*)/.exec(req.headers.cookie || "")?.[1];
  const userId = Number(token);
  if (!users.some(u => u.id === userId)) return res.status(401).json({ message: "Authentication required" });
  req.userId = userId;
  return next();
}
function appWithGuards(storage) {
  const app = express();
  app.use(express.json());
  app.use((req, _res, next) => {
    req.session = { userId: Number(req.headers["x-test-session"]) || undefined };
    next();
  });
  const requireAdministrator = createAdminGuard(storage, fakeToken);
  const guards = source.match(/^  app\.use\("\/api\/(?:admin|test|reminders\/check-conversations)", requireAdministrator\);$/gm);
  assert.equal(guards?.length, 3);
  assert.ok(source.indexOf(guards[0]) < source.indexOf('app.delete("/api/admin/'));
  new Function("app", "requireAdministrator", guards.join("\n"))(app, requireAdministrator);
  return app;
}
async function serve(app, run) {
  const server = app.listen(0, "127.0.0.1");
  await new Promise(resolve => server.once("listening", resolve));
  const request = (method, path, headers = {}, body) => fetch(
    `http://127.0.0.1:${server.address().port}${path}`,
    { method, headers: { "content-type": "application/json", ...headers }, body: body ? JSON.stringify(body) : undefined },
  );
  try { await run(request); } finally { server.closeAllConnections(); await new Promise(r => server.close(r)); }
}

test("every registered admin/test/reminder path denies anonymous users, buyers and sellers before any effect", async () => {
  const f = fixture();
  const app = appWithGuards(f.storage);
  const paths = [...source.matchAll(/app\.(get|post|put|patch|delete)\(["'](\/api\/(?:admin\/|test\/|reminders\/)[^"']+)["']/g)]
    .map(([, method, path]) => [method, path]);
  assert.ok(paths.length > 30);
  for (const [method, path] of paths) app[method](path, (_req, res) => {
    f.effects.push(path); res.json({ ok: true });
  });
  await serve(app, async request => {
    for (const [method, path] of paths) {
      for (const headers of [{}, { authorization: "Bearer 1" }, { authorization: "Bearer 2" }, { "x-test-session": "2" }]) {
        const res = await request(method.toUpperCase(), path.replace(/:[^/]+/g, "10"), headers);
        assert.equal(res.status, Object.keys(headers).length ? 403 : 401, `${method} ${path}`);
      }
    }
    assert.deepEqual(f.effects, []);
  });
});

test("administrator sessions and tokens pass; invalid tokens never fall back to an admin session", async () => {
  const app = appWithGuards(fixture().storage);
  app.get("/api/admin/probe", (req, res) => res.json({ userId: req.userId }));
  await serve(app, async request => {
    for (const headers of [{ authorization: "Bearer 4" }, { cookie: "auth_token=4" }, { "x-test-session": "4" }]) {
      const res = await request("GET", "/api/admin/probe", headers);
      assert.equal(res.status, 200);
      assert.deepEqual(await res.json(), { userId: 4 });
    }
    assert.equal((await request("GET", "/api/admin/probe", {
      authorization: "Bearer invalid", "x-test-session": "4",
    })).status, 401);
  });
});

test("former startup password cannot access admin, test, reminder or media helpers, even with a valid token/session", async () => {
  const retired = "AdminPro2025!";
  for (const password of [retired, bcrypt.hashSync(retired, 4)]) {
    const f = fixture();
    const storage = { ...f.storage, getUserById: async () => ({ ...users[3], password }) };
    const app = appWithGuards(storage);
    for (const path of ["/api/admin/delete-all-horses", "/api/test/create-sample-horse", "/api/reminders/check-conversations"]) {
      app.post(path, (_req, res) => { f.effects.push(path); res.json({ ok: true }); });
    }
    await serve(app, async request => {
      for (const path of ["/api/admin/delete-all-horses", "/api/test/create-sample-horse", "/api/reminders/check-conversations"]) {
        for (const headers of [{ authorization: "Bearer 4" }, { "x-test-session": "4" }]) {
          assert.equal((await request("POST", path, headers)).status, 403);
        }
      }
    });
    assert.equal(await mayDeleteImage(storage, 4, "horses/legacy", "test-cloud"), false);
    assert.deepEqual(f.effects, []);
  }
  assert.equal(await hasRetiredAdminPassword(undefined), true);
  assert.equal(await hasRetiredAdminPassword(users[3].password), false);
  const startup = source.slice(0, source.indexOf('import MemoryStore'));
  assert.ok(!startup.includes("storage.createUser("), "server import cannot create an administrator");
  assert.ok(!startup.includes(retired), "startup no longer contains the retired provisioning credential");
});

test("legacy delete, reassign and sample creation preserve non-selling administrator access", async () => {
  for (const [method, path, body] of [
    ["delete", "/api/admin/delete-all-horses"],
    ["delete", "/api/admin/delete-horse/:id"],
    ["delete", "/api/admin/horses"],
    ["post", "/api/admin/reassign-horses", { sourceOwnerId: 2 }],
    ["post", "/api/test/create-sample-horse", { name: "Fictional horse" }],
  ]) {
    const f = fixture();
    const app = appWithGuards(f.storage);
    mountRoute(app, method, path, { storage: f.storage });
    await serve(app, async request => {
      const res = await request(method.toUpperCase(), path.replace(":id", "10"), { authorization: "Bearer 4" }, body);
      assert.ok(res.status < 300, `${path}: ${await res.text()}`);
      assert.ok(f.effects.length > 0, path);
    });
  }
});

test("media ownership allows listing owner/admin and denies outsiders, missing identities and unknown legacy assets", async () => {
  const f = fixture();
  for (const [userId, id, allowed] of [
    [2, "horses/legacy", true], [4, "horses/legacy", true],
    [1, "horses/legacy", false], [3, "horses/legacy", false],
    [999, "horses/legacy", false], [2, "horses/unknown", false],
    [2, "horses/users/2/images/pending", true],
    [3, "horses/users/2/images/pending", false],
    [2, "horses/users/2/videos/pending", false],
  ]) assert.equal(await mayDeleteImage(f.storage, userId, id, "test-cloud"), allowed, id);
  assert.equal(await mayDeleteImage(f.storage, 2, "horses/legacy", undefined), false);
});

test("shared references, forged upload namespaces, videos and other cloud accounts confer no image deletion rights", async () => {
  for (const horses of [
    [{ owner_id: 2, photos: [url("horses/shared")] }, { owner_id: 3, photos: [url("horses/shared")] }],
    [{ owner_id: 2, photos: [url("horses/users/3/images/foreign")] }],
    [{ owner_id: 2, photos: [url("horses/video", "video")] }],
    [{ owner_id: 2, photos: ["https://res.cloudinary.com/other/image/upload/v1/horses/foreign.jpg"] }],
  ]) {
    const id = horses[0].photos[0].replace(/^.*\/v1\//, "").replace(".jpg", "");
    assert.equal(await mayDeleteImage(fixture(horses).storage, 2, id, "test-cloud"), false);
  }
  for (const id of ["", "../other", "horses//x", "horses/%2fsecret", "https://example.test/x", null]) {
    assert.equal(await mayDeleteImage(fixture().storage, 4, id, "test-cloud"), false);
  }
});

test("actual image deletion route never calls the media provider for anonymous/non-owner requests", async () => {
  // This route uses single quotes; extract it without importing the server.
  const start = source.indexOf("  app.delete('/api/delete-image/:public_id',");
  const end = source.indexOf("\n  });", start) + "\n  });".length;
  const code = transformSync(source.slice(start, end), { loader: "ts", format: "cjs" }).code;
  const f = fixture();
  const app = express();
  const args = {
    app, storage: f.storage, mayDeleteImage: (s, u, id) => mayDeleteImage(s, u, id, "test-cloud"),
    isTokenAuthenticated: fakeToken,
    deleteFromCloudinary: async id => { f.effects.push(id); return { result: "ok" }; },
    console: { error() {} },
  };
  new Function(...Object.keys(args), code)(...Object.values(args));
  await serve(app, async request => {
    for (const [headers, status] of [[{}, 401], [{ authorization: "Bearer 3" }, 403]]) {
      assert.equal((await request("DELETE", "/api/delete-image/horses%2Flegacy", headers)).status, status);
      assert.deepEqual(f.effects, []);
    }
    for (const id of [2, 4]) {
      assert.equal((await request("DELETE", "/api/delete-image/horses%2Flegacy", { authorization: `Bearer ${id}` })).status, 200);
    }
    assert.deepEqual(f.effects, ["horses/legacy", "horses/legacy"]);
  });
});

test("upload ownership folders use only the authenticated user, separately for images and videos", () => {
  assert.ok(source.includes("`horses/users/${req.userId}/images`, 'image'"));
  assert.ok(source.includes("`horses/users/${req.userId}/videos`, 'video'"));
});
