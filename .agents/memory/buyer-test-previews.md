---
name: Buyer test previews
description: User's standing requirement for realistic authenticated redesign reviews and isolated sample data.
---

Before more design work, audit the existing permissions and account rules in plain English. Do not change those rules as part of redesign. Distinguish actually enforced rules from interface-only restrictions and existing protection gaps.

Show application designs while normally logged in as the test buyer on the redesign test site. Use the separate test seller for all sample listings. Never use horses belonging to the user's own account as examples. A static specimen or mocked component is not proof of a real buyer's experience.

Design mobile first: the user says 90% of users will be on a phone. Keep the current browse filter chips and overall style. Mobile browse uses one photo-led card per row and bottom tabs for Find Horses, Favourites, Messages, Alerts and Profile.

Use 8–10 realistic fictional horses, plain names with no “Demo” prefix, varied disciplines/levels/heights/ages/sexes/colours/filtering budgets and Australian states. Some have pedigree information; others do not. Each needs 3–5 real horse photos from a verified free-licensed source. Photos and listings are for the test site only and must never appear on the live site.

**Why:** The user asked to protect existing behaviour before redesign and to review realistic buyer-facing designs rather than their own seller-owned horses.

**How to apply:** Check the dedicated test host and sandbox status before writes. Use normal test-buyer authentication for real-screen verification. Keep price privacy aligned with the app-wide rule in redesign-approval.md. Never substitute live credentials, live listings or an authentication bypass when test access is missing.
