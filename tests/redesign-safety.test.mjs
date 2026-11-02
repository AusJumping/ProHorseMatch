import test from "node:test";
import assert from "node:assert/strict";
import { redesignEnvironment, assertServerEnvironment } from "../scripts/redesign-safety.mjs";
import { readFileSync } from "node:fs";

// Dummy credentials, never usable against a database or third-party provider.
const safe = {
  REDESIGN_DATABASE_URL: "postgresql://demo:dummy@test.neon.tech/prohorsematch_redesign",
  REDESIGN_DEMO_PASSWORD: "dummy-test-password",
  SESSION_SECRET: "dummy-session-secret-for-unit-testing-only",
  RENDER_GIT_BRANCH: "redesign",
};

test("redesign never falls back to existing production database settings", () => {
  assert.throws(() => redesignEnvironment({ DATABASE_URL: "production", NEON_DATABASE_URL: "production" }), /NEW test database/);
  const env = redesignEnvironment({ ...safe, DATABASE_URL: "production", NEON_DATABASE_URL: "production" });
  assert.equal(env.DATABASE_URL, safe.REDESIGN_DATABASE_URL);
  assert.equal(env.NEON_DATABASE_URL, undefined);
  assert.equal(env.VITE_REDESIGN_SANDBOX, "true");
});
test("the ordinary Neon database name is refused", () => {
  assert.throws(() => redesignEnvironment({ ...safe, REDESIGN_DATABASE_URL: safe.REDESIGN_DATABASE_URL.replace("prohorsematch_redesign", "neondb") }), /separate Neon/);
});
test("main cannot be deployed with the redesign launcher", () => {
  assert.throws(() => redesignEnvironment({ ...safe, RENDER_GIT_BRANCH: "main" }), /never main/);
});
test("sandbox child processes receive no email, push, media or payment credentials", () => {
  const keys = ["RESEND_API_KEY", "SENDGRID_API_KEY", "VAPID_PRIVATE_KEY", "VAPID_PUBLIC_KEY",
    "FIREBASE_SERVICE_ACCOUNT_KEY", "GOOGLE_APPLICATION_CREDENTIALS", "STRIPE_SECRET_KEY",
    "VITE_STRIPE_PUBLIC_KEY", "CLOUDINARY_API_KEY", "CLOUDINARY_API_SECRET", "CLOUDINARY_URL"];
  const env = redesignEnvironment({ ...safe, ...Object.fromEntries(keys.map(key => [key, "dummy"])) });
  keys.forEach(key => assert.equal(env[key], undefined));
  assert.doesNotThrow(() => assertServerEnvironment(env));
});
test("ordinary start on Render's redesign branch fails closed", () => {
  assert.throws(() => assertServerEnvironment({ RENDER_GIT_BRANCH: "redesign" }), /redesign:start/);
});
test("sandbox runtime rejects database overrides and reintroduced sender keys", () => {
  const env = redesignEnvironment(safe);
  assert.throws(() => assertServerEnvironment({ ...env, DATABASE_URL: "production" }));
  assert.throws(() => assertServerEnvironment({ ...env, RESEND_API_KEY: "dummy" }), /Unsafe/);
});
test("main's server environment behavior is not changed", () => {
  assert.doesNotThrow(() => assertServerEnvironment({ RENDER_GIT_BRANCH: "main", DATABASE_URL: "existing" }));
});
test("demo data is fake and setup checks for an empty database before schema push", () => {
  const seed = readFileSync("scripts/redesign-data.ts", "utf8");
  assert.match(seed, /seller@redesign\.invalid/);
  assert.match(seed, /buyer@redesign\.invalid/);
  assert.match(seed, /FICTIONAL SAMPLE/);
  assert.ok(seed.indexOf("tables.rows[0].count !== 0") < seed.indexOf('"push"'));
  assert.match(seed, /if \(!marked.rows\[0\]\.seeded\)/);
  assert.match(seed, /db\.transaction/);
});
