import assert from "node:assert/strict";
import { resolve } from "node:path";
import { withRedesignBrowser } from "./lib/redesign-browser.mjs";

// Normal seller login and real writes ONLY to the independently guarded test API.
// Reuse licensed sample photo URLs because uploads remain intentionally disabled.
await withRedesignBrowser(async ({ origin, send, evaluate, wait, navigate, fill, click, api, capture, login }) => {
  const step = id => wait(`document.querySelector('[data-listing-step="${id}"]')`);
  const setField = async (label, value) => {
    await evaluate(`(()=>{document.querySelectorAll('#listing-check-field').forEach(el=>el.removeAttribute('id'));const label=[...document.querySelectorAll('label')].find(el=>el.querySelector('span')?.textContent.trim().startsWith(${JSON.stringify(label)}));const input=label?.querySelector('input,textarea');if(!input)throw Error("Field missing");input.id="listing-check-field";})()`);
    await fill("#listing-check-field", value);
  };
  const choose = async (label, text) => {
    await evaluate(`(()=>{const label=[...document.querySelectorAll('label')].find(el=>el.querySelector('span')?.textContent.trim().startsWith(${JSON.stringify(label)}));const trigger=label?.querySelector('[role="combobox"]');if(!trigger)throw Error("Picker missing");trigger.click()})()`);
    await wait("document.querySelector('[role=\"listbox\"]')");
    await evaluate(`(()=>{const option=[...document.querySelectorAll('[role="option"]')].find(el=>el.textContent.trim().includes(${JSON.stringify(text)}));if(!option)throw Error("Option missing");option.click()})()`);
    await wait("!document.querySelector('[role=\"listbox\"]')");
  };
  const chip = (label, text) => evaluate(`(()=>{const group=[...document.querySelectorAll('fieldset')].find(el=>el.querySelector('legend')?.textContent.trim()===${JSON.stringify(label)});const button=[...group.querySelectorAll('button')].find(el=>el.textContent.trim()===${JSON.stringify(text)});button.click()})()`);
  const jump = async id => {
    await evaluate(`document.querySelector('nav[aria-label="Listing steps"] button[data-step="${id}"]').click()`);
    await step(id);
  };
  const atTop = () => evaluate("window.scrollTo(0,0)");
  let createdId;
  let sellerId;
  let testName;
  let originalIds = [];
  try {
    await login("seller");
    const account = await api("GET", "/api/auth/me");
    assert.equal(account.status, 200);
    assert.equal(account.data.email, "seller@redesign.invalid");
    assert.equal(account.data.is_selling, true);
    sellerId = account.data.id;
    const listings = await api("GET", "/api/horses");
    assert.equal(listings.status, 200);
    originalIds = listings.data.map(horse => horse.id);
    const source = listings.data.find(horse => horse.owner_id === sellerId && horse.photos?.length >= 3);
    assert.ok(source, "Only the test seller's sample photos may be used");
    const originalSource = JSON.stringify((await api("GET", `/api/horses/${source.id}`)).data);
    testName = ["Willow", "Maple", "Fern", "Cedar"].find(name => !listings.data.some(horse => horse.name === name));
    assert.ok(testName);
    const draftKey = `phm-listing-draft:${sellerId}:create:new`;
    await evaluate(`localStorage.removeItem(${JSON.stringify(draftKey)})`);
    await navigate("/add-horse");
    await step("photos");
    await click("Next");
    await wait("document.body.innerText.includes('Add at least one photo')");
    for (let index = 0; index < 3; index++) {
      await fill('input[aria-label="Photo URL"]', source.photos[index]);
      await click("Add URL");
      await wait(`document.querySelectorAll('[data-photo-index]').length===${index + 1}`);
    }
    await evaluate("document.querySelector('[aria-label=\"Move photo 2 earlier\"]').click()");
    await wait(`document.querySelector('[data-photo-index="0"] img')?.src===${JSON.stringify(source.photos[1])}`);
    // A real touch gesture reorders the remaining two images.
    await evaluate("document.querySelector('[data-photo-index=\"1\"]').scrollIntoView({block:'center'})");
    const points = await evaluate(`(()=>{const from=document.querySelector('[aria-label="Drag photo 2 to reorder"]').getBoundingClientRect();const to=document.querySelector('[data-photo-index="2"]').getBoundingClientRect();return {x:from.left+from.width/2,y:from.top+from.height/2,endX:to.left+to.width/2,endY:to.top+to.height/2}})()`);
    await send("Emulation.setTouchEmulationEnabled", { enabled: true, configuration: "mobile" });
    await send("Input.dispatchTouchEvent", { type: "touchStart", touchPoints: [{ x: points.x, y: points.y, id: 1 }] });
    for (let n = 1; n <= 5; n++) await send("Input.dispatchTouchEvent", { type: "touchMove", touchPoints: [{
      x: points.x + (points.endX - points.x) * n / 5, y: points.y + (points.endY - points.y) * n / 5, id: 1,
    }] });
    await send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] });
    await wait(`document.querySelector('[data-photo-index="1"] img')?.src===${JSON.stringify(source.photos[2])}`);
    const expectedPhotos = [source.photos[1], source.photos[2], source.photos[0]];
    await atTop();
    await capture("seller-flow-01-photos");
    // Verify blocked uploads report an error and never pretend that a photo was added.
    const document = await send("DOM.getDocument");
    const upload = await send("DOM.querySelector", { nodeId: document.root.nodeId, selector: 'input[type="file"][accept="image/*"]' });
    await send("DOM.setFileInputFiles", { nodeId: upload.nodeId, files: [resolve("client/public/style-preview/horse.jpg")] });
    await wait("document.body.innerText.includes('Photo upload failed')");
    assert.equal(await evaluate("document.querySelectorAll('[data-photo-index]').length"), 3);
    await click("Next");
    await step("facts");
    await setField("Horse name", testName);
    await navigate("/my-horses");
    await navigate("/add-horse");
    await step("facts");
    assert.equal(await evaluate("document.querySelector('input[placeholder=\"The name buyers will remember\"]').value"), testName);
    await chip("Primary discipline", "Jumping");
    await chip("Also competes in", "Eventing");
    await evaluate("document.querySelector('[aria-labelledby=\"listing-level-label\"]').click()");
    await wait("document.querySelector('[cmdk-item]')");
    await evaluate("[...document.querySelectorAll('[cmdk-item]')].find(el=>el.textContent.startsWith('1.20m')).click()");
    await send("Input.dispatchKeyEvent", { type: "keyDown", key: "Escape", code: "Escape" });
    await send("Input.dispatchKeyEvent", { type: "keyUp", key: "Escape", code: "Escape" });
    await choose("Age", "8 years");
    await choose("Height", "16.1 hh");
    await chip("Sex", "Mare");
    await chip("Colour", "Bay");
    await chip("Breed", "Warmblood");
    await choose("Country", "Australia");
    await choose("Level of education", "Well educated");
    await chip("Characteristics", "Honest");
    await atTop();
    await capture("seller-flow-02-facts");
    await click("Next");
    await step("pedigree");
    await capture("seller-flow-03-pedigree");
    await click("Next");
    await wait("document.querySelector('[role=\"dialog\"]')?.innerText.includes('Add the pedigree now?')");
    await capture("seller-flow-03-pedigree-reminder");
    await click("Add pedigree");
    await wait("!document.querySelector('[role=\"dialog\"]')");
    await click("Next");
    await click("Skip for now");
    await step("description");
    await click("Next");
    await wait("document.body.innerText.includes('Add a description before continuing')");
    await setField("About this horse", "A balanced, forward mare with a kind temperament, schooling over related lines and competing at 1.20m. Fictional redesign sample, not for sale.");
    await setField("Additional information", "Temporary redesign flow check. Licensed sample photographs illustrate this fictional horse.");
    await atTop();
    await capture("seller-flow-04-description");
    await click("Next");
    await step("price");
    await choose("Minimum", "25,000");
    await choose("Maximum", "35,000");
    await capture("seller-flow-05-price");
    await click("Next");
    await step("preview");
    assert.doesNotMatch(await evaluate("document.body.innerText"), /AUD|25,000|35,000|25000|35000/);
    const cardText = await evaluate("document.querySelector('[data-listing-step=\"preview\"] article').innerText");
    assert.doesNotMatch(cardText, /Australia|Location/);
    await capture("seller-flow-06-card-preview");
    await evaluate("document.querySelector('[data-listing-step=\"preview\"] section[aria-label=\"Horse details\"]').scrollIntoView({block:'start'})");
    await capture("seller-flow-06-detail-preview");
    await click("Publish listing");
    await wait("document.querySelector('[role=\"dialog\"]')?.innerText.includes('May we share your horse?')");
    assert.equal(await evaluate("[...document.querySelectorAll('[role=\"dialog\"] button')].find(el=>el.textContent.trim()==='Publish').disabled"), true);
    await click("No, thank you");
    await click("Publish");
    await wait("document.querySelector('h1')?.textContent.includes('Your listing is live')");
    await atTop();
    await capture("seller-flow-07-success");
    const saved = (await api("GET", "/api/horses")).data.filter(horse => !originalIds.includes(horse.id) && horse.owner_id === sellerId && horse.name === testName);
    assert.equal(saved.length, 1, "Exactly one real temporary test listing was created");
    createdId = saved[0].id;
    assert.equal(saved[0].sire || "", "");
    assert.equal(saved[0].social_media_promotion, false);
    assert.deepEqual(saved[0].photos, expectedPhotos);
    assert.equal(await evaluate(`localStorage.getItem(${JSON.stringify(draftKey)})`), null);
    await click("Share your listing");
    await wait("document.querySelector('input[aria-label=\"Public listing URL\"]')");
    assert.equal(await evaluate("document.querySelector('input[aria-label=\"Public listing URL\"]').value"), `${origin}/horse/${createdId}`);
    await click("Close");
    await click("View my listing");
    await wait("document.body.innerText.includes('You’re viewing your listing')");
    assert.doesNotMatch(await evaluate("document.body.innerText"), /25,000|35,000|Contact Seller/);
    await navigate(`/edit-horse/${createdId}`);
    await step("photos");
    await jump("pedigree");
    await setField("Sire", "Cedar Ridge");
    await setField("Dam", "Amber Light");
    await setField("Dam sire", "Northern Star");
    await capture("seller-flow-08-edit-pedigree");
    await jump("preview");
    await wait("document.body.innerText.includes('Cedar Ridge')");
    await evaluate("document.querySelector('#listing-preview-pedigree').scrollIntoView({block:'center'})");
    await capture("seller-flow-08-edit-preview");
    await click("Save changes");
    await wait("document.querySelector('h1')?.textContent.includes('Your listing is updated')");
    const edited = (await api("GET", `/api/horses/${createdId}`)).data;
    assert.equal(edited.owner_id, sellerId);
    assert.equal(edited.sire, "Cedar Ridge");
    assert.equal(edited.dam, "Amber Light");
    assert.equal(edited.dam_sire, "Northern Star");
    assert.deepEqual(edited.photos, expectedPhotos);
    assert.deepEqual(edited.other_disciplines, ["Eventing"]);
    assert.equal(edited.price_min, 25000);
    assert.equal(edited.price_max, 35000);
    assert.equal(JSON.stringify((await api("GET", `/api/horses/${source.id}`)).data), originalSource, "Original sample horse unchanged");
    await navigate("/edit-horse/not-a-number");
    await wait("document.body.innerText.includes('listing address is invalid')");
    await login("buyer");
    await navigate(`/edit-horse/${createdId}`);
    await wait("document.body.innerText.includes('Only seller accounts can edit')");
    assert.equal(await evaluate("document.querySelectorAll('[data-listing-step]').length"), 0);
    assert.equal((await api("PUT", `/api/horses/${createdId}`, {})).status, 403);
    console.log("Passed: normal seller create/edit; every step; device draft resume; touch reorder; optional pedigree reminder; buyer-safe previews; real publish/update and success; sharing; buyer edit denial; original listings unchanged.");
  } catch (error) {
    await capture("seller-flow-failure").catch(() => undefined);
    console.error("Seller flow check:", error.message);
    throw error;
  } finally {
    if (createdId) {
      await login("seller");
      const current = await api("GET", `/api/horses/${createdId}`);
      assert.equal(current.data.owner_id, sellerId);
      assert.equal(current.data.name, testName);
      assert.ok(current.data.additional_info?.startsWith("Temporary redesign flow check.") ||
        current.data.description?.startsWith("Temporary redesign flow check."));
      assert.equal(originalIds.includes(createdId), false);
      assert.equal((await api("DELETE", `/api/horses/${createdId}`, { unsold: true })).status, 200);
      console.log("Removed only the temporary test listing created by this check.");
    }
  }
});
