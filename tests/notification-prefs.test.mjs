import assert from "node:assert/strict";
import test from "node:test";
import { buildSync } from "esbuild";

const bundled = buildSync({
  entryPoints: ["server/notificationPrefs.ts"],
  bundle: true, write: false, format: "esm", platform: "node",
}).outputFiles[0].text;
const { wantsNotification, summariseNotificationStatus } = await import(`data:text/javascript;base64,${Buffer.from(bundled).toString("base64")}`);

test("no saved choice means ON; only an explicit false turns a notification off", () => {
  assert.equal(wantsNotification({}, "notify_messages"), true);
  assert.equal(wantsNotification({ notify_messages: null }, "notify_messages"), true);
  assert.equal(wantsNotification({ notify_messages: true }, "notify_messages"), true);
  assert.equal(wantsNotification({ notify_messages: false }, "notify_messages"), false);
  assert.equal(wantsNotification({ notify_messages: false }, "notify_matches"), true, "other types unaffected");
});

test("a person with nothing registered yet still sees every switch on", () => {
  const s = summariseNotificationStatus([], []);
  assert.equal(s.subscribed, false);
  assert.deepEqual(s.preferences, { notify_matches: true, notify_messages: true, notify_updates: true, notify_digest: true });
});

test("a phone running the app counts, and its switches are shown", () => {
  const s = summariseNotificationStatus([], [{ notify_messages: false, notify_matches: true, notify_updates: null, notify_digest: true }]);
  assert.equal(s.subscribed, true);
  assert.equal(s.nativeDevices, 1);
  assert.equal(s.count, 1);
  assert.equal(s.preferences.notify_messages, false, "an explicit switch-off is respected");
  assert.equal(s.preferences.notify_updates, true, "null means on");
});

test("browser and phone together are both counted", () => {
  const s = summariseNotificationStatus([{ notify_messages: true }], [{}, {}]);
  assert.equal(s.count, 3);
  assert.equal(s.nativeDevices, 2);
});
