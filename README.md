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
pnpm dev:agent
pnpm lint
pnpm test
pnpm build
pnpm preview
```

## Local agent validation

- Use `pnpm dev:agent` for a fixed local URL at `http://127.0.0.1:5173`.
- Add `?agent-tools=1` to expose a dev-only HUD plus `window.__gameDebug` for scene state and quick jumps.
- Add `&hud=0` when you want clean screenshots without the overlay.
- Add `&scene=game` or `&scene=menu` to skip directly into a stable validation state after preload.
- The browser side assumes a local `playwright-cli` command in the agent environment; it is intentionally not pinned as a repo dependency.
- Detailed browser automation workflow lives in `docs/agent-local-validation.md`.

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
- Dev mode now supports local agent validation through Playwright-friendly canvas hooks and a debug bridge.
- The scaffold still supports `pnpm lint`, `pnpm test`, and `pnpm build`.

## Itch.io notes

- `vite.config.ts` uses `base: './'` so production assets resolve correctly from a zipped HTML5 upload.
- Final output is emitted into `dist/` and can be uploaded directly to `itch.io`.
