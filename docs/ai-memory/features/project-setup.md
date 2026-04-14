# Project Setup

## Summary
- The project is a browser game scaffold built with `Phaser`, `Vite`, strict `TypeScript`, `ESLint`, `Vitest`, and `pnpm`.
- `src/main.ts` is the only browser entry point and creates one `Phaser.Game` from `src/game/config.ts`.
- Startup flow is scene-based: `BootScene` creates runtime textures, `PreloadScene` loads static assets, `MenuScene` is the loop entry, `GameScene` runs gameplay, and `UiScene` overlays HUD state.

## Files
- `package.json` - scripts, dependency versions, and pinned `pnpm@10.33.0` package manager.
- `index.html` - mounts the game in `#game` and loads `src/main.ts`.
- `src/main.ts` - creates and hot-disposes the single Phaser game instance.
- `src/game/config.ts` - shared game size, physics, scaling, input, and scene registration.
- `src/game/scenes/BootScene.ts` - generates runtime textures before asset preload.
- `src/game/scenes/PreloadScene.ts` - loads static SVG assets from `public/assets/`.
- `src/game/scenes/scene-keys.ts` - canonical scene ids.

## Decisions
- Keep scene ids, asset keys, and global event names centralized in `src/game/scenes/scene-keys.ts`, `src/game/assets.ts`, and `src/game/events.ts`.
- Keep pure game logic in `src/game/systems/` and `src/game/utils/` so it stays testable in Vitest's `node` environment.
- Keep `vite.config.ts` on `base: './'` so the built `dist/` bundle works from relative hosting targets like `itch.io` uploads.

## Errors and fixes
- Symptom: `Keyboard input is unavailable in GameScene.`
- Root cause: `GameScene` requires Phaser's keyboard plugin before binding controls.
- Fix: do not disable or remove keyboard input support in `src/game/config.ts`.

- Symptom: built assets fail after direct HTML5 bundle upload.
- Root cause: absolute asset URLs break when the bundle is served from a subpath or zip root.
- Fix: keep relative asset URLs via `base: './'` in `vite.config.ts`.

## Follow-ups
- Treat `dist/` as the deployable bundle and `public/assets/` as the source for runtime-loaded static assets.
