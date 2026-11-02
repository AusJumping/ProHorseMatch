import assert from "node:assert/strict";
import test from "node:test";
import { createRequire } from "node:module";
import { buildSync } from "esbuild";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";

const compiled = buildSync({
  entryPoints: ["client/src/components/horse/HorseListingPresentation.tsx"],
  bundle: true, write: false, format: "cjs", platform: "node", jsx: "automatic",
  external: ["react", "react/*"],
}).outputFiles[0].text;
const module = { exports: {} };
new Function("require", "module", "exports", compiled)(createRequire(import.meta.url), module, module.exports);
const { HorseIdentity, HorseListingSections } = module.exports;
const horse = {
  name: "Hazel", disciplines: ["Eventing"], levels: ["EvA105"], age: 8,
  sex: "Mare", height_hands: 16.1, colour: "Chestnut", breeds: ["Thoroughbred"],
  location_country: "Australia", education_level: "Well educated",
  sire: "Cedar Ridge", dam: "Amber Light", dam_sire: "Northern Star",
  description: "A willing mare with experience in all three phases.",
  additional_info: "Regular farrier and float practice.", price_min: 9876543, price_max: 9999999, currency: "AUD",
};
const sections = (values, isOwner = false) => renderToStaticMarkup(React.createElement(HorseListingSections, { horse: values, isOwner }));

test("listing sections keep education in Key facts, not a separate section, and exclude private prices", () => {
  const html = sections(horse);
  assert.match(html, /data-testid="horse-key-facts"/);
  assert.match(html, /<dt[^>]*>Education<\/dt>/);
  assert.match(html, /Well educated/);
  assert.doesNotMatch(html, /<h2[^>]*>(?:Level of )?Education<\/h2>/);
  assert.doesNotMatch(html, /9876543|9999999|AUD|Price range/);
  assert.ok(html.indexOf("Cedar Ridge") < html.indexOf("Amber Light"));
  assert.ok(html.indexOf("Amber Light") < html.indexOf("Northern Star"));
});
test("partial pedigree shows only the populated field and never an empty placeholder", () => {
  const html = sections({ ...horse, sire: "", dam: "Fern Valley", dam_sire: " " });
  assert.match(html, /data-testid="horse-pedigree"/);
  assert.match(html, /Fern Valley/);
  assert.doesNotMatch(html, />Sire<|>Dam sire<|Not specified|Cedar Ridge|Northern Star/);
});
test("empty pedigree preserves the buyer and owner guidance without an empty pedigree card", () => {
  const empty = { ...horse, sire: "", dam: null, dam_sire: " " };
  const buyer = sections(empty);
  const owner = sections(empty, true);
  assert.doesNotMatch(buyer, /data-testid="horse-pedigree"/);
  assert.match(buyer, /Pedigree not provided by seller/);
  assert.match(owner, /Add pedigree details to help buyers understand this horse/);
});
test("identity uses sire and dam sire in its breeding line and no private range", () => {
  const html = renderToStaticMarkup(React.createElement(HorseIdentity, { horse }));
  assert.match(html, /Hazel/);
  assert.match(html, /Cedar Ridge/);
  assert.match(html, /×/);
  assert.match(html, /Northern Star/);
  assert.doesNotMatch(html, /Amber Light|9876543|9999999|AUD/);
});
