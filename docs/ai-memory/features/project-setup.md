# Project Setup

## Summary
- The project is a browser game scaffold built with `Phaser`, `Vite`, strict `TypeScript`, `ESLint`, `Vitest`, and `pnpm`.
- `src/main.ts` is the only browser entry point and creates one `Phaser.Game` from `src/game/config.ts`.
- Startup flow is scene-based: `BootScene` creates runtime textures, `PreloadScene` routes into the configured start scene, `MenuScene` is the landing screen, and `GameScene` is an intentional placeholder with no gameplay loop.

## Files
- `package.json` - scripts, dependency versions, and pinned `pnpm@10.33.0` package manager.
- `index.html` - mounts the game in `#game` and loads `src/main.ts`.
- `src/main.ts` - creates and hot-disposes the single Phaser game instance.
- `src/game/config.ts` - shared game size, scaling, render settings, and scene registration.
- `src/game/assets.ts` - scaffold texture ids generated at runtime.
- `src/game/scenes/BootScene.ts` - generates runtime placeholder textures before preload.
- `src/game/scenes/PreloadScene.ts` - lightweight routing scene that still leaves room for future static asset loading.
- `src/game/scenes/scene-keys.ts` - canonical scene ids.
- `src/game/scenes/MenuScene.ts` - minimal title screen that starts the placeholder scene on pointer or keyboard input.
- `src/game/scenes/GameScene.ts` - placeholder scene with explicit return-to-menu controls.
- `src/styles.css` - shell styling around the fixed-aspect Phaser canvas.

## Decisions
- Keep scene ids and scaffold asset keys centralized in `src/game/scenes/scene-keys.ts` and `src/game/assets.ts`.
- Keep pure logic in plain modules under `src/game/` or `src/game/utils/` so it stays testable in Vitest's `node` environment.
- Keep the current scaffold free of game-specific rules until the new concept is chosen.
- Keep `vite.config.ts` on `base: './'` so the built `dist/` bundle works from relative hosting targets like `itch.io` uploads.

## Errors and fixes
- Symptom: built assets fail after direct HTML5 bundle upload.
- Root cause: absolute asset URLs break when the bundle is served from a subpath or zip root.
- Fix: keep relative asset URLs via `base: './'` in `vite.config.ts`.

- Symptom: the canvas frame looks stretched or clipped after shell sizing edits.
- Root cause: `src/styles.css` and `src/game/config.ts` disagree on the game aspect ratio.
- Fix: update the CSS `aspect-ratio` and Phaser `GAME_WIDTH` / `GAME_HEIGHT` together.

## Follow-ups
- Treat `dist/` as the deployable bundle and `public/assets/` as the source for future runtime-loaded static assets.
- Replace the placeholder `GameScene` only after the next game loop and required systems are defined.
