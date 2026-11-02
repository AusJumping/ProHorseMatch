import assert from "node:assert/strict";
import test from "node:test";
import { buildSync } from "esbuild";
import { mkdirSync, writeFileSync } from "node:fs";
import { pathToFileURL } from "node:url";
import path from "node:path";

const bundled = buildSync({
  entryPoints: ["server/horsePrivacy.ts"],
  bundle: true, write: false, format: "esm", platform: "node", packages: "external",
}).outputFiles[0].text;
const dir = path.resolve("node_modules", ".cache");
mkdirSync(dir, { recursive: true });
const file = path.join(dir, "horse-privacy-under-test.mjs");
writeFileSync(file, bundled);
const { hideHorsePrivate, horsePrivacyFor, viewerIdFromRequest, ADMIN_EMAIL } = await import(pathToFileURL(file).href);

const horse = { id: 1, owner_id: 7, name: "Amber", price_min: 25000, price_max: 35000, currency: "AUD", sire: "X" };

test("a stranger or a logged-out visitor never gets the price range", () => {
  for (const viewer of [null, 8]) {
    const out = hideHorsePrivate(horse, viewer, false);
    assert.equal("price_min" in out, false);
    assert.equal("price_max" in out, false);
    assert.equal(out.name, "Amber");
    assert.equal(out.sire, "X");
  }
});

test("the owner and the administrator do get it", () => {
  assert.equal(hideHorsePrivate(horse, 7, false).price_min, 25000);
  assert.equal(hideHorsePrivate(horse, 99, true).price_max, 35000);
});

test("the original record is never changed", () => {
  hideHorsePrivate(horse, null, false);
  assert.equal(horse.price_min, 25000);
});

test("horsePrivacyFor recognises the administrator by email and fails safe", async () => {
  const users = { 1: { email: ADMIN_EMAIL }, 2: { email: "a@b.com" } };
  const lookup = { getUserById: async (id) => { if (id === 3) throw new Error("db down"); return users[id]; } };
  assert.equal((await horsePrivacyFor(lookup, 1))(horse).price_min, 25000);
  assert.equal("price_min" in (await horsePrivacyFor(lookup, 2))(horse), false);
  assert.equal("price_min" in (await horsePrivacyFor(lookup, 3))(horse), false, "lookup failure hides the price");
  assert.equal("price_min" in (await horsePrivacyFor(lookup, null))(horse), false);
});

test("viewerIdFromRequest reads a genuine token, ignores forged ones, and never throws", () => {
  process.env.SESSION_SECRET = "privacy-test-secret";
  assert.equal(viewerIdFromRequest({ headers: { authorization: "Bearer nonsense" } }), null);
  assert.equal(viewerIdFromRequest({ headers: { cookie: "auth_token=%E0%A4%A" } }), null);
  assert.equal(viewerIdFromRequest({ headers: {}, session: { userId: 5 } }), 5);
  assert.equal(viewerIdFromRequest({}), null);
});
