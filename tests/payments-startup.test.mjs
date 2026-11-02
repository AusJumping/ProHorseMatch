import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { build } from "esbuild";

async function paymentConfig(env) {
  const result = await build({
    entryPoints: ["client/src/lib/payments.ts"],
    bundle: true, write: false, format: "esm", platform: "node",
    define: { "import.meta.env": JSON.stringify(env) },
    plugins: [{
      name: "fake-stripe",
      setup(builder) {
        builder.onResolve({ filter: /^@stripe\/stripe-js\/pure$/ }, () => ({ path: "stripe", namespace: "fake" }));
        builder.onLoad({ filter: /.*/, namespace: "fake" }, () => ({
          contents: 'export const loadStripe = key => ({ initializedWith: key });',
        }));
      },
    }],
  });
  return import(`data:text/javascript;base64,${Buffer.from(result.outputFiles[0].text).toString("base64")}`);
}

test("missing payment key is safe at module import and never initializes Stripe", async () => {
  const config = await paymentConfig({});
  assert.equal(config.paymentsAvailable, false);
  assert.equal(config.stripePromise, null);
});

test("sandbox explicitly disables Stripe even if a key is accidentally provided", async () => {
  const config = await paymentConfig({ VITE_REDESIGN_SANDBOX: "true", VITE_STRIPE_PUBLIC_KEY: "dummy" });
  assert.equal(config.paymentsAvailable, false);
  assert.equal(config.stripePromise, null);
});

test("ordinary configured checkout still initializes Stripe", async () => {
  const config = await paymentConfig({ VITE_STRIPE_PUBLIC_KEY: "dummy" });
  assert.equal(config.paymentsAvailable, true);
  assert.deepEqual(config.stripePromise, { initializedWith: "dummy" });
});

test("all payment route wrappers gate effects and requests behind availability", () => {
  for (const [page, component] of [
    ["checkout", "Checkout"],
    ["donation-checkout", "DonationCheckout"],
    ["subscription", "SubscriptionPage"],
  ]) {
    const source = readFileSync(`client/src/pages/${page}.tsx`, "utf8");
    assert.ok(source.includes(`return paymentsAvailable ? <Enabled${component} /> : <PaymentsUnavailable />;`));
    assert.ok(!source.includes("Missing required Stripe key"));
    assert.ok(!source.includes("Missing environment variable: VITE_STRIPE_PUBLIC_KEY"));
    assert.ok(!source.includes("loadStripe("));
  }
});
