import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { buildSync, transformSync } from "esbuild";

const require = createRequire(import.meta.url);
function load(path) {
  const code = buildSync({
    entryPoints: [path], bundle: true, write: false, platform: "node", format: "cjs", packages: "external",
  }).outputFiles[0].text;
  const module = { exports: {} };
  new Function("require", "module", "exports", code)(require, module, module.exports);
  return module.exports;
}
const permissions = load("server/horsePermissions.ts");
const { insertMatchSchema } = load("shared/schema.ts");
const source = readFileSync("server/routes.ts", "utf8");

// Execute the actual registered route bodies with isolated in-memory storage.
// Never import routes.ts: its module initialization can access application data.
function route(method, path, storage, effects = []) {
  const start = source.indexOf(`  app.${method}("${path}",`);
  assert.notEqual(start, -1, path);
  const end = source.indexOf("\n  });", start) + "\n  });".length;
  const code = transformSync(source.slice(start, end), { loader: "ts", format: "cjs" }).code;
  let handler;
  const guard = () => {};
  const app = { [method]: (_path, auth, fn) => { assert.equal(auth, guard); handler = fn; } };
  const context = {
    app, storage, isTokenAuthenticated: guard, insertMatchSchema, ...permissions,
    console: { log() {}, warn() {}, error() {} },
    sendNewMessageNotification: async () => { effects.push("push"); },
    sendNewConversationNotificationEmail: async () => { effects.push("newEmail"); return true; },
    sendMessageNotificationEmail: async () => { effects.push("replyEmail"); return true; },
  };
  new Function(...Object.keys(context), code)(...Object.values(context));
  return async (userId, body, params = {}) => {
    const response = { statusCode: 200, body: undefined,
      status(status) { this.statusCode = status; return this; },
      json(body) { this.body = body; return this; },
    };
    await handler({ userId, body, params, headers: {}, protocol: "https", get: () => "example.test" }, response);
    return response;
  };
}
function fixture({ blocks = [], conversations = [], matches = [], messages = [] } = {}) {
  const writes = [], effects = [];
  const users = [1, 2, 3].map(id => ({ id, username: `fictional-${id}`, email: `user${id}@example.test` }));
  const horses = [{ id: 10, owner_id: 2, name: "Fictional horse" }, { id: 11, owner_id: 3 }];
  const storage = {
    getUserById: async id => users.find(u => u.id === id),
    isUserUnsubscribed: async () => false,
    getHorseById: async id => horses.find(h => h.id === id),
    isBlocked: async (a, b) => blocks.some(([x, y]) => (a === x && b === y) || (a === y && b === x)),
    getMatchesByCustomerId: async id => matches.filter(m => m.customer_id === id),
    getMatchById: async id => matches.find(m => m.id === id),
    createMatch: async data => { writes.push(["match", data]); return { id: 5, ...data }; },
    updateMatch: async (id, data) => { writes.push(["matchUpdate", id, data]); return { ...matches.find(m => m.id === id), ...data }; },
    getConversationsByCustomerId: async id => conversations.filter(c => c.customer_id === id),
    getConversationById: async id => conversations.find(c => c.id === id),
    getMessagesByConversationId: async (customerId, ownerId, horseId) =>
      messages.filter(m => m.customer_id === customerId && m.owner_id === ownerId && m.horse_id === horseId),
    deleteConversation: async id => { writes.push(["deleteConversation", id]); return true; },
    updateMessage: async (id, data) => { writes.push(["messageUpdate", id, data]); },
    createConversation: async data => { const c = { id: 9, ...data }; writes.push(["conversation", c]); conversations.push(c); return c; },
    updateConversation: async (id, data) => {
      writes.push(["conversationUpdate", id, data]);
      Object.assign(conversations.find(c => c.id === id), data);
    },
    createMessage: async data => { writes.push(["message", data]); return { id: 20, ...data }; },
  };
  return { storage, writes, effects };
}
const parties = { customer_id: 1, owner_id: 2, horse_id: 10 };

