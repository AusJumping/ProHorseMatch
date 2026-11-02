// Test fixture only: no server/app imports, database or outbound integrations.
import { build } from "esbuild";
import { execFileSync } from "node:child_process";
import { createServer } from "node:http";
import { mkdir, readFile, writeFile } from "node:fs/promises";

const output = "generated-artifacts/browse-components";
await mkdir(output, { recursive: true });
await build({
  entryPoints: ["tests/fixtures/browse.tsx"],
  bundle: true, outfile: `${output}/fixture.js`, jsx: "automatic",
  alias: { "@": `${process.cwd()}/client/src` },
});
execFileSync("node_modules/.bin/tailwindcss", ["-i", "client/src/index.css", "-o", `${output}/style.css`], { stdio: "inherit" });
await writeFile(`${output}/index.html`, `<!doctype html><html><head><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex"><title>Browse component test</title><link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Playfair+Display:wght@400;500;600;700&family=Montserrat:wght@500;600;700&display=swap" rel="stylesheet"><link rel="stylesheet" href="/style.css"><link rel="icon" href="data:,"></head><body><div id="root"></div><script src="/fixture.js"></script></body></html>`);
const paths = {
  "/": [`${output}/index.html`, "text/html"],
  "/fixture.js": [`${output}/fixture.js`, "text/javascript"],
  "/style.css": [`${output}/style.css`, "text/css"],
  "/horse.jpg": ["client/public/style-preview/horse.jpg", "image/jpeg"],
};
createServer(async (request, response) => {
  const asset = paths[new URL(request.url, "http://fixture").pathname];
  if (!asset) { response.writeHead(404).end(); return; }
  try {
    response.writeHead(200, { "Content-Type": asset[1], "Cache-Control": "no-store" });
    response.end(await readFile(asset[0]));
  } catch { response.writeHead(500).end("Fixture asset unavailable"); }
}).listen(5173, "0.0.0.0", () => console.log("Isolated browse component fixture on port 5173"));
