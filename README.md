# Machine Shift

Code-first bootstrap for `Gamedev.js Jam 2026` built with `Phaser`, `Vite`, and `TypeScript`.

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

## Project structure

```text
public/assets/      Static assets loaded at runtime
src/game/scenes/    Scene flow and presentation
src/game/entities/  Reusable gameplay actors
src/game/systems/   Session and spawn logic
src/game/utils/     Pure helpers with tests
```

## Current vertical slice

- Boot scene that generates runtime textures.
- Preload scene with external SVG asset loading.
- Menu scene with the initial loop entry point.
- Playable factory-floor slice with movement, scoring, timer, and restart flow.
- UI overlay scene with score and timer updates.

## Itch.io notes

- `vite.config.ts` uses `base: './'` so production assets resolve correctly from a zipped HTML5 upload.
- Final output is emitted into `dist/` and can be uploaded directly to `itch.io`.