test("buyers and sellers may save somebody else's horse without role/plan restrictions", async () => {
  for (const userId of [1, 3]) {
    const f = fixture();
    const res = await route("post", "/api/matches", f.storage)(userId, { customer_id: userId, horse_id: 10, is_liked: true });
    assert.equal(res.statusCode, 201);
    assert.equal(f.writes.length, 1);
  }
});
test("own-horse saves, forged customer IDs and missing horses cause no writes", async () => {
  for (const [userId, body, status] of [
    [2, { customer_id: 2, horse_id: 10, is_liked: true }, 403],
    [3, { customer_id: 1, horse_id: 10, is_liked: true }, 403],
    [1, { customer_id: 1, horse_id: 999, is_liked: true }, 404],
  ]) {
    const f = fixture();
    const res = await route("post", "/api/matches", f.storage)(userId, body);
    assert.equal(res.statusCode, status);
    assert.deepEqual(f.writes, []);
  }
});
test("repeat saving updates the existing favourite instead of creating another", async () => {
  const f = fixture({ matches: [{ id: 5, customer_id: 1, horse_id: 10, is_liked: false }] });
  const res = await route("post", "/api/matches", f.storage)(1, { customer_id: 1, horse_id: 10, is_liked: true });
  assert.equal(res.statusCode, 200);
  assert.deepEqual(f.writes, [["matchUpdate", 5, { is_liked: true }]]);
});
test("favourite updates cannot reassign ownership or horse, or edit another user's record", async () => {
  for (const [userId, body, status] of [
    [3, { is_liked: true }, 403],
    [1, { is_liked: true, customer_id: 3 }, 400],
    [1, { is_liked: true, horse_id: 11 }, 400],
    [1, { is_liked: "true" }, 400],
    [1, {}, 400],
  ]) {
    const f = fixture({ matches: [{ id: 5, customer_id: 1, horse_id: 10 }] });
    const res = await route("patch", "/api/matches/:id", f.storage)(userId, body, { id: "5" });
    assert.equal(res.statusCode, status);
    assert.deepEqual(f.writes, []);
  }
});
test("old self-favourites can be removed but cannot be re-saved through either route", async () => {
  for (const method of ["post", "patch"]) {
    for (const is_liked of [false, true]) {
      const f = fixture({ matches: [{ id: 5, customer_id: 2, horse_id: 10, is_liked: true }] });
      const body = method === "post" ? { customer_id: 2, horse_id: 10, is_liked } : { is_liked };
      const res = await route(method, method === "post" ? "/api/matches" : "/api/matches/:id", f.storage)(2, body, { id: "5" });
      assert.equal(res.statusCode, is_liked ? 403 : 200);
      assert.equal(f.writes.length, is_liked ? 0 : 1);
    }
  }
});
test("buyer starts a conversation and seller can get the same conversation without duplication", async () => {
  const f = fixture();
  const run = route("post", "/api/conversations", f.storage);
  const buyer = await run(1, parties);
  const seller = await run(2, { customer_id: "1", owner_id: "2", horse_id: "10" });
  assert.equal(buyer.statusCode, 200);
  assert.equal(seller.statusCode, 200);
  assert.equal(seller.body.id, buyer.body.id);
  assert.equal(f.writes.length, 1);
});
test("sellers may also enquire about other sellers' listings", async () => {
  const f = fixture();
  const res = await route("post", "/api/conversations", f.storage)(2, { customer_id: 2, owner_id: 3, horse_id: 11 });
  assert.equal(res.statusCode, 200);
});
for (const path of ["/api/conversations", "/api/messages"]) {
  test(`${path} rejects outsider, self-contact, fake owner, missing parties/horse and malformed IDs before effects`, async () => {
    for (const [userId, body, status] of [
      [3, parties, 403],
      [2, { ...parties, customer_id: 2 }, 403],
      [1, { ...parties, owner_id: 3 }, 403],
      [1, { ...parties, horse_id: 999 }, 404],
      [2, { ...parties, customer_id: 999 }, 404],
      [1, { ...parties, owner_id: "2junk" }, 400],
      [1, { ...parties, customer_id: 1.5 }, 400],
      [1, { ...parties, horse_id: 0 }, 400],
      [1, { ...parties, horse_id: {} }, 400],
      [1, {}, 400],
    ]) {
      const f = fixture();
      const res = await route("post", path, f.storage, f.effects)(userId, { ...body, content: "Enquiry" });
      assert.equal(res.statusCode, status, JSON.stringify(body));
      assert.deepEqual(f.writes, []);
      assert.deepEqual(f.effects, []);
    }
  });
  test(`${path} rejects blocking in either direction, including existing conversations`, async () => {
    for (const blocks of [[[1, 2]], [[2, 1]]]) {
      for (const userId of [1, 2]) {
        const f = fixture({ blocks, conversations: [{ id: 9, ...parties }] });
        const res = await route("post", path, f.storage, f.effects)(userId, { ...parties, content: "Enquiry" });
        assert.equal(res.statusCode, 403);
        assert.deepEqual(f.writes, []);
        assert.deepEqual(f.effects, []);
      }
    }
  });
}
test("valid buyer message and seller reply retain thread, sender identity, read state and notifications", async () => {
  const f = fixture();
  const run = route("post", "/api/messages", f.storage, f.effects);
  for (const [userId, sender_type] of [[1, "customer"], [2, "owner"]]) {
    const res = await run(userId, { customer_id: "1", owner_id: "2", horse_id: "10", content: " Enquiry ", sender_type: "forged" });
    assert.equal(res.statusCode, 200);
    assert.equal(res.body.sender_type, sender_type);
    assert.equal(res.body.content, "Enquiry");
    assert.equal(res.body.horse_id, 10);
  }
  assert.equal(f.writes.filter(w => w[0] === "conversation").length, 1);
  assert.equal(f.writes.filter(w => w[0] === "message").length, 2);
  const updates = f.writes.filter(w => w[0] === "conversationUpdate");
  assert.equal(updates[0][2].unread_count, 1);
  assert.equal(updates[1][2].unread_count, 2);
  assert.ok(updates[0][2].customer_last_message_time instanceof Date);
  assert.ok(updates[1][2].owner_last_message_time instanceof Date);
  assert.equal(f.effects.filter(e => e === "newEmail").length, 1);
  assert.equal(f.effects.filter(e => e === "replyEmail").length, 1);
  assert.equal(f.effects.filter(e => e === "push").length, 2);
});
test("invalid message content is a clean client error with no side effects", async () => {
  for (const content of ["", " ", 42, {}, null]) {
    const f = fixture();
    const res = await route("post", "/api/messages", f.storage)(1, { ...parties, content });
    assert.equal(res.statusCode, 400);
    assert.deepEqual(f.writes, []);
  }
});
test("participants retain message history and deletion access; outsiders cannot read or delete", async () => {
  const messages = [{ id: 20, ...parties, content: "Enquiry", sender_type: "customer" }];
  for (const userId of [1, 2, 3]) {
    const f = fixture({ conversations: [{ id: 9, ...parties }], messages });
    const read = await route("get", "/api/conversations/:customerId/:ownerId/:horseId/messages", f.storage)(
      userId, {}, { customerId: "1", ownerId: "2", horseId: "10" },
    );
    const remove = await route("delete", "/api/conversations/:id", f.storage)(userId, {}, { id: "9" });
    assert.equal(read.statusCode, userId === 3 ? 403 : 200);
    assert.equal(remove.statusCode, userId === 3 ? 403 : 200);
    if (userId !== 3) assert.deepEqual(read.body, messages);
    assert.equal(f.writes.length, userId === 3 ? 0 : 1);
  }
});
test("marking a thread read still changes only received messages and denies outsiders", async () => {
  for (const userId of [1, 2, 3]) {
    const f = fixture({
      conversations: [{ id: 9, ...parties }],
      messages: [
        { id: 20, ...parties, sender_type: "customer", is_read: false },
        { id: 21, ...parties, sender_type: "owner", is_read: false },
      ],
    });
    const res = await route("patch", "/api/conversations/:conversationId/read", f.storage)(userId, {}, { conversationId: "9" });
    assert.equal(res.statusCode, userId === 3 ? 403 : 200);
    const updates = f.writes.filter(w => w[0] === "messageUpdate");
    assert.deepEqual(updates, userId === 3 ? [] : [["messageUpdate", userId === 1 ? 21 : 20, { is_read: true }]]);
    if (userId === 3) assert.deepEqual(f.writes, []);
  }
});
