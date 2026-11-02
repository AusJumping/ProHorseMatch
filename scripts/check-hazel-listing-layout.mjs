import assert from "node:assert/strict";
import { withRedesignBrowser } from "./lib/redesign-browser.mjs";

await withRedesignBrowser(async ({ origin, send, evaluate, wait, navigate, capture, login, api, click }) => {
  const visible = selector => `[...document.querySelectorAll(${JSON.stringify(selector)})].filter(el=>el.getClientRects().length)`;
  const viewport = (width, height, mobile) => send("Emulation.setDeviceMetricsOverride", { width, height, mobile, deviceScaleFactor: 1 });
  const noPrice = async horse => {
    const text = await evaluate("document.querySelector('article')?.innerText||document.body.innerText");
    assert.doesNotMatch(text, /price range|fictional|redesign sample|stock photographs/i);
    for (const amount of [horse.price_min, horse.price_max]) {
      assert.equal(text.includes(String(amount)), false);
      assert.equal(text.includes(Number(amount).toLocaleString("en-AU")), false);
    }
  };
  await login("buyer");
  const buyer = (await api("GET", "/api/auth/me")).data;
  assert.equal(buyer.email, "buyer@redesign.invalid");
  assert.equal(buyer.is_selling, false);
  const horses = (await api("GET", "/api/horses")).data;
  const hazel = horses.find(horse => horse.name === "Hazel");
  const single = horses.find(horse => horse.name === "Finn");
  const empty = horses.find(horse => horse.name === "Jasper");
  assert.ok(hazel && single && empty);
  assert.notEqual(hazel.owner_id, buyer.id);
  const before = JSON.stringify(hazel);
  assert.equal(horses.length, 10);
  for (const horse of horses) assert.doesNotMatch(`${horse.description}\n${horse.additional_info}`, /fictional|redesign sample|stock photographs/i);

  await viewport(1440, 960, false);
  await navigate(`/horse/${hazel.id}`);
  await wait("document.querySelector('article') && document.querySelector('[data-testid=\"redesign-sample-notice\"]')");
  await wait(`${visible('aside button[aria-label*="favourites"]')}.length===1`);
  assert.equal(await evaluate("document.querySelectorAll('[data-testid=\"redesign-sample-notice\"]').length"), 1);
  await noPrice(hazel);
  const desktop = await evaluate(`(()=>{const gallery=document.querySelector('button[aria-label^="Open photo"]').getBoundingClientRect();const aside=document.querySelector('article aside').getBoundingClientRect();return {gallery:{x:gallery.x,y:gallery.y,width:gallery.width},aside:{x:aside.x,y:aside.y,width:aside.width},position:getComputedStyle(document.querySelector('article aside')).position,contact:${visible('button')}.filter(el=>el.textContent.trim()==="Contact Seller").length}})()`);
  assert.equal(desktop.position, "sticky");
  assert.ok(desktop.aside.x > desktop.gallery.x + desktop.gallery.width);
  assert.ok(desktop.gallery.width / desktop.aside.width > 1.6 && desktop.gallery.width / desktop.aside.width < 2.6);
  assert.equal(desktop.contact, 1);
  assert.equal(await evaluate("document.querySelector('[data-testid=\"horse-key-facts\"]').querySelectorAll('dt').length"), 9);
  assert.equal(await evaluate("[...document.querySelectorAll('h2')].some(el=>/^(Level of )?Education$/i.test(el.textContent.trim()))"), false);
  await capture("hazel-refined-desktop");
  await evaluate("window.scrollTo(0,400)");
  await wait("window.scrollY>200");
  const sticky = await evaluate("document.querySelector('article aside').getBoundingClientRect().top");
  assert.ok(sticky >= 0 && sticky < 50, `Summary must remain in view while scrolling, actual top ${sticky}`);
  await evaluate("document.querySelector('[data-testid=\"horse-pedigree\"]').scrollIntoView({block:'center'})");
  await capture("hazel-refined-desktop-pedigree");
  const pedigreeLabels = [["Sire", hazel.sire], ["Dam", hazel.dam], ["Dam sire", hazel.dam_sire]]
    .filter(([, value]) => value?.trim()).map(([label]) => label);
  const pedigree = await evaluate(`(()=>{const card=document.querySelector('[data-testid="horse-pedigree"]');return ${JSON.stringify(pedigreeLabels)}.map(label=>{const el=[...card.querySelectorAll("p")].find(el=>el.textContent===label);const r=el.getBoundingClientRect();return {label,x:r.x,y:r.y}})})()`);
  assert.ok(pedigree.every((field, index) => index === 0 || field.y > pedigree[index - 1].y));
  if (hazel.dam && hazel.dam_sire) {
    assert.ok(pedigree.find(field => field.label === "Dam sire").x > pedigree.find(field => field.label === "Dam").x);
  }
  // Share uses only the public listing address, with a visible fallback.
  await evaluate("window.scrollTo(0,0)");
  await evaluate(`${visible('button[aria-label="Share this horse"]')}[0].click()`);
  await wait("document.querySelector('#horse-share-url')");
  assert.equal(await evaluate("document.querySelector('#horse-share-url').value"), `${origin}/horse/${hazel.id}`);
  await click("Dismiss");
  await click("Contact Seller");
  await wait("document.querySelector('#seller-message')");
  await wait("(()=>{const r=document.querySelector('#seller-message').getBoundingClientRect();return r.top>=0&&r.bottom<=innerHeight})()");
  const composer = await evaluate("(()=>{const r=document.querySelector('#seller-message').getBoundingClientRect();return {top:r.top,bottom:r.bottom,height:innerHeight}})()");
  assert.ok(composer.top >= 0 && composer.bottom <= composer.height, "Contact opens a composer in view");
  assert.equal(await evaluate("[...document.querySelectorAll('button')].find(el=>el.textContent.trim()==='Send message').disabled"), true);
  await click("Cancel");
  await wait("!document.querySelector('#seller-message')");

  await viewport(390, 844, true);
  await navigate(`/horse/${hazel.id}`);
  await wait(`${visible('button[aria-label*="favourites"]')}.length===1`);
  await evaluate("window.scrollTo(0,0)");
  const mobile = await evaluate(`(()=>{const name=${visible('h1')}[0].getBoundingClientRect();const gallery=document.querySelector('button[aria-label^="Open photo"]').getBoundingClientRect();const contact=${visible('button')}.find(el=>el.textContent.trim()==="Contact Seller");const bar=contact.parentElement.parentElement;return {nameTop:name.top,galleryBottom:gallery.bottom,barPosition:getComputedStyle(bar).position,barBottom:bar.getBoundingClientRect().bottom,summaryVisible:${visible('article aside')}.length,bodyWidth:document.documentElement.scrollWidth,width:innerWidth}})()`);
  assert.ok(mobile.nameTop >= mobile.galleryBottom && mobile.nameTop - mobile.galleryBottom < 65);
  assert.equal(mobile.barPosition, "fixed");
  assert.ok(Math.abs(mobile.barBottom - 844) < 2);
  assert.equal(mobile.summaryVisible, 0);
  assert.ok(mobile.bodyWidth <= mobile.width);
  await noPrice(hazel);
  await capture("hazel-refined-mobile");
  // Exercise the existing real gallery; no auth bypass or mocked data.
  await evaluate("document.querySelector('button[aria-label=\"Next photo\"]').click()");
  await wait("document.querySelector('button[aria-label^=\"Open photo 2 of\"]')");
  await evaluate("document.querySelector('button[aria-label^=\"Open photo\"]').click()");
  await wait("document.querySelector('[role=\"dialog\"][aria-label*=\"photo gallery\"]')");
  assert.equal(await evaluate(`${visible('[role="dialog"] button[aria-label*="favourites"]')}.length`), 1);
  await evaluate("document.querySelector('[role=\"dialog\"] button[aria-label=\"Back to listing\"]').click()");
  await wait("!document.querySelector('[role=\"dialog\"][aria-label*=\"photo gallery\"]')");
  await evaluate("document.querySelector('[data-testid=\"horse-pedigree\"]').scrollIntoView({block:'center'})");
  await capture("hazel-refined-mobile-pedigree");
  await evaluate("document.querySelector('[data-testid=\"horse-about\"]').scrollIntoView({block:'center'})");
  await capture("hazel-refined-mobile-about");
  await navigate(`/horse/${single.id}`);
  await wait("document.querySelector('h1')?.textContent==='Finn'");
  const partial = await evaluate("document.querySelector('[data-testid=\"horse-pedigree\"]').innerText");
  assert.match(partial, /Dam/);
  assert.doesNotMatch(partial, /Sire|Dam sire|Not specified/);
  await navigate(`/horse/${empty.id}`);
  await wait("document.querySelector('h1')?.textContent==='Jasper'");
  assert.equal(await evaluate("document.querySelector('[data-testid=\"horse-pedigree\"]')===null"), true);
  assert.match(await evaluate("document.querySelector('article').innerText"), /Pedigree not provided by seller/);
  await login("seller");
  const seller = (await api("GET", "/api/auth/me")).data;
  assert.equal(seller.id, hazel.owner_id);
  for (const [width, height, isMobile] of [[390, 844, true], [1440, 960, false]]) {
    await viewport(width, height, isMobile);
    await navigate(`/horse/${hazel.id}`);
    await wait("document.body.innerText.includes('You’re viewing your listing')");
    assert.equal(await evaluate(`${visible('button[aria-label*="favourites"]')}.length`), 0);
    assert.equal(await evaluate(`${visible('button')}.filter(el=>el.textContent.trim()==="Contact Seller").length`), 0);
    assert.doesNotMatch(await evaluate("document.querySelector('article').innerText"), /Report this listing/);
    await noPrice(hazel);
  }
  assert.equal(JSON.stringify((await api("GET", `/api/horses/${hazel.id}`)).data), before);
  await send("Network.clearBrowserCookies");
  await navigate("/auth");
  await evaluate("localStorage.removeItem('authToken');localStorage.removeItem('user')");
  await navigate(`/horse/${hazel.id}`);
  await wait("document.querySelector('article') && document.querySelector('h1')?.textContent==='Hazel'");
  await wait(`${visible('button[aria-label*="favourites"]')}.length===0`);
  assert.equal(await evaluate(`${visible('button')}.filter(el=>el.textContent.trim()==="Contact Seller").length`), 0);
  console.log("Passed Hazel desktop/mobile: real buyer login, two columns, sticky summary, mobile-only fixed contact, compact white cards, education facts, vertical pedigree, partial/empty pedigree, gallery, sharing, composer visibility, owner/logged-out restrictions, no prices, unchanged horse data.");
}, { port: 9236 });
