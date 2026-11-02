import assert from "node:assert/strict";
import test from "node:test";
import { createRequire } from "node:module";
import { buildSync } from "esbuild";

const require = createRequire(import.meta.url);
const compiled = buildSync({
  entryPoints: ["client/src/components/listing/listing-model.ts"],
  bundle: true, write: false, platform: "node", format: "cjs",
}).outputFiles[0].text;
const module = { exports: {} };
new Function("require", "module", "exports", compiled)(require, module, module.exports);
const {
  freshListing, editableListingValues, validateListing, validateListingStep, getBuyerDetailFields, getBuyerPedigree,
  AGE_OPTIONS_CREATE, AGE_OPTIONS_EDIT, HEIGHT_OPTIONS_CREATE, HEIGHT_OPTIONS_EDIT,
} = module.exports;
const valid = () => ({
  ...freshListing(100),
  name: "Willow", location_country: "Australia", disciplines: ["Jumping"], levels: ["1.20m"],
  breeds: ["Warmblood"], age: 8, height_hands: 16.1, sex: "Mare", colour: "Bay",
  education_level: "Well educated", description: "Fictional test horse.",
  photos: ["https://example.invalid/licensed-test-photo.jpg"], price_min: 25000, price_max: 35000,
});

test("approved exception: all pedigree fields are optional in create and edit", () => {
  for (const mode of ["create", "edit"]) {
    for (const pedigree of [{ sire: "", dam: "", dam_sire: "" }, { sire: "Cedar Ridge" }, { dam: "Amber Light" }, { dam_sire: "Northern Star" }]) {
      assert.equal(validateListing(mode, { ...valid(), ...pedigree }), null);
    }
  }
});
test("create preserves required fields, including description at Next and publish", () => {
  for (const [key, value] of Object.entries({
    name: "", location_country: "", disciplines: [], levels: [], breeds: [], age: undefined,
    height_hands: undefined, sex: "", colour: "", education_level: "", description: "",
    photos: [], price_min: undefined, price_max: undefined, currency: "",
  })) {
    assert.ok(validateListing("create", { ...valid(), [key]: value }), `${key} remains required`);
  }
  assert.ok(validateListingStep("create", { ...valid(), description: "" }, "description").length);
});
test("edit preserves optional fields and zero-valued filtering prices", () => {
  const edited = { ...valid(), levels: [], education_level: "", description: "", colour: "", photos: [], price_min: 0, price_max: 0 };
  assert.equal(validateListing("edit", edited), null);
  assert.equal(validateListingStep("edit", edited, "description").length, 0);
  assert.ok(validateListing("create", edited));
});
test("invalid numeric values and reversed price ranges do not publish", () => {
  for (const mode of ["create", "edit"]) {
    for (const [key, value] of [["age", NaN], ["age", -1], ["age", 31], ["height_hands", Infinity],
      ["height_hands", null], ["height_hands", ""], ["height_hands", 9], ["height_hands", 21],
      ["price_min", NaN], ["price_max", Infinity], ["price_max", -1]]) {
      assert.ok(validateListing(mode, { ...valid(), [key]: value }), `${mode}: ${key} ${value}`);
    }
    assert.ok(validateListing(mode, { ...valid(), price_min: 35000, price_max: 25000 }));
    assert.equal(validateListing(mode, { ...valid(), height_hands: "young_horse" }), null);
  }
});
test("existing create/edit picker choices stay distinct and retain their endpoints", () => {
  assert.equal(AGE_OPTIONS_CREATE[0], 0);
  assert.equal(AGE_OPTIONS_CREATE.at(-1), 20);
  assert.equal(AGE_OPTIONS_EDIT.at(-1), 16);
  assert.equal(HEIGHT_OPTIONS_CREATE[0], 13);
  assert.equal(HEIGHT_OPTIONS_CREATE.at(-1), 18);
  assert.equal(HEIGHT_OPTIONS_EDIT.at(-1), 18.3);
  assert.ok(HEIGHT_OPTIONS_CREATE.includes(16.1));
  assert.ok(HEIGHT_OPTIONS_EDIT.includes(16.3));
});
test("shared buyer facts have exactly eight labels and never contain a price", () => {
  const facts = getBuyerDetailFields(valid());
  assert.deepEqual(facts.map(([label]) => label), ["Discipline", "Level", "Age", "Sex", "Height", "Colour", "Breed", "Country"]);
  assert.doesNotMatch(JSON.stringify(facts), /25000|35000|AUD|Price/);
});
test("shared pedigree hides empty or whitespace-only fields", () => {
  assert.deepEqual(getBuyerPedigree(valid()), []);
  assert.deepEqual(getBuyerPedigree({ ...valid(), sire: "Cedar Ridge", dam: " ", dam_sire: "Northern Star" }),
    [["Sire", "Cedar Ridge"], ["Dam sire", "Northern Star"]]);
});
test("submission excludes read-only server metadata even from older drafts", () => {
  const values = editableListingValues({
    ...valid(), height_cm: 164, additional_info: "Seller information",
    other_disciplines: ["Eventing"], videos: ["https://example.invalid/horse.mp4"],
    id: 99, created_at: "2026-10-24T00:00:00Z", featured_order: 1,
  });
  for (const key of ["id", "created_at", "featured_order"]) assert.equal(Object.hasOwn(values, key), false);
  assert.equal(values.height_cm, 164);
  assert.equal(values.additional_info, "Seller information");
  assert.deepEqual(values.other_disciplines, ["Eventing"]);
  assert.equal(values.videos.length, 1);
});
