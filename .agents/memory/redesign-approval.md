---
name: Redesign approval boundaries
description: User's brand direction and restrictions for redesign styling.
---

Keep the existing ProHorseMatch logos, colours and fonts. The requested direction is premium, modern equestrian: clean, calm and confident, with horse photos as the hero.

Review all pages for inconsistencies before changing appearance. Present one mobile-first style preview on the redesign test site and wait for explicit approval before applying it to the rest of the app.

When approved, change only the look, not functionality, data or how any page works.

The current browse-screen brief excludes all location information from horse cards. Location is not relevant at the browsing stage. Preserve search, saving and horse-detail behaviour behind the scenes.

For the separate style preview, compact browsing cards have no location field. The user specified Location in the expanded profile's two-column facts grid, alongside Discipline, Height, Age, Sex and Breed. Do not conflate this preview direction with the separately requested browse-screen implementation.

For the expanded profile preview, use top photo close/save icons instead of separate Back/Close/Favourite buttons, a light education tag, About text and one dark Contact Seller button fixed to the mobile bottom. Keep Report this listing quiet and centred. Put any sample disclaimer under the card, never inside it.

Price is never displayed to buyers anywhere: cards, horse pages, messages, alerts, emails or share previews. Sellers enter a price range only for buyer search/filtering; owners see their own range only in Edit listing. The discipline names are Jumping, Dressage and Eventing.

Browse cards show available sire and dam sire directly below the name; omit the line if both are empty. The horse page always shows a clearly titled Pedigree section directly after key facts and before About, without expansion. Omit individual empty fields. If all are empty, buyers see “Pedigree not provided by seller” and owners see a gentle prompt to add details.

**Why:** The user explicitly made buyer price privacy an app-wide rule and later emphasized breeding enough to require a visible empty-pedigree section rather than hiding it.

Standing design rules: one dark primary action per screen; other actions are icons, light secondary buttons or text links. Keep icons beside labels. Navigation is a small top icon, never a full-width button. Information must not look like a button. Section spacing is at least twice within-section line spacing.

**Why:** The user supplied a detailed replacement brief after reviewing the first expanded preview. These instructions supersede the earlier requirement to retain separate Back/Favourite footer buttons, but do not authorize rollout beyond the preview.

**Why:** The user explicitly wants to preserve their brand and approve a consistent style before a broader rollout.

**How to apply:** All redesign styling requests remain on the redesign branch and separate test site; browse-only authorization is not permission to restyle other screens or change production.

The seller Add Horse/Edit Listing flow is now explicitly in scope. All pedigree fields, including Sire, may be left blank. When all are blank, show a gentle reminder offering Add now or Skip. Preserve all other listing validation and permission rules.

**Why:** The user explicitly approved making Sire optional after being told that the existing forms required it.

Seller progress drafts are saved on the current device, separately for each account and listing. Saving a draft must never publish or update a listing automatically; publishing still requires explicit submission and a successful server response.

**Why:** The requested redesign must preserve listing behaviour and existing data while allowing sellers to resume unfinished work. Do not promise cross-device draft syncing without adding an approved server-side draft feature.
