// Explicit, remote TEST-ONLY data preparation. Never imported by the application.
import assert from "node:assert/strict";

export const testOrigin = "https://prohorsematch-redesign.onrender.com";
const photo = id => `https://images.pexels.com/photos/${id}/pexels-photo-${id}.jpeg?auto=compress&cs=tinysrgb&w=1200`;
const samples = [
  ["Amber", "Jumping", "1.20m", 8, 16.1, "Mare", "Bay", "Warmblood", "Bowral, NSW", 25000, 35000,
    [37772380, 6931454, 14469929], "A balanced, forward mare schooling confidently over related lines. Competing at 1.10m and ready to consolidate at 1.20m with an experienced amateur.", ["Cedar Ridge", "Amber Light", "Northern Star"]],
  ["Orion", "Dressage", "Medium", 10, 16.3, "Gelding", "Black", "Warmblood", "Macedon Ranges, VIC", 40000, 60000,
    [9679294, 13340063, 13809853], "An established dressage gelding with expressive paces and a reliable competition routine. Working on lateral movements and flying changes; best suited to a confident rider.", ["Oakfield", "Evening Song", ""]],
  ["Willow", "Eventing", "EvA95", 6, 15.3, "Mare", "Chestnut", "Thoroughbred", "Toowoomba, QLD", 12000, 20000,
    [7796027, 1848727, 1848725], "An athletic young mare enjoying all three phases. Schooling water, ditches and banks with a positive attitude. Needs a capable rider to continue her education.", []],
  ["Jasper", "Jumping", "1.00m", 12, 15.2, "Gelding", "Grey", "Australian Stock Horse", "Hahndorf, SA", 15000, 25000,
    [12653426, 4573470, 4052993], "An experienced club horse with a consistent rhythm to a fence. Enjoys clinics and outings, and has a straightforward weekly routine. Suitable for a confident junior with coaching support.", []],
  ["Cleo", "Dressage", "Elementary", 7, 16.0, "Mare", "Bay", "Warmblood", "Serpentine, WA", 30000, 45000,
    [9480704, 10403842, 7340797], "A willing mare developing strength in collection. Established leg yield and shoulder-in, with a relaxed attitude at training days. An appealing project for a committed amateur.", ["Coastal Wind", "Clementine", "Willow Park"]],
  ["Finn", "Eventing", "EvA80", 5, 16.2, "Gelding", "Chestnut", "Thoroughbred", "Longford, TAS", 8000, 15000,
    [13712779, 7572099, 5368683], "A recently established sport-horse prospect with a kind temperament. Enjoys poles and introductory cross-country schooling. Still green and requires an experienced home.", ["", "Fern Valley", ""]],
  ["Luna", "Dressage", "Novice", 9, 14.2, "Mare", "Grey", "Welsh", "Canberra, ACT", 18000, 28000,
    [14002016, 9609886, 11531524], "A compact pony with three active paces and a consistent contact. Has attended pony-club and dressage outings. Comfortable travelling with a companion and happiest with regular work.", []],
  ["Atlas", "Jumping", "1.30m", 11, 17.0, "Gelding", "Black", "Warmblood", "Darwin, NT", 65000, 85000,
    [9754582, 9685998, 5960215], "A powerful jumping gelding with experience in technical tracks. Careful and responsive, with scope for a competitive rider. Needs confident riding and a structured fitness programme.", ["Arden Heights", "Midnight Rose", "Silver Crest"]],
  ["Hazel", "Eventing", "EvA105", 8, 16.1, "Mare", "Chestnut", "Thoroughbred", "Camden, NSW", 28000, 42000,
    [13133683, 14934378, 14575769], "An energetic all-round athlete with established flatwork and a bold approach cross-country. Competing regularly and comfortable with busy venues. Best suited to an experienced eventing rider.", ["Hawthorn", "", ""]],
  ["Bramble", "Jumping", "0.80m", 4, 15.1, "Stallion", "Bay", "Warmblood", "Ballarat, VIC", 10000, 18000,
    [37476505, 17725970, 5929509], "A lightly started young horse showing promise over poles and small fences. Working on rhythm, steering and confidence away from home. Requires an experienced young-horse rider and appropriate stallion facilities.", []],
];

