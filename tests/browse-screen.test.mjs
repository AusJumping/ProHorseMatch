import assert from "node:assert/strict";
import test from "node:test";
import { buildSync } from "esbuild";
import { createRequire } from "node:module";
import { readFileSync } from "node:fs";
import { renderToStaticMarkup } from "react-dom/server";
import React from "react";
import { Router } from "wouter";

const require = createRequire(import.meta.url);
function load(path, withCurrencyProvider = false) {
  const compiled = buildSync({
    ...(withCurrencyProvider ? {
      stdin: {
        contents: `export { default } from "./${path}"; export { CurrencyProvider } from "./client/src/contexts/CurrencyContext";`,
        resolveDir: process.cwd(), loader: "tsx",
      },
    } : { entryPoints: [path] }),
    bundle: true, write: false, platform: "node",
    format: "cjs", packages: "external", jsx: "automatic",
    alias: { "@": `${process.cwd()}/client/src` },
  }).outputFiles[0].text;
  const module = { exports: {} };
  new Function("require", "module", "exports", compiled)(require, module, module.exports);
  return module.exports;
}
const { isRecentlyAdded, formatHorseAge, formatHorseHeight } = load("client/src/components/browse/presentation.ts");
const Grid = load("client/src/components/browse/BrowseHorseGrid.tsx").default;
const { default: QuickFilters, CurrencyProvider } = load("client/src/components/browse/BrowseQuickFilters.tsx", true);
const baseProps = {
  pendingSaveIds: new Set(), isLoading: false, isError: false,
  currentUserId: 2,
  onRetry() {}, onToggleSaved: async () => true,
};
const horse = {
  id: 42, owner_id: 1, name: "Fictional listing", photos: [], disciplines: ["Jumping"], levels: ["1.20m"],
  sex: "Mare", colour: "Bay", additional_info: "Based in Bowral, NSW.",
  height_hands: 16.2, age: 7, location_country: "Australia",
  currency: "AUD", price_min: 50000, price_max: 50000,
  created_at: new Date(),
};
const render = (element) => renderToStaticMarkup(React.createElement(Router, { ssrPath: "/filter" }, React.createElement(CurrencyProvider, null, element)));

