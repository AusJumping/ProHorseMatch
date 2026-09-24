---
name: iPhone notification diagnosis
description: Lessons from contradictory iPhone system settings and website notification screens
---

An iPhone screenshot showing ProHorseMatch enabled in system Settings does not prove that a separate browser tab has notification permission.

**Why:** System Settings can refer to an installed web app or native app. The website can legitimately report a different permission. Treating this as stale cache led to repeated, unhelpful reload advice even after the screenshot contained new-version wording.

**How to apply:** Compare distinctive screenshot text with the live bundle before blaming caching. Do not infer the browser's actual user agent from the visible phone; desktop-site mode can mask it. Validate browser, installed web app, and native app independently, and never claim successful delivery from a permission toggle alone.

Do not reintroduce an automatic page-wide notification enable popup. Keep permission requests user-initiated through settings or an explicit feature action.

**Why:** Repeated screenshots showed the enable popup remaining visible alongside a denied-permission message. Device detection alone did not resolve the contradictory experience.

Establish the installation method before following native-push configuration warnings.

**Why:** In this investigation the user confirmed Safari “Add to Home Screen.” A missing Firebase credential for the separate native app does not explain that web app's permission mismatch.

**How to apply:** For Safari-installed apps, investigate the current origin, standalone/embedded context, service worker, and web subscription. Do not change the installed app's identity or recommend deleting it before collecting those facts.