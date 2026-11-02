import test from "node:test";
import assert from "node:assert/strict";
import { sampleHorses, photoSources, testOrigin } from "../scripts/redesign-sample-horses.mjs";

test("ten realistic test-only samples preserve filtering and optional pedigree coverage", () => {
  assert.equal(testOrigin, "https://prohorsematch-redesign.onrender.com");
  assert.equal(sampleHorses.length, 10);
  assert.equal(new Set(sampleHorses.map(h => h.name)).size, 10);
  assert.deepEqual(new Set(sampleHorses.flatMap(h => h.disciplines)), new Set(["Jumping", "Dressage", "Eventing"]));
  for (const h of sampleHorses) {
    assert.ok(!h.name.includes("Demo"));
    assert.equal(h.location_country, "Australia");
    assert.ok(h.price_min < h.price_max);
    assert.equal(h.photos.length, 3);
    assert.equal(new Set(h.photos).size, 3);
    assert.doesNotMatch(`${h.description}\n${h.additional_info}`, /Fictional redesign sample|fictional sample information|stock photographs/i);
    assert.match(h.additional_info, /NSW|VIC|QLD|SA|WA|TAS|ACT|NT/);
  }
  assert.ok(sampleHorses.some(h => h.sire && h.dam && h.dam_sire));
  assert.ok(sampleHorses.some(h => !h.sire && !h.dam && !h.dam_sire));
  assert.ok(sampleHorses.some(h => h.sire && !h.dam_sire));
  assert.equal(photoSources.length, 30);
  assert.ok(photoSources.every(p => p.license === "https://www.pexels.com/license/"));
});
