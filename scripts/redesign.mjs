import { spawnSync } from "node:child_process";
import { redesignEnvironment } from "./redesign-safety.mjs";

const mode = process.argv[2];
if (!["build", "start", "dev", "setup"].includes(mode)) {
  throw new Error("Expected redesign mode: build, start, dev or setup.");
}
let env;
try {
  env = redesignEnvironment(process.env);
} catch (error) {
  console.error(error.message);
  process.exit(1);
}

function run(command, args, extra = {}) {
  const child = spawnSync(command, args, {
    env: { ...env, ...extra }, stdio: "inherit",
  });
  if (child.error) throw new Error(`Unable to start ${command}.`);
  if (child.status !== 0) process.exit(child.status ?? 1);
}

if (mode === "build") {
  run("npm", ["run", "build"]);
} else {
  // Checks that the database is empty or marked as this sandbox BEFORE
  // applying the schema. No production database or storage imports are used.
  run("node", ["--import", "tsx", "scripts/redesign-data.ts"]);
  if (mode === "start") run("node", ["dist/index.js"], { NODE_ENV: "production" });
  if (mode === "dev") run("node", ["--import", "tsx", "server/index.ts"], { NODE_ENV: "development" });
}
