# The Void — Cinematic Prologue

A self-contained, GitHub Pages-ready opening scene for **The Void**.

## Included

- `index.html` — the cinematic scene markup
- `styles.css` — responsive layout, fades, atmospheric background and alarm treatment
- `script.js` — typewriter text, scene transitions, keyboard controls and final fade-out
- `assets/IMG01.png` — Luna asleep in cryosleep
- `assets/IMG02.png` — Luna awakened by the fire alarm
- `.nojekyll` — prevents GitHub Pages from applying Jekyll processing

## Run locally

Open `index.html` in a browser.

## Publish with GitHub Pages

1. Create or open a GitHub repository.
2. Upload **the contents of this folder** to the repository root.
3. In GitHub, open **Settings → Pages**.
4. Under **Build and deployment**, choose:
   - Source: **Deploy from a branch**
   - Branch: **main**
   - Folder: **/(root)**
5. Save. GitHub will provide the live Pages address.

## Controls

- **Enter** or **Space** while text is typing: reveal the whole passage.
- **Enter**, **Space**, or the **Continue** button after typing: advance.
- The final Continue fades the screen fully to black.

## Editing the story

Open `script.js` and edit the two objects inside the `scenes` array.

The final fade dispatches a browser event named:

```js
voidSceneComplete
```

That gives the next chapter of the future game a clean integration point.
