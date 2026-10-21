import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
import { buildSync } from "esbuild";

const bundled = buildSync({
  entryPoints: ["server/seoPages.ts"],
  bundle: true, write: false, format: "esm", platform: "node",
}).outputFiles[0].text;
const seo = await import(`data:text/javascript;base64,${Buffer.from(bundled).toString("base64")}`);
const template = readFileSync("client/index.html", "utf-8");
const BASE = "https://prohorsematch.com";

const horse = {
  id: 118, name: "Finch Farm Whitaker", location_country: "Australia",
  disciplines: ["showjumping"], levels: ["1.10m"], breeds: ["warmblood"], age: 8,
  height_hands: 16.2, height_cm: null, sex: "Gelding", colour: "Bay",
  sire: "Massimo Quality", dam: "Weinfee", dam_sire: null,
  price_min: 50000, price_max: 50000, currency: "AUD",
  description: "First paragraph.\n\nSecond paragraph with <b>tags</b> & symbols.",
  photos: ["https://res.cloudinary.com/x/image/upload/v1/horse.jpg"],
  created_at: new Date("2026-05-01T00:00:00Z"),
};

test("page has the listing's name, details and price in plain HTML", () => {
  const html = seo.buildHorsePage(template, horse, BASE);
  assert.match(html, /<title>Finch Farm Whitaker \| 8yo Warmblood gelding for sale \| Pro Horse Match<\/title>/);
  assert.match(html, /<h1>Finch Farm Whitaker<\/h1>/);
  for (const text of ["16.2hh", "Bay", "Gelding", "Warmblood", "Showjumping", "1.10m", "Massimo Quality", "Weinfee", "Australia", "A$50,000"]) {
    assert.ok(html.includes(text), `missing ${text}`);
  }
  assert.match(html, /<link rel="canonical" href="https:\/\/prohorsematch.com\/horse\/118" \/>/);
  assert.match(html, /property="og:image" content="https:\/\/res.cloudinary.com\/x\/image\/upload\/v1\/horse.jpg"/);
});

test("the app itself is untouched: script, root and loader are still there", () => {
  const html = seo.buildHorsePage(template, horse, BASE);
  assert.ok(html.includes('<script type="module" src="/src/main.tsx"></script>'));
  assert.ok(html.includes('<div id="root">'));
  assert.equal((html.match(/<title>/g) || []).length, 1);
});

test("structured data is valid JSON with price and properties", () => {
  const html = seo.buildHorsePage(template, horse, BASE);
  const json = html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/)[1];
  const data = JSON.parse(json);
  assert.equal(data["@type"], "Product");
  assert.equal(data.offers["@type"], "Offer");
  assert.equal(data.offers.price, 50000);
  assert.equal(data.offers.priceCurrency, "AUD");
  assert.ok(data.additionalProperty.some(p => p.name === "Height" && p.value === "16.2hh"));
  assert.deepEqual(data.image, ["https://res.cloudinary.com/x/image/upload/v1/horse.jpg"]);
});

test("seller text is escaped, so it can never inject markup or break the JSON", () => {
  const evil = { ...horse, name: 'X</title><script>alert(1)</script>', description: '</script><img src=x onerror=alert(1)>' };
  const html = seo.buildHorsePage(template, evil, BASE);
  assert.ok(!html.includes("<script>alert(1)"));
  assert.ok(!html.includes("<img src=x onerror"));
  const json = html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/)[1];
  assert.equal(JSON.parse(json).name, evil.name);
});

test("price wording: range, no maximum, unpriced", () => {
  assert.equal(seo.priceText({ price_min: 20000, price_max: 40000, currency: "AUD" }), "A$20,000 to A$40,000");
  assert.equal(seo.priceText({ price_min: 20000, price_max: 999999999, currency: "NZD" }), "NZ$20,000");
  assert.equal(seo.priceText({ price_min: 0, price_max: 30000, currency: "AUD" }), "up to A$30,000");
  assert.equal(seo.priceText({ price_min: 0, price_max: 0, currency: "AUD" }), null);
  const range = seo.structuredData({ ...horse, price_min: 20000, price_max: 40000 }, BASE);
  assert.equal(range.offers["@type"], "AggregateOffer");
  assert.equal(range.offers.lowPrice, 20000);
  assert.equal(seo.structuredData({ ...horse, price_min: 0, price_max: 0 }, BASE).offers, undefined);
});

test("a sparse listing still builds without errors", () => {
  const html = seo.buildHorsePage(template, { id: 5, name: "Bare", price_min: 0, price_max: 0, photos: [] }, BASE);
  assert.match(html, /<h1>Bare<\/h1>/);
  assert.ok(!html.includes('property="og:image"'));
  assert.match(html, /twitter:card" content="summary"/);
});

test("robots.txt keeps private areas out and points to the sitemap", () => {
  const robots = seo.robotsTxt(BASE);
  assert.match(robots, /^User-agent: \*\nAllow: \//);
  for (const p of ["/api/", "/admin", "/messages", "/profile"]) assert.ok(robots.includes(`Disallow: ${p}`));
  assert.ok(robots.includes("Sitemap: https://prohorsematch.com/sitemap.xml"));
  assert.ok(!/GPTBot|ClaudeBot|Disallow: \/\n/.test(robots), "AI crawlers must not be blocked");
});

test("sitemap lists the home page and every listing", () => {
  const xml = seo.sitemapXml([horse, { id: 7, name: "B", created_at: null }], BASE);
  assert.ok(xml.includes("<loc>https://prohorsematch.com/</loc>"));
  assert.ok(xml.includes("<loc>https://prohorsematch.com/horse/118</loc><lastmod>2026-05-01</lastmod>"));
  assert.ok(xml.includes("<loc>https://prohorsematch.com/horse/7</loc></url>"));
});
