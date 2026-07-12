The Void v0.9.4

Narrative configuration pass:
- Added narrative.js as the editable home for story prose.
- script.js now requests narrative by stable keys instead of storing story paragraphs inline.
- Story wording can be edited without touching event handlers, map routes, images, checkpoints or save logic.
- Conditional narrative remains supported through small context-aware entries in narrative.js.
- Added narrative.js before script.js in index.html.
- Existing v0.9.3 saves migrate automatically to v0.9.4.

GitHub upload:
1. Upload index.html, narrative.js, script.js and styles.css together.
2. Keep the existing assets folder unchanged.
3. Do not rename narrative.js unless you also update its script tag in index.html.

Editing guidance:
- Open narrative.js.
- Search for a phrase or key.
- Change only the returned text.
- Keep keys, commas, quotes/backticks and function wrappers intact.
