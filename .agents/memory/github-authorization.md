---
name: GitHub authorization
description: Do not equate a rejected shell push with a disconnected GitHub App.
---

Check the connected GitHub App before asking the owner to replace a token when shell Git rejects a push.

**Why:** In this project, read-only Git access worked while a shell push was rejected, but the existing GitHub App integration still had repository write access. These are separate authentication paths.

**How to apply:** Use the documented connector APIs for an already-authorized branch operation if appropriate. Verify the resulting branch and exact content, and confirm unrelated branch heads have not changed. Never expose credentials or force-update an unrelated branch to work around authentication.
