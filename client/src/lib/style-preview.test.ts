import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
import postcss from "postcss";
import { horseDisciplines, isStylePreviewRoute, pedigreeDetails, previewContrast } from "./style-preview";

test("preview requires the literal opt-in and exact path", () => {
  assert.equal(isStylePreviewRoute("true", "/style-preview"), true);
  assert.equal(isStylePreviewRoute("true", "/style-preview/"), true);
  for (const flag of [undefined, false, true, "", "false", "1", "TRUE"]) {
    assert.equal(isStylePreviewRoute(flag, "/style-preview"), false);
  }
  for (const path of ["/", "/auth", "/filter", "/style-preview-extra", "/style-preview/horse", "/STYLE-PREVIEW"]) {
    assert.equal(isStylePreviewRoute("true", path), false);
  }
});

test("all approved active text pairs pass WCAG AA normal-text contrast", () => {
  for (const background of ["#ffffff", "#e4e2dd", "#cdac6e"]) {
    assert.ok(previewContrast("#2b2b2b", background) >= 4.5);
  }
  assert.ok(previewContrast("#ffffff", "#2b2b2b") >= 4.5);
  assert.ok(previewContrast("#ffffff", "#cdac6e") < 4.5);
  assert.equal(previewContrast("#2b2b2b", "#2b2b2b"), 1);
});

test("every preview CSS selector is namespaced, with no root or dark token edits", () => {
  const css = readFileSync(new URL("../pages/style-preview.css", import.meta.url), "utf8");
  const root = postcss.parse(css);
  root.walkRules((rule) => {
    if (rule.parent?.type === "atrule" && rule.parent.name === "keyframes") return;
    for (const selector of rule.selectors) {
      assert.ok(selector.trim().startsWith(".phm-style-preview"), selector);
    }
  });
  assert.equal(css.includes(":root"), false);
  assert.equal(css.includes(".dark"), false);
});

test("preview is static, no-index and uses only the local photograph", () => {
  const source = readFileSync(new URL("../pages/style-preview.tsx", import.meta.url), "utf8");
  assert.match(source, /name="robots" content="noindex, nofollow, noarchive"/);
  assert.match(source, /src=\{`\/style-preview\/horse\.jpg/);
  assert.doesNotMatch(source, /\bfetch\(|apiRequest|useAuth|useQuery|localStorage|sessionStorage/);
  assert.match(source, /aria-pressed=\{saved\}/);
  assert.match(source, /aria-expanded=\{false\}/);
  assert.match(source, /new URLSearchParams\(window\.location\.search\)\.get\("details"\) === "open"/);
});

test("expanded horse profile follows the approved photo-led detail layout", () => {
  const source = readFileSync(new URL("../pages/style-preview.tsx", import.meta.url), "utf8");
  const css = postcss.parse(readFileSync(new URL("../pages/style-preview.css", import.meta.url), "utf8"));
  const cardStart = source.indexOf('<article className="sp-horse-card"');
  const cardEnd = source.indexOf("</article>", cardStart);
  assert.ok(cardStart >= 0 && cardEnd > cardStart);
  const card = source.slice(cardStart, cardEnd);

  for (const text of [
    "Discipline", "horseDisciplines[0]", "Height", "16.2 hands", "Age", "8 years",
    "Sex", "Gelding", "Breed", "Warmblood", "Location", "Southern Highlands, NSW",
    "Level of Education", "Established competition horse", "About",
    "Pedigree", "Contact Seller", "Report this listing",
  ]) {
    assert.ok(source.includes(text), text);
  }
  assert.match(card, /sp-photo-expanded/);
  assert.doesNotMatch(card, /18,500|sp-horse-price/);
  assert.match(card, /pedigree\.length > 0/);
  assert.match(card, /aria-label="Close horse profile"/);
  assert.match(card, /className="sp-photo-control sp-save"/);
  assert.match(card, /className="sp-btn" type="button" onClick=\{\(\) => setActionFeedback\("Contact Seller is a preview only\. No message was sent\."\)\}/);
  assert.doesNotMatch(card, /Close sample profile|>Back<\/button|>Favourite<\/button|Favourited|Fictional illustration|Illustrative profile|not a live listing/);
  assert.match(source, /A fictional horse profile for style review; this is not a live listing\./);
  assert.match(source, /setActionFeedback\("Report this listing is a preview only\. No report was submitted\."\)/);
  assert.doesNotMatch(source, /fetch\(|apiRequest|\/api\/messages|\/api\/reports/);
  assert.match(source, /get\("details"\) === "open"/);

  const selectors = new Set<string>();
  const declarations = new Map<string, Array<import("postcss").Declaration>>();
  css.walkRules((rule) => {
    rule.selectors.forEach((selector) => selectors.add(selector));
    for (const selector of rule.selectors) {
      const existing = declarations.get(selector) ?? [];
      declarations.set(selector, [
        ...existing,
        ...rule.nodes.filter((node): node is import("postcss").Declaration => node.type === "decl"),
      ]);
    }
  });

  assert.ok(selectors.has(".phm-style-preview .sp-photo-expanded"));
  assert.ok(selectors.has(".phm-style-preview .sp-facts-grid"));
  assert.ok(selectors.has(".phm-style-preview .sp-detail-report"));
  assert.ok(selectors.has(".phm-style-preview .sp-contact-dock"));
  assert.ok(selectors.has(".phm-style-preview .sp-contact-dock .sp-btn"));
  assert.equal(selectors.has(".phm-style-preview .sp-card-body .sp-btn"), false);

  const mobileDock = declarations.get(".phm-style-preview .sp-contact-dock") ?? [];
  assert.ok(mobileDock.some(({ prop, value }) => prop === "position" && value === "fixed"));
  assert.ok(mobileDock.some(({ prop, value }) => prop === "padding" && value.includes("safe-area-inset-bottom")));
  const cardBody = declarations.get(".phm-style-preview .sp-card-body-expanded") ?? [];
  assert.ok(cardBody.some(({ prop, value }) => prop === "padding-bottom" && value.includes("safe-area-inset-bottom")));
  const report = declarations.get(".phm-style-preview .sp-detail-report") ?? [];
  assert.ok(report.some(({ prop, value }) => prop === "font-size" && value === "14px"));
  assert.ok(report.some(({ prop, value }) => prop === "text-decoration" && value === "none"));
});

test("pedigree hides absent fields and preserves supplied ancestors", () => {
  assert.deepEqual(pedigreeDetails({}), []);
  assert.deepEqual(pedigreeDetails({ sire: "  ", dam: null }), []);
  assert.deepEqual(pedigreeDetails({ sire: " Oakwood ", dam_sire: "Regent" }), [
    { label: "Sire", value: "Oakwood" },
    { label: "Dam Sire", value: "Regent" },
  ]);
  assert.deepEqual(pedigreeDetails({ sire: "Sire", dam: "Dam", dam_sire: "Dam Sire" }).map(x => x.label), ["Sire", "Dam", "Dam Sire"]);
});

test("discipline names match the product", () => {
  assert.deepEqual(horseDisciplines, ["Jumping", "Dressage", "Eventing"]);
});
