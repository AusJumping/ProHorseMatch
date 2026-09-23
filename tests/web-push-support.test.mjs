import { test } from "node:test";
import assert from "node:assert/strict";
import { buildSync } from "esbuild";
import { runInNewContext } from "node:vm";

const compiled = buildSync({
  entryPoints: ["client/src/lib/webPushSupport.ts"],
  bundle: true,
  write: false,
  format: "cjs",
  external: ["@capacitor/core"],
}).outputFiles[0].text;

function environment({ userAgent = "Desktop Chrome", platform = "Win32",
  maxTouchPoints = 0, standalone, displayStandalone = false,
  native = false, nativePlatform = "web", supported = true } = {}) {
  const module = { exports: {} };
  const navigator = { userAgent, platform, maxTouchPoints };
  if (standalone !== undefined) navigator.standalone = standalone;
  const window = { matchMedia: () => ({ matches: displayStandalone }) };
  if (supported) {
    navigator.serviceWorker = {};
    window.Notification = {};
    window.PushManager = {};
  }
  runInNewContext(compiled, {
    module, exports: module.exports, navigator, window,
    require: (name) => {
      assert.equal(name, "@capacitor/core");
      return { Capacitor: {
        isNativePlatform: () => native,
        getPlatform: () => nativePlatform,
      } };
    },
  });
  return module.exports;
}

test("ordinary iPhone browser tabs cannot receive web-push prompts", () => {
  const device = environment({ userAgent: "iPhone", standalone: false });
  assert.equal(device.isIOSDevice(), true);
  assert.equal(device.isIOSBrowserTab(), true);
  assert.equal(device.supportsWebPushHere(), false);
});

test("desktop-site iPhone is detected without iPhone UA or touch points", () => {
  const device = environment({
    userAgent: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15)",
    platform: "MacIntel", standalone: false, maxTouchPoints: 0,
  });
  assert.equal(device.isIOSBrowserTab(), true);
  assert.equal(device.supportsWebPushHere(), false);
});

test("installed iPhone Home Screen app supports web push", () => {
  const device = environment({ userAgent: "iPhone", standalone: true });
  assert.equal(device.isIOSBrowserTab(), false);
  assert.equal(device.supportsWebPushHere(), true);
});

test("iPad desktop UA is detected through touch support", () => {
  assert.equal(environment({ platform: "MacIntel", maxTouchPoints: 5 }).isIOSBrowserTab(), true);
});

test("desktop browsers are not mistaken for an iPhone", () => {
  const device = environment({ platform: "MacIntel" });
  assert.equal(device.isIOSDevice(), false);
  assert.equal(device.supportsWebPushHere(), true);
});

test("native apps never use browser push registration", () => {
  const device = environment({ native: true, nativePlatform: "ios" });
  assert.equal(device.isIOSDevice(), true);
  assert.equal(device.isIOSBrowserTab(), false);
  assert.equal(device.supportsWebPushHere(), false);
});

test("missing push APIs are unsupported", () => {
  assert.equal(environment({ supported: false }).supportsWebPushHere(), false);
});