export const sampleHorses = samples.map(([name, discipline, level, age, height, sex, colour, breed, location, min, max, ids, description, pedigree]) => ({
  name, disciplines: [discipline], levels: [level], age, height_hands: height,
  height_cm: Math.round((Math.floor(height) * 4 + Math.round((height % 1) * 10)) * 2.54),
  sex, colour, breeds: [breed], location_country: "Australia",
  price_min: min, price_max: max, currency: "AUD",
  sire: pedigree[0] || null, dam: pedigree[1] || null, dam_sire: pedigree[2] || null,
  education_level: age <= 5 ? "Basic education" : "Well educated",
  description,
  additional_info: `Based in ${location}. Current work: four sessions weekly, with turnout and rest days. Handling: regular farrier and float practice.`,
  photos: ids.map(photo), videos: [], characteristics: [], other_disciplines: [],
}));

export const photoSources = [...new Set(samples.flatMap(s => s[11]))].map(id => ({
  id, source: `https://www.pexels.com/photo/${id}/`, image: photo(id),
  license: "https://www.pexels.com/license/",
  usage: "Redesign test database only. Illustrative stock photographs; no endorsement or real sale implied.",
}));

export async function prepareSamples({ write = false } = {}) {
  assert.equal(new URL(testOrigin).hostname, "prohorsematch-redesign.onrender.com");
  const request = async (path, { token, method = "GET", body } = {}) => {
    const response = await fetch(testOrigin + path, {
      redirect: "error", method,
      headers: { "content-type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      ...(body ? { body: JSON.stringify(body) } : {}),
      signal: AbortSignal.timeout(90000),
    });
    if (!response.ok) throw Error(`${method} ${path}: HTTP ${response.status}`);
    return response.json();
  };
  const checkSandbox = async () => {
    const status = await request("/api/redesign-status");
    assert.equal(status.environment, "redesign");
    for (const flag of ["outboundEmail", "outboundPush", "payments", "mediaUploads"]) assert.equal(status[flag], false);
  };
  await checkSandbox();
  if (!process.env.REDESIGN_DEMO_PASSWORD) throw Error("Test password is required; never use a personal password.");
  const login = async role => {
    const account = await request("/api/auth/login", { method: "POST", body: {
      email: `${role}@redesign.invalid`, password: process.env.REDESIGN_DEMO_PASSWORD,
    } });
    assert.equal(account.email, `${role}@redesign.invalid`);
    assert.ok(account.auth_token);
    return account;
  };
  const seller = await login("seller");
  const buyer = await login("buyer");
  assert.notEqual(buyer.id, seller.id);
  assert.equal(seller.is_selling, true);
  assert.equal(buyer.is_selling, false);
  const owned = await request("/api/horses/owner", { token: seller.auth_token });
  assert.ok(owned.every(h => h.owner_id === seller.id));
  // Refuse unknown seller data rather than accidentally replacing genuine listings.
  const names = new Set([...sampleHorses.map(h => h.name), "Demo — Amber", "Demo — Orion", "Demo — Willow"]);
  assert.ok(owned.every(h => names.has(h.name)), "Unexpected seller listings: stop for review.");
  const results = [];
  for (const horse of sampleHorses) {
    const existing = owned.filter(h => h.name === horse.name || h.name === `Demo — ${horse.name}`);
    assert.ok(existing.length <= 1, "Duplicate sample names require review.");
    if (write) {
      await checkSandbox();
      const saved = await request(existing.length ? `/api/horses/${existing[0].id}` : "/api/horses", {
        token: seller.auth_token, method: existing.length ? "PUT" : "POST",
        body: { ...horse, owner_id: seller.id },
      });
      assert.equal(saved.owner_id, seller.id);
      assert.equal(saved.name, horse.name);
      assert.deepEqual(saved.photos, horse.photos);
      results.push({ id: saved.id, name: saved.name, photos: saved.photos.length });
    } else results.push({ name: horse.name, action: existing.length ? "update" : "create" });
  }
  if (write) {
    const after = await request("/api/horses/owner", { token: seller.auth_token });
    assert.equal(after.length, 10);
    assert.ok(after.every(h => h.owner_id === seller.id && !h.name.startsWith("Demo")));
    for (const h of after) {
      assert.ok(h.photos.length >= 3 && h.photos.length <= 5);
      const buyerView = await request(`/api/horses/${h.id}`, { token: buyer.auth_token });
      assert.equal(buyerView.id, h.id);
    }
  }
  console.log(JSON.stringify({ environment: "redesign", applied: write, accountsVerified: ["buyer", "seller"], horses: results }, null, 2));
}

if (process.argv[1] && import.meta.url === new URL(process.argv[1], "file:").href) {
  if (process.argv.includes("--apply")) await prepareSamples({ write: true });
  else if (process.argv.includes("--check")) await prepareSamples();
  else console.log("Use --check (read only) or --apply (writes only to the fixed redesign test host).");
}
