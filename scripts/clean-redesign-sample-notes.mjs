import assert from "node:assert/strict";
import { sampleHorses, testOrigin } from "./redesign-sample-horses.mjs";
import { stripSampleNotes } from "./lib/sample-notes.mjs";

const apply = process.argv.includes("--apply");
assert.equal(new URL(testOrigin).hostname, "prohorsematch-redesign.onrender.com");
assert.ok(process.env.REDESIGN_DEMO_PASSWORD, "The isolated test account password is required.");
const request = async (path, { method = "GET", token, body } = {}) => {
  const response = await fetch(testOrigin + path, {
    method, redirect: "error", signal: AbortSignal.timeout(90000),
    headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
  assert.ok(response.ok, `${method} ${path} failed: ${response.status}`);
  return response.json();
};
const guard = async () => {
  const status = await request("/api/redesign-status");
  assert.equal(status.environment, "redesign");
  for (const key of ["outboundEmail", "outboundPush", "payments", "mediaUploads"]) assert.equal(status[key], false);
};
await guard();
const seller = await request("/api/auth/login", { method: "POST", body: {
  email: "seller@redesign.invalid", password: process.env.REDESIGN_DEMO_PASSWORD,
} });
assert.equal(seller.email, "seller@redesign.invalid");
assert.equal(seller.is_selling, true);
assert.ok(seller.auth_token);
const horses = await request("/api/horses/owner", { token: seller.auth_token });
const knownNames = new Set(sampleHorses.map(horse => horse.name));
assert.equal(horses.length, 10, "Unexpected test listing count: stop for review");
assert.ok(horses.every(horse => horse.owner_id === seller.id && knownNames.has(horse.name)));
let changed = 0;
for (const horse of horses) {
  const patch = { description: stripSampleNotes(horse.description), additional_info: stripSampleNotes(horse.additional_info) };
  assert.doesNotMatch(`${patch.description}\n${patch.additional_info}`, /fictional|redesign sample|stock photographs/i, "Unknown notice format: stop for review");
  if (horse.description === patch.description && horse.additional_info === patch.additional_info) continue;
  changed++;
  if (!apply) continue;
  await guard();
  const saved = await request(`/api/horses/${horse.id}`, { method: "PUT", token: seller.auth_token, body: patch });
  assert.equal(saved.description, patch.description);
  assert.equal(saved.additional_info, patch.additional_info);
  for (const key of Object.keys(horse).filter(key => key !== "description" && key !== "additional_info")) {
    assert.deepEqual(saved[key], horse[key], `Unrelated field changed: ${key}`);
  }
}
console.log(JSON.stringify({ environment: "redesign", applied: apply, changedListings: changed, fields: ["description", "additional_info"] }));
