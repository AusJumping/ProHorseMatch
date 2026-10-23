import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
import postcss from "postcss";
import { isStylePreviewRoute, previewContrast } from "./style-preview";

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
  assert.match(source, /aria-expanded=\{expanded\}/);
});
