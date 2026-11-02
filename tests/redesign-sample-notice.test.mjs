import assert from "node:assert/strict";
import test from "node:test";
import { buildSync } from "esbuild";
import { stripSampleNotes } from "../scripts/lib/sample-notes.mjs";
import { sampleHorses } from "../scripts/redesign-sample-horses.mjs";

const source = buildSync({ entryPoints: ["shared/redesignReview.ts"], bundle: true, write: false, format: "cjs", platform: "node" }).outputFiles[0].text;
const module = { exports: {} };
new Function("module", "exports", source)(module, module.exports);
const { showSampleListingNotice } = module.exports;
const safe = { environment: "redesign", outboundEmail: false, outboundPush: false, payments: false, mediaUploads: false };
test("sample banner cannot appear on the live site, even with a test build and sandbox response", () => {
  for (const host of ["prohorsematch.com", "www.prohorsematch.com", "prohorsematch.onrender.com", "prohorsematch-redesign.onrender.com.evil.invalid"]) {
    assert.equal(showSampleListingNotice("true", host, safe), false);
  }
});
test("sample notice requires the build flag, allowed host and all sandbox protections", () => {
  for (const host of ["prohorsematch-redesign.onrender.com", "127.0.0.1", "localhost", "test.replit.dev"]) {
    assert.equal(showSampleListingNotice("true", host, safe), true);
    assert.equal(showSampleListingNotice(undefined, host, safe), false);
    assert.equal(showSampleListingNotice("false", host, safe), false);
    assert.equal(showSampleListingNotice("true", host, null), false);
    for (const key of ["outboundEmail", "outboundPush", "payments", "mediaUploads"]) {
      assert.equal(showSampleListingNotice("true", host, { ...safe, [key]: true }), false);
      assert.equal(showSampleListingNotice("true", host, { ...safe, [key]: undefined }), false);
    }
  }
});
test("sample-note cleanup removes only the known boilerplate and preserves the horse narrative", () => {
  const notice = "Fictional redesign sample, not for sale. Licensed Pexels stock photographs illustrate this profile; they may show different horses and do not identify a real horse for sale.";
  assert.equal(stripSampleNotes(`A kind mare.\n\nEnjoys outings.\n\n${notice}`), "A kind mare.\n\nEnjoys outings.");
  assert.equal(stripSampleNotes("Handling: good. Veterinary history and suitability are fictional sample information only."), "Handling: good.");
  assert.equal(stripSampleNotes("Schooling confidently at 1.20m."), "Schooling confidently at 1.20m.");
});
test("all ten seed descriptions stay clean while photo licensing provenance remains separate", () => {
  assert.equal(sampleHorses.length, 10);
  for (const horse of sampleHorses) {
    assert.doesNotMatch(`${horse.description}\n${horse.additional_info}`, /fictional|redesign sample|stock photographs/i);
    assert.ok(horse.description.length > 40);
    assert.ok(horse.photos.length >= 3);
  }
});
