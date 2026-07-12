THE VOID v0.7.0 — THE IMITATION

INSTALLATION
1. Replace index.html, styles.css and script.js with the files in this package.
2. Copy the supplied assets into your existing assets folder.
3. Keep your existing assets/IMG01.png through assets/IMG40.png.

SUPPLIED ARTWORK
- assets/IMG00.png — title screen
- assets/IMG41.png through assets/IMG49.png — Laboratory montage and Emergency Lockdown

TITLE MUSIC PLACEHOLDER
index.html contains this placeholder Cloudflare R2 URL:
https://pub-00000000000000000000000000000000.r2.dev/the-void-title-theme.mp3

Replace it with the public Cloudflare URL for your actual music file. The title music:
- attempts to play automatically when the title screen appears
- loops while the title screen remains open
- fades out when PLAY or CONTINUE is selected
- retries on the player's first pointer or keyboard interaction when a browser blocks audible autoplay

NEW CHAPTER
- Checkpoint 04 now opens a route back to Laboratory 07.
- Luna carries the earlier residue sample to the Laboratory.
- IMG41–IMG49 form a cinematic slide-in montage.
- The analysis reveals adaptive DNA mimicry, Luna's copied genetic signature, the Alpha 9 origin, irreversible transformation and human biological vulnerability.
- The chapter ends in Emergency Lockdown at Checkpoint 05: THE IMITATION.
- The new lockdown schematic identifies the sealed Security Armoury and tactical equipment areas.

CAPTAIN'S LOG
- The existing Pilot's Log has become the Captain's Log.
- Fixed mission records remain available.
- Players can enter arbitrary personal notes, clues and codes.
- Notes auto-save separately from mission progress and survive checkpoint returns or game restarts.
- ADD TIMESTAMP and CLEAR NOTES controls are included.
- The organism analysis is automatically added to the fixed archive after Checkpoint 05.

PRESERVED SYSTEMS
- Initial start-game information screen remains 3.7 seconds.
- Later transitions remain slow, pure black fades.
- YOU LOSE screen retains Checkpoint 03, Restart Game and Quit to Title options.
- Tile-image preloading, fallback handling, fade-in text and stale-sequence cancellation remain active.

VALIDATION
- JavaScript syntax checked with Node.js.
- HTML IDs were checked against JavaScript element references.
- All supplied IMG00 and IMG41–IMG49 assets were verified in the package.
