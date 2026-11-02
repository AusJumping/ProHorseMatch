import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

test("locked package downloads are portable to external hosting", () => {
  const lock = JSON.parse(readFileSync(new URL("../package-lock.json", import.meta.url)));
  for (const [name, entry] of Object.entries(lock.packages)) {
    if (!entry.resolved) continue;
    const url = new URL(entry.resolved);
    assert.equal(url.protocol, "https:", `${name} must use HTTPS`);
    assert.ok(!url.hostname.endsWith(".internal"), `${name} must not use an internal registry`);
  }
});