test("New badge includes only valid timestamps within the last seven days", () => {
  const now = Date.parse("2026-10-23T00:00:00Z");
  assert.equal(isRecentlyAdded(new Date(now), now), true);
  assert.equal(isRecentlyAdded(new Date(now - 7 * 86400000).toISOString(), now), true);
  for (const date of [null, undefined, "", "invalid", new Date(now + 1), new Date(now - 7 * 86400000 - 1)]) {
    assert.equal(isRecentlyAdded(date, now), false);
  }
});
test("metadata preserves hands and handles missing values", () => {
  assert.equal(formatHorseHeight(16.2), "16.2hh");
  assert.equal(formatHorseHeight(null), "Height unlisted");
  assert.equal(formatHorseHeight("young_horse"), "Young horse");
  assert.equal(formatHorseAge(1), "1 year");
  assert.equal(formatHorseAge(0), "0 years");
  assert.equal(formatHorseAge(undefined), "Age unlisted");
});
test("browse exposes distinct loading, failure, and empty states", () => {
  const grid = (props) => render(React.createElement(Grid, { ...baseProps, ...props }));
  assert.match(grid({ isLoading: true }), /Loading horses/);
  assert.match(grid({ isError: true }), /Retry search/);
  assert.doesNotMatch(grid({ isError: true }), /0 horses found/);
  assert.match(grid({ horses: [] }), /0 horses found/);
});
test("cards expose a profile link and independent accessible save control", () => {
  const html = render(React.createElement(Grid, { ...baseProps, horses: [horse] }));
  assert.match(html, /href="\/horse\/42"/);
  assert.match(html, /aria-label="Save Fictional listing"/);
  assert.match(html, /Jumping/);
  assert.doesNotMatch(html, /aria-label="Price"|Loading price|50,000/);
  assert.match(html, /16\.2hh/);
  assert.match(html, /7yo Mare · 16\.2hh · Bay/);
  assert.match(html, /Jumping · 1\.20m/);
  assert.doesNotMatch(html, /NSW|Australia|MapPin|Location/);
  assert.match(html, /View horse/);
  assert.match(html, /Photo unavailable/);
  assert.match(html, />New</);
  assert.match(html, /bg-\[#cdac6e\][^>]*text-white/);
  assert.match(html, /grid-cols-1/);
  assert.match(html, /lg:grid-cols-3/);
  assert.doesNotMatch(html.match(/<a\b[^>]*>[\s\S]*?<\/a>/)?.[0] ?? "", /<button/);
});
test("hearts are absent on own horses and logged-out cards", () => {
  for (const props of [{ currentUserId: 1 }, { currentUserId: undefined }]) {
    const html = render(React.createElement(Grid, { ...baseProps, ...props, horses: [horse] }));
    assert.doesNotMatch(html, /aria-label="Save |aria-pressed/);
    assert.match(html, /View horse/);
  }
});
test("Australian state parsing omits unknown locations and ignores unrelated prose", () => {
  const { getAustralianState } = load("client/src/components/browse/presentation.ts");
  assert.equal(getAustralianState("Based in Bowral, NSW."), "NSW");
  assert.equal(getAustralianState("Located in Serpentine, Western Australia."), "WA");
  assert.equal(getAustralianState("Not sure. Lovely horse in Australia"), null);
  assert.equal(getAustralianState("Previous owner in NSW. Travels to VIC."), null);
  assert.equal(getAustralianState(null, "QLD"), "QLD");
});
test("saved and pending controls reflect match state", () => {
  const html = render(React.createElement(Grid, {
    ...baseProps, horses: [horse], pendingSaveIds: new Set([42]),
    matches: [{ horse_id: 42, is_liked: true }],
  }));
  assert.match(html, /aria-pressed="true"/);
  assert.match(html, /Remove Fictional listing from saved horses/);
  assert.match(html, /disabled=""/);
});
test("owners can open their listing but cannot save it; other users keep the save control", () => {
  const props = { ...baseProps, horses: [{ ...horse, owner_id: 2 }] };
  const ownerHtml = render(React.createElement(Grid, { ...props, currentUserId: 2 }));
  assert.match(ownerHtml, /href="\/horse\/42"/);
  assert.doesNotMatch(ownerHtml, /aria-label="Save Fictional listing"/);
  for (const currentUserId of [1, 3]) {
    const html = render(React.createElement(Grid, { ...props, currentUserId }));
    assert.match(html, /aria-label="Save Fictional listing"/);
  }
});
test("all six quick filters are present and selected discipline is announced", () => {
  const html = render(React.createElement(QuickFilters, {
    activeFilters: {
      disciplines: ["Jumping"], price_min: null, price_max: null,
      height_min: null, height_max: null, age_min: null, age_max: null, currency: "AUD",
    }, onDisciplineToggle() {}, onApplyRange() {},
  }));
  for (const text of ["Jumping", "Dressage", "Eventing", "Price", "Height", "Age"]) assert.match(html, new RegExp(text));
  assert.match(html, /aria-pressed="true"/);
  assert.match(html, /overflow-x-auto/);
});
test("numeric range has two separately named slider thumbs and uses existing query fields", () => {
  const quick = readFileSync("client/src/components/browse/BrowseQuickFilters.tsx", "utf8");
  assert.match(quick, /\["Minimum", "Maximum"\]\.map/);
  assert.match(quick, /aria-label=\{`\$\{bound\} \$\{activeRange\}`\}/);
  const home = readFileSync("client/src/pages/home.tsx", "utf8");
  for (const name of ["min_price", "max_price", "min_height", "max_height", "min_age", "max_age"]) assert.match(home, new RegExp(name));
  assert.match(home, /fetch\('\/api\/matches'/);
  assert.match(home, /credentials: 'include'/);
  assert.match(home, /Filters\{activeFilterChips\.length/);
  assert.doesNotMatch(home, /currentHorseIndex=\{0\}/);
});
test("quick chips accurately label advanced bounds outside normal slider ranges", () => {
  const html = render(React.createElement(QuickFilters, {
    activeFilters: {
      disciplines: [], price_min: 600000, price_max: 900000,
      height_min: 10.2, height_max: 18.3, age_min: 35, age_max: 40, currency: "AUD",
    }, onDisciplineToggle() {}, onApplyRange() {},
  }));
  for (const label of ["600,000", "900,000", "10.2 hh", "18.3 hh", "35 years", "40 years"]) assert.ok(html.includes(label), label);
});
