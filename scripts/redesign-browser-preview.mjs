// Workspace-only full frontend preview against the isolated Render TEST API.
// No local server/database imports, no live-site fallback, no automatic sign-in.
import { createServer } from "vite";
import { testOrigin } from "./redesign-sample-horses.mjs";

const response = await fetch(`${testOrigin}/api/redesign-status`, {
  redirect: "error", signal: AbortSignal.timeout(90000),
});
if (!response.ok) throw Error("Cannot confirm redesign test API isolation.");
const status = await response.json();
if (status.environment !== "redesign" ||
    ["outboundEmail", "outboundPush", "payments", "mediaUploads"].some(key => status[key] !== false)) {
  throw Error("Redesign test protections are not enabled. Preview refused.");
}
process.env.VITE_REDESIGN_SANDBOX = "true";
const server = await createServer({
  define: { "import.meta.env.VITE_REDESIGN_SANDBOX": JSON.stringify("true") },
  server: {
    host: "0.0.0.0", port: 5000, strictPort: true, allowedHosts: true,
    proxy: { "/api": { target: testOrigin, changeOrigin: true, secure: true } },
  },
});
await server.listen();
console.log("Redesign browser preview ready on port 5000; API is the isolated Render test site.");
