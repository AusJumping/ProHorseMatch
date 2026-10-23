// Authenticated UI check on the isolated redesign API. Never bypasses login.
import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import WebSocket from "ws";

assert.ok(process.env.REDESIGN_DEMO_PASSWORD, "Test password required");
const origin = process.env.REPLIT_DEV_DOMAIN ? `https://${process.env.REPLIT_DEV_DOMAIN}` : "http://127.0.0.1:5000";
const profile = await mkdtemp(`${tmpdir()}/phm-detail-roles-`);
const chrome = spawn("chromium", ["--headless", "--no-sandbox", "--disable-gpu",
  "--remote-debugging-port=9232", `--user-data-dir=${profile}`, "about:blank"], { stdio: "ignore" });
let socket;
try {
  let targets;
  for (let i = 0; i < 60; i++) {
    try { targets = await (await fetch("http://127.0.0.1:9232/json")).json(); break; }
    catch { await new Promise(resolve => setTimeout(resolve, 100)); }
  }
  assert.ok(targets?.length, "Headless browser started");
  socket = new WebSocket(targets.find(target => target.type === "page").webSocketDebuggerUrl);
  await new Promise(resolve => socket.on("open", resolve));
  let sequence = 0;
  const pending = new Map();
  socket.on("message", data => {
    const message = JSON.parse(data);
    if (!message.id) return;
    const callback = pending.get(message.id);
    pending.delete(message.id);
    message.error ? callback.reject(Error(message.error.message)) : callback.resolve(message.result);
  });
  const send = (method, params = {}) => new Promise((resolve, reject) => {
    const id = ++sequence;
    pending.set(id, { resolve, reject });
    socket.send(JSON.stringify({ id, method, params }));
  });
  const evaluate = async expression => {
    const result = await send("Runtime.evaluate", { expression, returnByValue: true, awaitPromise: true });
    if (result.exceptionDetails) throw Error(result.exceptionDetails.exception?.description || result.exceptionDetails.text);
    return result.result.value;
  };
  const wait = async condition => {
    for (let i = 0; i < 300; i++) {
      try { if (await evaluate(`Boolean(${condition})`)) return; }
      catch (error) { if (!/navigated|context|closed/i.test(error.message)) throw error; }
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    throw Error(`Timed out: ${condition}`);
  };
  const navigate = async path => {
    await send("Page.navigate", { url: origin + path });
    await new Promise(resolve => setTimeout(resolve, 250));
    await wait("document.readyState==='complete' && document.querySelector('#root')?.children.length");
    await evaluate("document.querySelector('[aria-label=\"Skip introduction\"]')?.click()");
    await wait("!document.querySelector('[aria-label=\"Skip introduction\"]')");
  };
  const login = async role => {
    await navigate("/auth");
    await wait("document.querySelector('input[name=\"email\"]')");
    for (const [name, value] of [["email", `${role}@redesign.invalid`], ["password", process.env.REDESIGN_DEMO_PASSWORD]]) {
      await evaluate(`document.querySelector('input[name="${name}"]').focus()`);
      await send("Input.insertText", { text: value });
    }
    await evaluate("document.querySelector('input[name=\"password\"]').closest('form').requestSubmit()");
    await wait("Boolean(localStorage.getItem('authToken'))");
  };
  const metrics = await (await fetch(origin + "/api/redesign-status")).json();
  assert.equal(metrics.environment, "redesign");
  for (const key of ["outboundEmail", "outboundPush", "payments", "mediaUploads"]) assert.equal(metrics[key], false);
  await send("Page.enable");
  await send("Runtime.enable");
  await send("Emulation.setDeviceMetricsOverride", { width: 390, height: 844, deviceScaleFactor: 1, mobile: true });
  await login("buyer");
  await navigate("/horse/1");
  await wait("document.querySelector('h1')?.textContent.includes('Amber') && document.querySelector('article')");
  let buyerText = await evaluate("document.body.innerText");
  for (const fact of ["Discipline", "Level", "Age", "Sex", "Height", "Colour", "Breed", "Location", "Australia", "Sire", "Dam", "Dam sire", "About Amber", "Contact Seller", "Report this listing"]) assert.ok(buyerText.includes(fact), fact);
  assert.doesNotMatch(buyerText, /\\$|AUD|25,000|35,000|Not specified/);
  assert.equal(await evaluate("document.querySelectorAll('button[aria-label=\"Save to favourites\"]').length"), 1);
  assert.equal(await evaluate("document.querySelectorAll('button[aria-label=\"Back to listings\"]').length"), 1);
  await mkdir("generated-artifacts", { recursive: true });
  const capturePage = async file => {
    const shot = await send("Page.captureScreenshot", { format: "jpeg", quality: 85 });
    await writeFile(file, Buffer.from(shot.data, "base64"));
  };
  await capturePage("generated-artifacts/horse-detail-buyer.jpg");
  await send("Emulation.setTouchEmulationEnabled", { enabled: true, configuration: "mobile" });
  await send("Input.dispatchTouchEvent", { type: "touchStart", touchPoints: [{ x: 310, y: 190, id: 1 }] });
  await send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [{ x: 70, y: 190, id: 1 }] });
  await wait("document.querySelector('button[aria-label^=\"Open photo 2 of\"]')");
  assert.match(await evaluate("document.querySelector('img[alt*=\"photo 2\"]')?.alt||''"), /photo 2/);
  await evaluate("document.querySelector('button[aria-label^=\"Open photo\"]').click()");
  await wait("document.querySelector('[role=\"dialog\"][aria-label*=\"photo gallery\"]')");
  assert.equal(await evaluate("document.querySelector('[role=\"dialog\"] button[aria-label=\"Save to favourites\"]')!==null"), true);
  await evaluate("document.querySelector('[role=\"dialog\"] button[aria-label=\"Back to listing\"]').click()");
  await wait("!document.querySelector('[role=\"dialog\"][aria-label*=\"photo gallery\"]')");
  await navigate("/horse/4");
  await wait("document.querySelector('h1')?.textContent.includes('Jasper') && document.querySelector('article')");
  assert.equal(await evaluate("[...document.querySelectorAll('h2')].some(h=>h.textContent.trim()==='Pedigree')"), false);

  await send("Network.clearBrowserCookies");
  await evaluate("localStorage.removeItem('authToken')");
  await login("seller");
  await navigate("/horse/1");
  await wait("document.querySelector('h1')?.textContent.includes('Amber') && document.querySelector('article')");
  const sellerText = await evaluate("document.body.innerText");
  assert.match(sellerText, /You’re viewing your listing/);
  assert.match(sellerText, /Edit listing/);
  assert.doesNotMatch(sellerText, /Contact Seller|Report this listing|Price Range|25,000|35,000/);
  assert.equal(await evaluate("document.querySelectorAll('button[aria-label*=\"favourites\"], button[aria-pressed]').length"), 0);
  await capturePage("generated-artifacts/horse-detail-seller.jpg");
  console.log("Passed normal buyer and seller login; privacy, eight facts, pedigree, photo lightbox, buyer-only actions and owner Edit action verified.");
} finally {
  socket?.close();
  const exit = new Promise(resolve => chrome.once("exit", resolve));
  chrome.kill("SIGTERM");
  await exit;
  await rm(profile, { recursive: true, force: true, maxRetries: 3, retryDelay: 100 });
}
