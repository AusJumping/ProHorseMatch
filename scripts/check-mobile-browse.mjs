// Real UI sign-in against the isolated test API; no authentication bypass.
import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { mkdtemp, rm, mkdir, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import WebSocket from "ws";

const origin = process.env.REPLIT_DEV_DOMAIN ? `https://${process.env.REPLIT_DEV_DOMAIN}` : "http://127.0.0.1:5000";
assert.ok(process.env.REDESIGN_DEMO_PASSWORD, "Test password required");
const profile = await mkdtemp(`${tmpdir()}/phm-mobile-`);
const chrome = spawn("chromium", ["--headless", "--no-sandbox", "--disable-gpu",
  "--remote-debugging-port=9231", `--user-data-dir=${profile}`, "about:blank"], { stdio: "ignore" });
let socket;
try {
  let targets;
  for (let i = 0; i < 60; i++) {
    try { targets = await (await fetch("http://127.0.0.1:9231/json")).json(); break; }
    catch { await new Promise(resolve => setTimeout(resolve, 100)); }
  }
  socket = new WebSocket(targets.find(t => t.type === "page").webSocketDebuggerUrl);
  await new Promise(resolve => socket.on("open", resolve));
  let sequence = 0;
  const pending = new Map();
  socket.on("message", data => {
    const m = JSON.parse(data);
    if (!m.id) return;
    const cb = pending.get(m.id);
    pending.delete(m.id);
    m.error ? cb.reject(Error(m.error.message)) : cb.resolve(m.result);
  });
  const send = (method, params = {}) => new Promise((resolve, reject) => {
    const id = ++sequence;
    pending.set(id, { resolve, reject });
    socket.send(JSON.stringify({ id, method, params }));
  });
  const evaluate = async expression => {
    const r = await send("Runtime.evaluate", { expression, returnByValue: true, awaitPromise: true });
    if (r.exceptionDetails) throw Error(r.exceptionDetails.exception?.description || r.exceptionDetails.text);
    return r.result.value;
  };
  const wait = async condition => {
    for (let i = 0; i < 300; i++) {
      try { if (await evaluate(`Boolean(${condition})`)) return; }
      catch (error) {
        if (!/navigated|context|Cannot find|closed/i.test(error.message)) throw error;
      }
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    throw Error(`Timed out waiting for UI: ${condition}`);
  };
  const click = expression => evaluate(`(${expression}).click()`);
  const navigate = async path => {
    await send("Page.navigate", { url: origin + path });
    await new Promise(resolve => setTimeout(resolve, 300));
    await wait("document.readyState==='complete' && document.querySelector('#root')?.children.length");
    await evaluate("document.querySelector('[aria-label=\"Skip introduction\"]')?.click()");
  };
  const login = async role => {
    console.log(`Checking normal ${role} sign-in`);
    await navigate("/auth");
    await wait("document.querySelector('input[name=\"email\"]')");
    for (const [name, value] of [["email", `${role}@redesign.invalid`], ["password", process.env.REDESIGN_DEMO_PASSWORD]]) {
      await evaluate(`document.querySelector('input[name="${name}"]').focus()`);
      await send("Input.insertText", { text: value });
    }
    await evaluate("document.querySelector('input[name=\"password\"]').closest('form').requestSubmit()");
    await wait("Boolean(localStorage.getItem('authToken'))");
    console.log(`${role} authenticated; opening listings`);
    await navigate("/filter");
    await wait("document.querySelectorAll('article').length===10");
  };
  await send("Page.enable");
  await send("Runtime.enable");
  await send("Emulation.setDeviceMetricsOverride", { width: 390, height: 900, deviceScaleFactor: 1, mobile: true });
  await login("buyer");
  assert.equal(await evaluate("getComputedStyle(document.querySelector('article').parentElement).gridTemplateColumns.split(' ').length"), 1);
  assert.equal(await evaluate("document.documentElement.scrollWidth<=innerWidth"), true, "No page-wide horizontal overflow");
  const cardText = await evaluate("[...document.querySelectorAll('article')].map(a=>a.innerText).join('\\n')");
  for (const text of ["Amber", "Jumping", "1.20m", "Mare", "16.1hh", "Bay", "View horse"]) assert.ok(cardText.includes(text), text);
  assert.doesNotMatch(cardText, /NSW|VIC|QLD|Australia|Location/);
  assert.equal(await evaluate("document.querySelector('article button[aria-pressed]')?.getAttribute('aria-label')"), "Save Bramble");
  assert.doesNotMatch(cardText, /\$|AUD|25,000|35,000|Price/);
  assert.equal(await evaluate("document.querySelectorAll('article button[aria-pressed]').length"), 10);
  await wait("document.querySelector('article img')?.complete && document.querySelector('article img')?.naturalWidth>0");
  await wait("Number(getComputedStyle(document.querySelector('article img')).opacity)===1");
  await mkdir("generated-artifacts", { recursive: true });
  const image = await send("Page.captureScreenshot", { format: "jpeg", quality: 85 });
  await writeFile("generated-artifacts/mobile-browse-buyer.jpg", Buffer.from(image.data, "base64"));
  const button = name => `[...document.querySelectorAll('button')].find(b=>b.textContent.trim().startsWith(${JSON.stringify(name)}))`;
  for (const name of ["Price", "Height", "Age"]) {
    await click(button(name));
    await wait("document.querySelector('[role=\"dialog\"]')");
    await new Promise(resolve => setTimeout(resolve, 350));
    const box = await evaluate("(()=>{const r=document.querySelector('[role=\"dialog\"]').getBoundingClientRect();return {bottom:r.bottom,height:r.height}})()");
    assert.ok(Math.abs(box.bottom - 900) < 3, `${name} sheet sits at bottom: ${JSON.stringify(box)}`);
    assert.ok(box.height < 900);
    await send("Input.dispatchKeyEvent", { type: "keyDown", key: "Escape", code: "Escape" });
    await send("Input.dispatchKeyEvent", { type: "keyUp", key: "Escape", code: "Escape" });
    await wait("!document.querySelector('[role=\"dialog\"]')");
  }
  const nav = await evaluate("[...document.querySelectorAll('nav button')].map(a=>({label:a.textContent.trim()}))");
  for (const label of ["Find Horses", "Favourites", "Messages", "Alerts", "Profile"]) assert.ok(nav.some(n=>n.label===label), label);
  await send("Network.clearBrowserCookies");
  await evaluate("localStorage.removeItem('authToken')");
  await login("seller");
  assert.equal(await evaluate("document.querySelectorAll('article button[aria-pressed]').length"), 0, "No hearts on seller's own horses");
  console.log("Passed: normal buyer/seller login, 10 real test listings, mobile metadata, photos, one column, no card prices, bottom sheets, five tabs, own-horse hearts hidden.");
} finally {
  socket?.close();
  const exited = new Promise(resolve => chrome.once("exit", resolve));
  chrome.kill("SIGTERM");
  await exited;
  await rm(profile, { recursive: true, force: true, maxRetries: 3, retryDelay: 100 });
}
