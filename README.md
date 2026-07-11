# The Void — v0.4

A self-contained, GitHub Pages-ready build of **The Void**, containing the cinematic prologue and the complete playable story through Checkpoint 03.

## Story included

- Luna's cryosleep opening and Life Support fire
- sabotaged oxygen control panel and first Ground Control report
- expanded Laboratory, Mess Hall, Store Room and Engineering map
- residue clue, specimen collection and first alien encounter
- plasma gun, flashlight and Engineering key inventory
- Engineering hiding sequence and Checkpoint 02
- major branching decision:
  - **Send Crisis Signal**: Control Room → Maintenance Tunnels → Main Engine Room → blackout return
  - **Face Engineering Alone**: Maintenance Tunnels → Main Engine Room → Control Room → Airlock → Outer Hull → Sat-Nav repair
- despondent Ground Control report and isolated Control Room at Checkpoint 03

## Included files

- `index.html` — interface, cinematic, game panels and dialogs
- `styles.css` — responsive visual design, mission maps and branching-choice interface
- `script.js` — story state, routes, choices, draggable Luna token, inventory, checkpoints and local saving
- `assets/IMG01.png` through `assets/IMG21.png`
- `.nojekyll` — prevents GitHub Pages from applying Jekyll processing
- `VERSION.txt` — build number

`IMG16.png` is included for completeness but is not used in the current sequence, as requested.

## Publish to GitHub Pages

1. Extract the ZIP.
2. Upload **all files and the entire `assets` folder** to the root of the GitHub repository.
3. Replace the older files when GitHub asks.
4. Ensure `index.html` sits directly at the repository root.
5. Open **Settings → Pages** and deploy the `main` branch from `/(root)`.

## Editing onscreen writing

Most story text lives in `script.js`:

- `introScenes` contains the opening cinematic.
- `getRoomDefinition()` contains room descriptions.
- `getRoomActions()` and `getMissionActions()` contain action-button labels.
- the named sequence functions contain the cinematic encounters and crisis scenes.

The Pilot's Log and fixed Ground Control interface text are in `index.html`.

Take care not to remove quotation marks, commas, braces, parentheses or HTML element IDs while editing.

## Saving

The game saves automatically in the browser with `localStorage`. This build migrates browser saves from v0.3 or v0.2 where possible. The **Restart** button clears all supported save versions and returns to the opening cinematic.
