# The Void — v0.3

A self-contained, GitHub Pages-ready build of **The Void**, including the cinematic prologue, the Life Support fire sequence, Checkpoint 01, the expanded southern deck, laboratory clue, specimen collection, Kitchen alien encounter, Store Room equipment, Engineering access and the hiding sequence through Checkpoint 02.

## Included

- `index.html` — complete interface and dialogs
- `styles.css` — cinematic, responsive visual design
- `script.js` — story state, navigation, draggable Luna token, choices, checkpoints and local saving
- `assets/IMG01.png` through `assets/IMG15.png`
- `.nojekyll` — prevents GitHub Pages from applying Jekyll processing
- `VERSION.txt` — build number

IMG16 is intentionally not included or used.

## Publish to GitHub Pages

1. Extract the ZIP.
2. Upload **all files and the `assets` folder** to the root of your GitHub repository.
3. Ensure `index.html` sits at the repository root.
4. In GitHub, open **Settings → Pages**.
5. Select **Deploy from a branch**, choose `main`, then `/(root)`.

## Editing the onscreen writing

Most changing story text is in `script.js`:

- `introScenes` contains the two opening cinematic passages.
- `getRoomDefinition()` contains room descriptions.
- `getRoomActions()` contains action-button labels.
- `inspectKitchenCounter()` contains the IMG11 → IMG12 alien encounter.

Fixed interface labels and the Ground Control / Pilot Log markup are in `index.html`.

Take care not to remove commas, quotation marks, backticks, braces or element IDs while editing.

## Saving

The game saves automatically in the browser using `localStorage`.

This build migrates a prior v0.2 browser save where possible. The Restart button clears both Checkpoint 01 and Checkpoint 02 and returns to the opening cinematic.
