THE VOID v0.9.0 — CINEMATIC CUTAWAY MAPS

The game now renders every existing map state as a procedural SVG cutaway of a spacecraft section.

The SVG renderer uses the room positions, connections and access rules already present in script.js. The underlying gameplay logic has not been replaced. Luna remains the draggable/clickable portrait token.

Visual system:
- starry deep-space backdrop
- pearlescent white hull rim and panel glints
- dark top-down cutaway deck
- illuminated room compartments
- structural corridors and bulkhead markers
- animated route flow for available movement
- red lockdown and biohazard treatment
- exterior-hull treatment for EVA maps
- scene-specific hull fragments for every map mode currently in the game

No new map image asset is required. The maps are drawn live in SVG by script.js and styled in styles.css.

Keep all of your existing IMG assets in /assets.
