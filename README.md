# THE VOID — v0.2

A GitHub Pages-ready cinematic solo adventure prototype.

## This build includes

- The complete two-image cinematic prologue
- A responsive interactive map for Deck 07
- Crew Quarters, Hallway, Control Room and Life Support
- Luna's draggable portrait token using `IMG03`
- Click/tap room movement as an alternative to dragging
- An orange pulsing Life Support fire alert
- The Control Room scene using `IMG04`
- An interactive Pilot's Log
- The burning Life Support scene using `IMG05`
- A hold-to-extinguish fire interaction
- The sabotaged oxygen control panel reveal using `IMG06`
- Checkpoint-style browser saving with `localStorage`
- A restart control for replaying from the prologue
- Desktop, tablet and mobile layouts

## Publish on GitHub Pages

1. Extract this ZIP.
2. Upload **all extracted files and the `assets` folder** to the root of your GitHub repository.
3. Open **Settings → Pages** in the repository.
4. Under **Build and deployment**, choose:
   - Source: **Deploy from a branch**
   - Branch: **main**
   - Folder: **/(root)**
5. Save and wait for GitHub to publish the site.

`index.html` must remain at the repository root, beside `styles.css` and `script.js`.

## Controls

- During the cinematic, press **Enter**, **Space**, or **Continue**.
- Pressing Enter or Space while text is typing reveals the complete passage.
- On the map, drag Luna to an adjacent room or select the room directly.
- In Life Support, hold the suppression control for approximately two seconds.
- Progress is saved automatically in the browser.

## Project files

```text
index.html
styles.css
script.js
.nojekyll
assets/
  IMG01.png
  IMG02.png
  IMG03.png
  IMG04.png
  IMG05.png
  IMG06.png
```

## Current endpoint

The chapter ends after Luna logs the deliberate tampering with the oxygen supply control panel. The objective then becomes:

> Find the source of the Life Support sabotage.
