import assert from "node:assert/strict";
import test from "node:test";
import { buildSync } from "esbuild";

const bundled = buildSync({
  entryPoints: ["server/authToken.ts"],
  bundle: true, write: false, format: "esm", platform: "node",
}).outputFiles[0].text;
const { createAuthToken, verifyAuthToken } = await import(
  `data:text/javascript;base64,${Buffer.from(bundled).toString("base64")}`
);

const DAY = 24 * 60 * 60 * 1000;
process.env.SESSION_SECRET = "test-secret-one";

test("a genuine token returns its user id", () => {
  assert.equal(verifyAuthToken(createAuthToken(42)), 42);
});

test("changing the user id breaks the signature (cannot switch to another user)", () => {
  const [, issuedAt, signature] = createAuthToken(42).split(".");
  assert.equal(verifyAuthToken(`1.${issuedAt}.${signature}`), null);
});

test("old unsigned tokens, including forged ones for any user, are rejected", () => {
  const legacy = (id) => Buffer.from(`${id}:${Date.now()}`).toString("base64");
  assert.equal(verifyAuthToken(legacy(1)), null);
  assert.equal(verifyAuthToken(legacy(42)), null);
  assert.equal(verifyAuthToken(`${Date.now()}`), null);
});

test("a made-up signature is rejected", () => {
  assert.equal(verifyAuthToken(`1.${Date.now()}.${"A".repeat(43)}`), null);
  assert.equal(verifyAuthToken(`1.${Date.now()}.`), null);
});

test("a token signed with a different secret is rejected", () => {
  const token = createAuthToken(7);
  process.env.SESSION_SECRET = "test-secret-two";
  assert.equal(verifyAuthToken(token), null);
  process.env.SESSION_SECRET = "test-secret-one";
  assert.equal(verifyAuthToken(token), 7);
});

test("tokens expire after a year, and cannot be dated in the future", () => {
  const now = Date.now();
  assert.equal(verifyAuthToken(createAuthToken(9, now - 364 * DAY), now), 9);
  assert.equal(verifyAuthToken(createAuthToken(9, now - 366 * DAY), now), null);
  assert.equal(verifyAuthToken(createAuthToken(9, now + 60 * 1000), now), 9, "small clock skew is fine");
  assert.equal(verifyAuthToken(createAuthToken(9, now + DAY), now), null);
});

test("garbage input is rejected without throwing", () => {
  for (const bad of [undefined, null, 5, {}, "", ".", "..", "a.b.c", "1.2.3", "x".repeat(500), "1.9999999999999999999.sig", "0.1700000000000.x"]) {
    assert.equal(verifyAuthToken(bad), null);
  }
});

test("user id zero or negative is never accepted, even if validly signed", () => {
  assert.equal(verifyAuthToken(createAuthToken(0)), null);
  assert.equal(verifyAuthToken(createAuthToken(-5)), null);
});

test("without SESSION_SECRET a random temporary key is used (still not forgeable)", () => {
  delete process.env.SESSION_SECRET;
  const token = createAuthToken(3);
  assert.equal(verifyAuthToken(token), 3);
  const [, issuedAt] = token.split(".");
  assert.equal(verifyAuthToken(`3.${issuedAt}.${"A".repeat(43)}`), null);
  process.env.SESSION_SECRET = "test-secret-one";
  assert.equal(verifyAuthToken(token), null, "a token from the temporary key does not survive once a real secret is set");
});
