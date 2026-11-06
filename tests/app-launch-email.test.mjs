import assert from "node:assert/strict";
import test from "node:test";
import { buildSync } from "esbuild";

const code = buildSync({
  entryPoints: ["server/appLaunchEmail.ts"],
  bundle: true, write: false, format: "esm", platform: "node",
}).outputFiles[0].text;
const { selectRecipients, renderAppLaunchEmail, greetingName, unsubscribeUrlFor, APP_STORE_URL } =
  await import("data:text/javascript;base64," + Buffer.from(code).toString("base64"));

const u = (id, email, extra = {}) => ({ id, email, name: "Sam Rider", email_verified: true, email_unsubscribed: false, ...extra });

test("only verified, subscribed, valid, unique addresses are chosen, and nobody twice", () => {
  const users = [
    u(1, "a@example.com"),
    u(2, "unverified@example.com", { email_verified: false }),
    u(3, "gone@example.com", { email_unsubscribed: true }),
    u(4, "not-an-email"),
    u(5, "A@Example.com"),                 // same address as user 1, different case
    u(6, "done@example.com"),
    u(7, "info@australianjumping.com.au"), // the admin gets the preview instead
    u(8, "b@example.com"),
  ];
  const { recipients, summary } = selectRecipients(users, new Set([6]), ["info@australianjumping.com.au"]);
  assert.deepEqual(recipients.map(r => r.id), [1, 8]);
  assert.equal(summary.eligible, 2);
  assert.equal(summary.notVerified, 1);
  assert.equal(summary.unsubscribed, 1);
  assert.equal(summary.invalidEmail, 1);
  assert.equal(summary.duplicateEmail, 1);
  assert.equal(summary.alreadySent, 1);
});

test("greeting uses a first name, never a login handle or an email address", () => {
  assert.equal(greetingName({ name: "Jo Jennings", username: "jo123" }), "Jo");
  assert.equal(greetingName({ name: "", username: "jo123" }), "");
  assert.equal(greetingName({ name: "jo@example.com" }), "");
});

test("the email says what Jo wants, links the App Store and can be unsubscribed", () => {
  const unsub = unsubscribeUrlFor("sam@example.com");
  const { subject, html, text } = renderAppLaunchEmail({ name: "Sam", unsubscribeUrl: unsub });
  assert.equal(subject, "Pro Horse Match is now on the App Store");
  for (const body of [html, text]) {
    assert.ok(body.includes(APP_STORE_URL));
    assert.ok(body.includes("Never miss a match"));
    assert.ok(body.includes("chat message"));
    assert.ok(body.includes("Android"));
    assert.ok(body.includes("Google Play"));
    assert.ok(body.includes("info@australianjumping.com.au"));
    assert.ok(body.includes("https://prohorsematch.com/unsubscribe?email="));
  }
  assert.ok(html.includes("Hi Sam,"));
  assert.ok(renderAppLaunchEmail({ unsubscribeUrl: unsub }).html.includes("Hi there,"));
});

test("house style: no emojis and no em dashes, and nothing is injected through the name", () => {
  const { html, text, subject } = renderAppLaunchEmail({ name: '<img src=x onerror=alert(1)>', unsubscribeUrl: unsubscribeUrlFor("x@example.com") });
  assert.ok(!html.includes("<img src=x"));
  for (const body of [html, text, subject]) {
    assert.ok(!body.includes("—"), "em dash found");
    assert.ok(!/\p{Extended_Pictographic}/u.test(body), "emoji found");
  }
});

test("price is never mentioned", () => {
  const { html } = renderAppLaunchEmail({ unsubscribeUrl: "x" });
  assert.ok(!/price|\$\d/i.test(html));
});
