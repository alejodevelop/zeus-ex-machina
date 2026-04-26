# Large Shell Fullscreen UX

## Summary
- The game now renders inside a larger framed `16 / 9` shell instead of a small fixed stage, so the playable area scales up to a roomy desktop presentation while still fitting shorter viewports.
- `#app-shell` owns fullscreen mode, and a dedicated button syncs with Phaser fullscreen events so the browser UI reflects supported, on, and off states.

## Files
- `index.html` - defines `#app-shell`, `#fullscreen-toggle`, `#game-frame`, and the inner `#game` mount.
- `src/game/config.ts` - sets the runtime frame to `1280x720`, keeps `Phaser.Scale.FIT`, and points `fullscreenTarget` at `app-shell`.
- `src/main.ts` - installs the fullscreen toggle behavior, listens for `ENTER_FULLSCREEN`, `LEAVE_FULLSCREEN`, `FULLSCREEN_UNSUPPORTED`, and `FULLSCREEN_FAILED`, and cleans those listeners up during HMR disposal.
- `src/styles.css` - sizes the shell and framed canvas, styles the fullscreen button, and adjusts shell visuals during browser fullscreen.

## Decisions
- Keep the shell and canvas on a shared `16 / 9` ratio so CSS layout and Phaser scale math stay aligned.
- Drive fullscreen through Phaser scale APIs instead of direct DOM fullscreen calls so game state and browser fullscreen state stay in sync.
- Hide and disable the fullscreen button when `game.scale.fullscreen.available` is false rather than showing a dead control.

## Errors and fixes
- Symptom: the canvas frame looks stretched, clipped, or letterboxed incorrectly after shell sizing changes.
- Root cause: `src/styles.css` no longer matches the `1280x720` game frame in `src/game/config.ts`.
- Fix: update the CSS `aspect-ratio` and the Phaser `GAME_WIDTH` / `GAME_HEIGHT` together.

## Follow-ups
- If the shell markup or ids change, update `index.html`, `src/main.ts`, and `src/game/config.ts` together so fullscreen still targets the correct container.
