import { readFile, writeFile } from "node:fs/promises";

const screens = [
  ["01-photos", "1. Photos", "Multiple photos, a labelled cover image and touch reordering."],
  ["02-facts", "2. Key facts", "The existing listing information, with chips and compact pickers."],
  ["03-pedigree", "3. Pedigree", "Sire, Dam and Dam sire are all optional."],
  ["03-pedigree-reminder", "Optional pedigree reminder", "The seller can add breeding details now or skip."],
  ["04-description", "4. Description", "A comfortable description field; additional information and videos remain available."],
  ["05-price", "5. Private price range", "Seller-only input used for searching. It is absent from buyer previews."],
  ["06-card-preview", "6. Buyer card preview", "Uses the real browse-card presentation; no price or location."],
  ["06-detail-preview", "Buyer horse-page preview", "The buyer view of facts, pedigree and description."],
  ["07-success", "After publishing", "Captured only after the test server created the listing successfully."],
  ["08-edit-pedigree", "Edit any step", "The seller can jump directly to Pedigree and add breeding details."],
  ["08-edit-preview", "Updated pedigree preview", "The seller reviews the new pedigree before saving the changes."],
];
const content = await Promise.all(screens.map(async ([slug, title, description]) => {
  const photo = (await readFile(`generated-artifacts/seller-flow-${slug}.jpg`)).toString("base64");
  return `<section id="s-${slug}"><h2>${title}</h2><p>${description}</p><img src="data:image/jpeg;base64,${photo}" alt="${title}: actual mobile test-seller screen" loading="lazy" width="390" height="844"></section>`;
}));
await writeFile("generated-artifacts/seller-flow-mobile.html", `<!doctype html>
<html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>ProHorseMatch — seller flow review</title>
<style>
*{box-sizing:border-box}html{scroll-behavior:smooth}body{margin:0;background:#e4e2dd;color:#2b2b2b;font:16px/1.6 system-ui,sans-serif}
header{max-width:1050px;margin:auto;padding:40px 24px 24px}h1{font-size:clamp(26px,5vw,40px);line-height:1.2;margin:10px 0}
.eyebrow{color:#705d37;font-size:12px;text-transform:uppercase;letter-spacing:.14em;font-weight:700}
header p{max-width:760px}nav{display:flex;gap:12px;flex-wrap:wrap;margin-top:22px}a{color:#4f442e}
main{max-width:1440px;margin:auto;display:grid;grid-template-columns:repeat(auto-fit,minmax(300px,1fr));gap:28px;padding:24px}
section{min-width:0;background:#fff;border-radius:20px;padding:20px;box-shadow:0 4px 16px #00000008;scroll-margin-top:20px}
section h2{font-size:20px;margin:0}section p{font-size:14px;color:#626159;min-height:68px}img{display:block;max-width:100%;height:auto;margin:0 auto;border-radius:14px;border:1px solid #e7e5de}
footer{max-width:1050px;margin:auto;padding:24px;color:#626159;font-size:14px}
@media(max-width:480px){header{padding:26px 16px 10px}main{padding:16px;grid-template-columns:1fr}section{padding:16px}section p{min-height:0}}
</style><header><div class="eyebrow">ProHorseMatch · redesign only</div><h1>The complete mobile seller flow</h1>
<p>Actual screens captured while signed in through the test-seller account. These are screenshots of the working application, not mockups. Drafts save on the current device. The temporary test listing was created, updated and removed after verification; existing sample listings were left unchanged.</p>
<p>Uploads remain disabled on the isolated test site. These checks reused its existing licensed horse-photo URLs. Nothing in this review updates the live website.</p>
<nav>${screens.map(([slug, title]) => `<a href="#s-${slug}">${title}</a>`).join("")}</nav></header>
<main>${content.join("")}</main><footer>Buyer actions in the seller’s preview are non-mutating. The price step is private seller information; buyer cards and horse pages contain no price range.</footer></html>`);
console.log("Created generated-artifacts/seller-flow-mobile.html");
