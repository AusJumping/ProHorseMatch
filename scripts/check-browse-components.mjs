// Run with the isolated browse-component-preview workflow, never against live data.
import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import WebSocket from "ws";

const profile = await mkdtemp(`${tmpdir()}/phm-browse-check-`);
const chrome = spawn("chromium", [
  "--headless", "--no-sandbox", "--disable-gpu", "--remote-debugging-port=9229",
  `--user-data-dir=${profile}`, "about:blank",
], { stdio: "ignore" });
let socket;
try {
  let targets;
  for (let attempt = 0; attempt < 50; attempt++) {
    try { targets = await (await fetch("http://127.0.0.1:9229/json")).json(); break; }
    catch { await new Promise((resolve) => setTimeout(resolve, 100)); }
  }
  assert.ok(targets, "Headless browser started");
  socket = new WebSocket(targets.find((target) => target.type === "page").webSocketDebuggerUrl);
  await new Promise((resolve) => socket.on("open", resolve));
  let sequence = 0;
  const pending = new Map();
  const errors = [];
  socket.on("message", (data) => {
    const message = JSON.parse(data);
    if (message.method === "Runtime.exceptionThrown") errors.push(message.params.exceptionDetails.text);
    if (message.id) {
      const callback = pending.get(message.id);
      pending.delete(message.id);
      message.error ? callback.reject(new Error(message.error.message)) : callback.resolve(message.result);
    }
  });
  const send = (method, params = {}) => new Promise((resolve, reject) => {
    const id = ++sequence;
    pending.set(id, { resolve, reject });
    socket.send(JSON.stringify({ id, method, params }));
  });
  const evaluate = async (expression) => {
    const response = await send("Runtime.evaluate", { expression, returnByValue: true, awaitPromise: true });
    if (response.exceptionDetails) throw new Error(response.exceptionDetails.text);
    return response.result.value;
  };
  const wait = (condition) => evaluate(`new Promise((resolve,reject)=>{let n=0;const timer=setInterval(()=>{if(${condition}){clearInterval(timer);resolve(true)}else if(++n>100){clearInterval(timer);reject(new Error('Timed out: '+${JSON.stringify(condition)}))}},50)})`);
  const click = async (selector) => {
    const position = await evaluate(`(()=>{const element=${selector};element.scrollIntoView({block:'center',inline:'center'});const r=element.getBoundingClientRect();return {x:r.x+r.width/2,y:r.y+r.height/2}})()`);
    await send("Input.dispatchMouseEvent", { type: "mousePressed", button: "left", clickCount: 1, ...position });
    await send("Input.dispatchMouseEvent", { type: "mouseReleased", button: "left", clickCount: 1, ...position });
  };
  const button = (text) => `[...document.querySelectorAll('button')].find(el=>el.textContent.trim()===${JSON.stringify(text)})`;
  const key = async (name) => {
    await send("Input.dispatchKeyEvent", { type: "keyDown", key: name });
    await send("Input.dispatchKeyEvent", { type: "keyUp", key: name });
  };
  const navigate = async (path = "/") => {
    await send("Page.navigate", { url: `http://127.0.0.1:5173${path}` });
    await wait("document.querySelector('main')");
  };
  await send("Page.enable");
  await send("Runtime.enable");
  await send("Emulation.setDeviceMetricsOverride", { width: 1440, height: 1000, deviceScaleFactor: 1, mobile: false });
  await navigate();
  await wait("document.querySelectorAll('article').length===3");
  assert.equal(await evaluate("getComputedStyle(document.querySelector('article').parentElement).gridTemplateColumns.split(' ').length"), 3);
  await click(button("Jumping"));
  await wait("document.querySelectorAll('article').length===1");
  assert.match(await evaluate("document.querySelector('article').textContent"), /Arden/);
  await click(button("Jumping"));
  await wait("document.querySelectorAll('article').length===3");
  await click("document.querySelector('[aria-label=\"Save Arden\"]')");
  await wait("document.querySelector('[aria-label=\"Remove Arden from saved horses\"]')");
  assert.equal(await evaluate("location.pathname"), "/");
  await click("document.querySelector('[aria-label=\"Remove Arden from saved horses\"]')");
  await wait("document.querySelector('[aria-label=\"Save Arden\"]')");
  await click(button("Price"));
  await wait("document.querySelector('[role=\"dialog\"]')");
  assert.equal(await evaluate("document.querySelectorAll('[role=\"slider\"]').length"), 2);
  await evaluate("document.querySelector('[aria-label=\"Minimum price\"]').focus()");
  for (let index = 0; index < 12; index++) await key("ArrowRight");
  await click(button("Apply range"));
  await wait("!document.querySelector('[role=\"dialog\"]')");
  await wait("document.querySelectorAll('article').length===2");
  await click("[...document.querySelectorAll('button')].find(el=>el.textContent.startsWith('Price:'))");
  await click(button("Clear"));
  await wait("!document.querySelector('[role=\"dialog\"]')");
  await wait("document.querySelectorAll('article').length===3");
  await send("Emulation.setDeviceMetricsOverride", { width: 390, height: 844, deviceScaleFactor: 1, mobile: true });
  await wait("getComputedStyle(document.querySelector('article').parentElement).gridTemplateColumns.split(' ').length===1");
  assert.equal(await evaluate("document.documentElement.scrollWidth<=innerWidth"), true);
  await click(button("Height"));
  await wait("document.querySelector('[role=\"dialog\"]')");
  assert.ok(await evaluate("document.querySelector('[role=\"dialog\"]').getBoundingClientRect().bottom<=innerHeight+1"));
  await evaluate("document.querySelector('[aria-label=\"Minimum height\"]').focus()");
  for (let index = 0; index < 19; index++) await key("ArrowRight");
  assert.equal(await evaluate("document.querySelector('[aria-label=\"Minimum height\"]').getAttribute('aria-valuetext')"), "16.3 hh");
  await key("ArrowRight");
  assert.equal(await evaluate("document.querySelector('[aria-label=\"Minimum height\"]').getAttribute('aria-valuetext')"), "17 hh");
  await key("Escape");
  await wait("!document.querySelector('[role=\"dialog\"]')");
  await click("document.querySelector('article img')");
  await wait("location.pathname==='/horse/1'");
  for (const mode of ["empty", "loading", "error"]) {
    await navigate(`/?state=${mode}`);
    const text = await evaluate("document.body.textContent");
    assert.match(text, mode === "empty" ? /0 horses found/ : mode === "error" ? /Retry search/ : /3 horses/);
    if (mode === "loading") assert.equal(await evaluate("!!document.querySelector('[aria-label=\"Loading horses\"]')"), true);
    if (mode === "error") { await click(button("Retry search")); await wait("document.querySelectorAll('article').length===3"); }
  }
  assert.deepEqual(errors, []);
  console.log("PASS: desktop/mobile grid, instant filters, two-thumb price range, valid height steps, bottom dialog, Escape, independent heart, whole-photo navigation, empty/loading/error/retry. Component fixture only; backend/auth not tested.");
} finally {
  socket?.close();
  chrome.kill("SIGTERM");
  await new Promise((resolve) => chrome.once("exit", resolve));
  await rm(profile, { recursive: true, force: true });
}
