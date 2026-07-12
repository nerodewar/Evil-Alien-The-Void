THE VOID v0.5.2 — CHECKPOINT 03 CLEANUP

Replace:
- index.html
- styles.css
- script.js

Keep assets/IMG01.png through assets/IMG40.png.

Implemented:
- Storage now always shows POWER RELAY RECOVERED with IMG27.
- Blackout Control Room now uses the established IMG21 blackout artwork, with a safe fallback.
- Removed the Auxiliary Power item hunt and all three-component requirements.
- Checkpoint 03 now offers exactly HIDE or FACE IT.
- HIDE leads to alien attack, Total Failure, and Checkpoint 03 restart.
- FACE IT uses the plasma gun, installs the relay, restores lighting, and returns to Communications.
- Added sequence run IDs and cancellation guards so old scenes and callbacks cannot replay over new scenes.
- Added decoded image caching, adjacent-room warming, background preloading, and broken-image fallbacks.
- Removed the deliberate 220 ms room-image pre-fade that made current tile artwork feel late.
