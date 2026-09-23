---
name: iPhone notification diagnosis
description: Lessons from contradictory iPhone system settings and website notification screens
---

An iPhone screenshot showing ProHorseMatch enabled in system Settings does not prove that a separate browser tab has notification permission.

**Why:** System Settings can refer to an installed web app or native app. The website can legitimately report a different permission. Treating this as stale cache led to repeated, unhelpful reload advice even after the screenshot contained new-version wording.

**How to apply:** Compare distinctive screenshot text with the live bundle before blaming caching. Do not infer the browser's actual user agent from the visible phone; desktop-site mode can mask it. Validate browser, installed web app, and native app independently, and never claim successful delivery from a permission toggle alone.