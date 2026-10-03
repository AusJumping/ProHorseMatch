import assert from "node:assert/strict";
import test from "node:test";
import { buildSync } from "esbuild";
import { runInNewContext } from "node:vm";
import { readFileSync } from "node:fs";

const compiled = buildSync({
  entryPoints: ["client/src/lib/introPlayback.ts"],
  bundle: true, write: false, format: "cjs",
}).outputFiles[0].text;

function setup({ blocked = false } = {}) {
  const timers = new Map();
  const events = new Map();
  let calls = 0, skipped = 0, nextId = 0;
  const video = {
    currentTime: 0,
    setAttribute() {},
    addEventListener: (name, callback) => events.set(name, callback),
    removeEventListener: name => events.delete(name),
    play: () => {
      calls++;
      return blocked ? Promise.reject({ name: "NotAllowedError" }) : Promise.resolve();
    },
  };
  const module = { exports: {} };
  runInNewContext(compiled, {
    module, exports: module.exports,
    window: {
      setTimeout: (fn, delay) => {
        const id = ++nextId;
        timers.set(id, { fn, delay });
        return id;
      },
      clearTimeout: id => timers.delete(id),
    },
  });
  const stop = module.exports.startIntroPlayback(video, () => skipped++);
  return {
    video, stop, timers, events,
    get calls() { return calls; },
    get skipped() { return skipped; },
    fire: name => events.get(name)?.(),
    advance: delay => {
      for (const [id, timer] of [...timers]) {
        if (timer.delay <= delay) { timers.delete(id); timer.fn(); }
      }
    },
  };
}

test("a temporary autoplay rejection does not immediately dismiss the intro", async () => {
  const h = setup({ blocked: true });
  await Promise.resolve();
  assert.equal(h.skipped, 0);
  assert.equal(h.video.muted, true);
  assert.equal(h.video.defaultMuted, true);
  h.fire("loadeddata");
  h.fire("canplay");
  h.advance(1000);
  await Promise.resolve();
  assert.equal(h.calls, 5);
  assert.equal(h.skipped, 0);
  h.stop();
});

test("successful playback is not skipped by the startup deadline", () => {
  const h = setup();
  h.fire("playing");
  h.advance(15000);
  assert.equal(h.calls, 1);
  assert.equal(h.skipped, 0);
  h.stop();
});

test("persistently blocked autoplay eventually opens the app without a tap", async () => {
  const h = setup({ blocked: true });
  h.advance(15000);
  await Promise.resolve();
  assert.equal(h.skipped, 1);
  h.stop();
});

test("backgrounding or unmounting cancels old retries and deadlines", async () => {
  const h = setup({ blocked: true });
  h.stop();
  h.advance(15000);
  await Promise.resolve();
  assert.equal(h.calls, 1);
  assert.equal(h.skipped, 0);
  assert.equal(h.events.size, 0);
  assert.equal(h.timers.size, 0);
});

test("intro surrounds all routes and leaves the current page mounted during playback", () => {
  const app = readFileSync("client/src/App.tsx", "utf8");
  const gate = readFileSync("client/src/components/intro-gate.tsx", "utf8");
  assert.match(app, /<IntroGate><Router \/><\/IntroGate>/);
  assert.equal((app.match(/<IntroGate>/g) ?? []).length, 1);
  assert.match(gate, /\{children\}\s*\{playback &&/);
  assert.doesNotMatch(gate, /shownThisOpening/);
});