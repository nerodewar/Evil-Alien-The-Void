THE VOID v0.6.0 — CINEMATIC TITLE & FAILURE UPDATE

Replace:
- index.html
- styles.css
- script.js

Add:
- assets/IMG00.png

Keep your existing:
- assets/IMG01.png through assets/IMG40.png

Implemented:
- New full-screen title screen using assets/IMG00.png.
- PLAY option for a new mission.
- CONTINUE appears only when a saved mission exists.
- CREDITS screen and build number.
- Cinematic mission-initialisation transition after PLAY.
- Reusable buffering transitions for checkpoints, mission restoration, map changes, and major system changes.
- Animated map reveal when a checkpoint or mission layout loads.
- Dedicated YOU LOSE screen after Luna chooses HIDE and is found.
- YOU LOSE options: Return to Checkpoint 03, Restart Game, or Quit to Title.
- Checkpoint 03 restoration resets the blackout relay mission cleanly.
- Existing v0.5.3 fixes retained, including fade-in narrative text, IMG00/room image preloading, relay-only Storage route, HIDE/FAILURE and FACE IT/plasma branches, and stale-sequence cancellation.

TITLE IMAGE NAME
The title artwork must remain named exactly:
assets/IMG00.png

SAVE DATA
This build uses localStorage key: theVoidSave_v060
Older supported saves are migrated automatically.
