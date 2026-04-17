# Game Jam Scaffold

Neutral browser game scaffold built with `Phaser`, `Vite`, and strict `TypeScript`.

## Stack

- `Phaser 3.90`
- `Vite 8`
- `TypeScript 6` in strict mode
- `ESLint 10`
- `Vitest 4`
- `pnpm`

## Commands

```bash
pnpm install
pnpm dev
pnpm lint
pnpm test
pnpm build
pnpm preview
```

## What is in the repo

```text
public/assets/      Future runtime-loaded audio, fonts, and art
src/game/assets.ts  Runtime texture keys for scaffold visuals
src/game/config.ts  Shared Phaser config and scene registration
src/game/scenes/    Boot, preload, menu, and placeholder scene flow
src/game/utils/     Small pure helpers with tests
```

## Current state

- No gameplay is implemented on purpose.
- `BootScene` creates runtime textures for neutral placeholder visuals.
- `PreloadScene` is kept as the future hook for static asset loading.
- `MenuScene` routes into a placeholder `GameScene` so the scene pipeline stays wired.
- The scaffold still supports `pnpm lint`, `pnpm test`, and `pnpm build`.

## Itch.io notes

- `vite.config.ts` uses `base: './'` so production assets resolve correctly from a zipped HTML5 upload.
- Final output is emitted into `dist/` and can be uploaded directly to `itch.io`.
