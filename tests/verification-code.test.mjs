import assert from "node:assert/strict";
import test from "node:test";
import { buildSync } from "esbuild";

const bundled = buildSync({
  entryPoints: ["server/verificationCode.ts"],
  bundle: true, write: false, format: "esm", platform: "node",
}).outputFiles[0].text;
const { verificationCodeFor, codeMatches, AttemptLimiter } = await import(
  `data:text/javascript;base64,${Buffer.from(bundled).toString("base64")}`
);

process.env.SESSION_SECRET = "test-secret-one";

test("code is always 6 digits and stable for the same token", () => {
  for (let i = 0; i < 200; i++) {
    const code = verificationCodeFor(`token-${i}`);
    assert.match(code, /^\d{6}$/);
    assert.equal(code, verificationCodeFor(`token-${i}`));
  }
});

test("different tokens give different codes (a resend invalidates the old code)", () => {
  assert.notEqual(verificationCodeFor("aaa"), verificationCodeFor("bbb"));
});

test("code depends on the secret, so it cannot be worked out from the token alone", () => {
  const a = verificationCodeFor("same-token");
  process.env.SESSION_SECRET = "test-secret-two";
  const b = verificationCodeFor("same-token");
  process.env.SESSION_SECRET = "test-secret-one";
  assert.notEqual(a, b);
});

test("codeMatches accepts the right code, with spaces, and rejects everything else", () => {
  const code = verificationCodeFor("tok");
  assert.equal(codeMatches("tok", code), true);
  assert.equal(codeMatches("tok", ` ${code.slice(0, 3)} ${code.slice(3)} `), true);
  const wrong = String((Number(code) + 1) % 1000000).padStart(6, "0");
  assert.equal(codeMatches("tok", wrong), false);
  for (const bad of [undefined, null, 123456, "", "12345", "1234567", "abcdef", "12 34", {}]) {
    assert.equal(codeMatches("tok", bad), false);
  }
});

test("limiter blocks after 5 failures, expires after the window, and can be cleared", () => {
  const lim = new AttemptLimiter(5, 1000);
  const t = 10_000;
  for (let i = 0; i < 4; i++) lim.recordFailure("a@x.com", t);
  assert.equal(lim.isBlocked("a@x.com", t), false);
  lim.recordFailure("a@x.com", t);
  assert.equal(lim.isBlocked("a@x.com", t), true);
  assert.equal(lim.isBlocked("b@x.com", t), false, "other emails are unaffected");
  assert.equal(lim.isBlocked("a@x.com", t + 1001), false, "block ends after the window");
  lim.recordFailure("c@x.com", t);
  lim.clear("c@x.com");
  assert.equal(lim.isBlocked("c@x.com", t), false);
});
