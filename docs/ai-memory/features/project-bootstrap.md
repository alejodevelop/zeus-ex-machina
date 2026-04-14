# Project Bootstrap

## Summary
- Browser game bootstrap uses `Phaser 3`, `Vite`, and strict `TypeScript` with `pnpm`.
- The app starts from `src/main.ts`, mounts into `#game`, and runs a scene-driven Phaser flow.
- Bootstrap currently mixes runtime-generated textures with static SVG assets from `public/assets/`.

## Files
- `package.json` - canonical scripts, package manager pin, and toolchain dependencies.
- `vite.config.ts` - relative production base, open host binding, and build config.
- `tsconfig.json` - strict TypeScript settings with `moduleResolution: 'Bundler'` and no emit.
- `eslint.config.js` - TypeScript-aware linting and required type-only imports.
- `vitest.config.ts` - `node` test environment for `src/**/*.test.ts`.
- `index.html` - root shell with `#game` mount and module entry to `src/main.ts`.
- `src/game/config.ts` - Phaser config, fixed game size (`960x540`), arcade physics, and scene registration.
- `src/game/scenes/*.ts` - scene flow: boot, preload, menu, gameplay, and HUD overlay.
- `src/game/assets.ts` / `src/game/events.ts` / `src/game/scenes/scene-keys.ts` - shared keys and event constants.

## Decisions
- Use scene constants and shared asset/event registries instead of repeating raw strings across scenes.
- Keep pure session/timer/spawn logic outside scenes in `src/game/systems/` and `src/game/utils/` because tests run in a Node environment.
- Keep `vite.config.ts` on `base: './'` so the built game works from relative hosting targets like `itch.io` uploads.

## Errors and fixes
- Symptom: `Keyboard input is unavailable in GameScene.`
- Root cause: gameplay assumes the Phaser keyboard plugin exists before binding controls.
- Fix: do not remove keyboard input support when editing `src/game/config.ts`.

- Symptom: built assets do not resolve after direct HTML5 bundle upload.
- Root cause: absolute asset paths are incompatible with subpath or zip-root hosting.
- Fix: keep `vite.config.ts` using relative asset URLs via `base: './'`.

## Follow-ups
- Preserve `dist/` as a self-contained production bundle and `public/assets/` as the source for runtime-loaded static assets.
