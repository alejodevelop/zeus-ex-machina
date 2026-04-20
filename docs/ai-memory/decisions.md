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

## Local agent validation

- Local visual and playable validation runs from Vite dev mode through `pnpm dev:agent`, which fixes the URL at `http://127.0.0.1:5173` for browser automation.
- Dev-only browser hooks are opt-in through `?agent-tools=1`; production builds must not depend on the HUD or `window.__gameDebug`.
- Use Playwright-driven browser input for real interaction, and use `window.__gameDebug` only for scene jumps, focus recovery, and exact state reads that a canvas screenshot cannot expose.
- `playwright-cli` is a local agent-environment prerequisite and is intentionally not added to `package.json`.

## Agent-operated pixel art

- The default pixel-art tool for the agent is the ad-free Piskel editor at `https://www.piskelapp.com/kids/`, because it stays browser-based and Playwright-operable.
- Keep editable `.piskel` source files and shared palettes under `art/piskel/`.
- Export runtime PNG, GIF, and sprite sheet assets into `public/assets/`; those exports are the files the game should load.
- Prefer local save and export flows over Piskel gallery or account-based storage.
