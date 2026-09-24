---
name: iPhone intro playback
description: Device power settings can explain unexpected intro playback controls.
---

Check whether Low Power Mode is enabled before diagnosing an iPhone intro autoplay regression.

**Why:** On 2026-09-24, a report that the intro suddenly required a play-button tap was followed by confirmation that the device was in Low Power Mode. This can block even muted inline autoplay; application code cannot guarantee overriding that restriction.

**How to apply:** Distinguish browser-imposed autoplay restrictions from application regressions, and avoid promising automatic playback under every device setting. Treat bottom-edge visual gaps as a separate issue.