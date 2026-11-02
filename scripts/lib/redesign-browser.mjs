import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import WebSocket from "ws";

// Browser tests must refuse any API that cannot prove test-only isolation.
export async function withRedesignBrowser(run, { port = 9235 } = {}) {
  assert.ok(process.env.REDESIGN_DEMO_PASSWORD, "Test account password required");
  const origin = process.env.REPLIT_DEV_DOMAIN
    ? `https://${process.env.REPLIT_DEV_DOMAIN}` : "http://127.0.0.1:5000";
  const statusResponse = await fetch(`${origin}/api/redesign-status`);
  assert.equal(statusResponse.ok, true, "Redesign status must be available");
  const status = await statusResponse.json();
  assert.equal(status.environment, "redesign");
  for (const key of ["outboundEmail", "outboundPush", "payments", "mediaUploads"]) {
    assert.equal(status[key], false, `${key} must be disabled`);
  }
  const profile = await mkdtemp(`${tmpdir()}/phm-seller-flow-`);
  const chrome = spawn("chromium", ["--headless", "--no-sandbox", "--disable-gpu",
    `--remote-debugging-port=${port}`, `--user-data-dir=${profile}`, "about:blank"],
  { stdio: "ignore" });
  let socket;
  try {
    let targets;
    for (let i = 0; i < 80; i++) {
      try { targets = await (await fetch(`http://127.0.0.1:${port}/json`)).json(); break; }
      catch { await new Promise(resolve => setTimeout(resolve, 100)); }
    }
    assert.ok(targets?.length, "Chromium must start");
    socket = new WebSocket(targets.find(target => target.type === "page").webSocketDebuggerUrl);
    await new Promise(resolve => socket.once("open", resolve));
    let sequence = 0;
    const pending = new Map();
    socket.on("message", data => {
      const message = JSON.parse(data);
      if (!message.id) return;
      const task = pending.get(message.id);
      if (!task) return;
      pending.delete(message.id);
      message.error ? task.reject(Error(message.error.message)) : task.resolve(message.result);
    });
    const send = (method, params = {}) => new Promise((resolve, reject) => {
      const id = ++sequence;
      pending.set(id, { resolve, reject });
      socket.send(JSON.stringify({ id, method, params }));
    });
    const evaluate = async expression => {
      const response = await send("Runtime.evaluate", {
        expression, returnByValue: true, awaitPromise: true,
      });
      if (response.exceptionDetails) {
        throw Error(response.exceptionDetails.exception?.description || response.exceptionDetails.text);
      }
      return response.result.value;
    };
    const wait = async condition => {
      for (let i = 0; i < 300; i++) {
        try { if (await evaluate(`Boolean(${condition})`)) return; }
        catch (error) { if (!/navigated|context|closed/i.test(error.message)) throw error; }
        await new Promise(resolve => setTimeout(resolve, 100));
      }
      throw Error(`Timed out waiting for UI: ${condition}`);
    };
    const navigate = async path => {
      await send("Page.navigate", { url: origin + path });
      await wait("document.readyState==='complete' && document.querySelector('#root')?.children.length");
      await evaluate("document.querySelector('[aria-label=\"Skip introduction\"]')?.click()");
      await wait("!document.querySelector('[aria-label=\"Skip introduction\"]')");
    };
    const fill = async (selector, value) => {
      await evaluate(`(()=>{const el=document.querySelector(${JSON.stringify(selector)});if(!el)throw Error("Input missing");el.focus();const proto=el.tagName==="TEXTAREA"?HTMLTextAreaElement.prototype:HTMLInputElement.prototype;Object.getOwnPropertyDescriptor(proto,"value").set.call(el,${JSON.stringify(String(value))});el.dispatchEvent(new Event("input",{bubbles:true}));el.dispatchEvent(new Event("change",{bubbles:true}));})()`);
    };
    const click = async text => {
      await evaluate(`(()=>{const button=[...document.querySelectorAll('button,a')].find(el=>el.getClientRects().length && el.textContent.trim()===${JSON.stringify(text)});if(!button)throw Error("Visible action missing: "+${JSON.stringify(text)});button.click()})()`);
    };
    const api = (method, path, body) => evaluate(`(async()=>{const token=localStorage.getItem("authToken");const response=await fetch(${JSON.stringify(path)},{method:${JSON.stringify(method)},credentials:"include",headers:{"Content-Type":"application/json",...(token?{Authorization:"Bearer "+token}:{})},${body === undefined ? "" : `body:JSON.stringify(${JSON.stringify(body)}),`}});const data=await response.json().catch(()=>null);return {status:response.status,data};})()`);
    const capture = async name => {
      await mkdir("generated-artifacts", { recursive: true });
      await evaluate(`Promise.race([Promise.all([...document.querySelectorAll('img')].filter(img=>{const r=img.getBoundingClientRect();return r.bottom>0&&r.top<innerHeight}).map(img=>img.decode().catch(()=>undefined))),new Promise(resolve=>setTimeout(resolve,5000))])`);
      await new Promise(resolve => setTimeout(resolve, 600));
      const image = await send("Page.captureScreenshot", { format: "jpeg", quality: 85 });
      const path = `generated-artifacts/${name}.jpg`;
      await writeFile(path, Buffer.from(image.data, "base64"));
      return path;
    };
    const login = async role => {
      await send("Network.clearBrowserCookies");
      await navigate("/auth");
      await evaluate("localStorage.removeItem('authToken');localStorage.removeItem('user')");
      await navigate("/auth");
      await wait("document.querySelector('input[name=\"email\"]')");
      for (const [name, value] of [["email", `${role}@redesign.invalid`],
        ["password", process.env.REDESIGN_DEMO_PASSWORD]]) {
        await evaluate(`document.querySelector('input[name="${name}"]').focus()`);
        await send("Input.insertText", { text: value });
      }
      await evaluate("document.querySelector('input[name=\"password\"]').closest('form').requestSubmit()");
      await wait("Boolean(localStorage.getItem('authToken'))");
    };
    await send("Page.enable");
    await send("Runtime.enable");
    await send("Emulation.setDeviceMetricsOverride", {
      width: 390, height: 844, deviceScaleFactor: 1, mobile: true,
    });
    await run({ origin, send, evaluate, wait, navigate, fill, click, api, capture, login });
  } finally {
    socket?.close();
    if (chrome.exitCode === null && chrome.signalCode === null) {
      const exited = new Promise(resolve => chrome.once("exit", resolve));
      chrome.kill("SIGTERM");
      await exited;
    }
    await rm(profile, { recursive: true, force: true, maxRetries: 3, retryDelay: 100 });
  }
}
