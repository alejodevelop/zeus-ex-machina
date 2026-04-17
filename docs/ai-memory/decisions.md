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
- Scene order is defined centrally in `src/game/config.ts`: `BootScene` -> `PreloadScene` -> `MenuScene` -> `GameScene`.
- `BootScene` owns runtime-generated placeholder textures and `PreloadScene` is the hook for future external asset loading.
- Keep scene ids in `src/game/scenes/scene-keys.ts` and scaffold asset keys in `src/game/assets.ts` to avoid string drift.

## Frame sizing

- The game frame stays at `960x540` in `src/game/config.ts` and the shell keeps a matching `16 / 9` aspect ratio in `src/styles.css`.
- If the project changes aspect ratio later, update both files together.

## Testing boundary

- `vitest.config.ts` uses the `node` environment and includes `src/**/*.test.ts` only.
- Put deterministic, non-Phaser-heavy logic in plain modules under `src/game/` or `src/game/utils/` so it can be unit tested without a browser runtime.

## Deployment target

- `vite.config.ts` keeps `base: './'` so built asset URLs stay relative.
- Treat `dist/` as the deployable HTML5 bundle; this supports direct upload to hosts like `itch.io` that serve the game from a subpath or zip root.
