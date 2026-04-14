# Decisions

Cross-feature decisions and constraints that future work should preserve.

## How to add entries

- Add only decisions that affect more than one future task or module.
- Prefer one short subsection per decision.
- Link affected files when possible.
- Rewrite or remove entries when the decision no longer constrains the current codebase.
- Do not keep superseded decisions here just for history; Git already preserves that context.

## Entries

## Toolchain and build gate

- Use `pnpm` as the package manager; `package.json` pins `pnpm@10.33.0`.
- Production builds run `tsc --noEmit && vite build` from `package.json`, so type errors block shipping builds.
- Core tooling is `Phaser` + `Vite` + strict `TypeScript`, with `ESLint` for linting and `Vitest` for automated tests.

## Phaser project structure

- `src/main.ts` is the single browser entry point and creates one `Phaser.Game` from `src/game/config.ts`.
- Scene order is defined centrally in `src/game/config.ts`: `BootScene` -> `PreloadScene` -> `MenuScene` -> `GameScene`, with `UiScene` launched alongside gameplay.
- Keep scene ids in `src/game/scenes/scene-keys.ts`, asset keys in `src/game/assets.ts`, and global event names in `src/game/events.ts` to avoid string drift.

## Testing boundary

- `vitest.config.ts` uses the `node` environment and includes `src/**/*.test.ts` only.
- Put deterministic, non-Phaser-heavy logic in `src/game/systems/` or `src/game/utils/` so it can be unit tested without a browser runtime.

## Deployment target

- `vite.config.ts` keeps `base: './'` so built asset URLs stay relative.
- Treat `dist/` as the deployable HTML5 bundle; this supports direct upload to hosts like `itch.io` that serve the game from a subpath or zip root.
