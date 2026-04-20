# Local Agent Toolchain

## Summary
- The supported local agent workflow has two browser-first lanes: playable validation in the game and pixel-art editing in Piskel.
- `pnpm dev:agent` serves the game at `http://127.0.0.1:5173` so local browser automation has a stable target.
- `playwright-cli` is expected in the local agent environment and is intentionally not pinned in `package.json`.
- Use `https://www.piskelapp.com/kids/` for agent-operated pixel art; keep editable sources in `art/piskel/` and export runtime assets into `public/assets/`.

## Files
- `package.json` - pins `pnpm@10.33.0` and defines `dev:agent`.
- `README.md` - top-level entry point for the local validation and pixel-art workflows.
- `docs/agent-local-validation.md` - local browser validation flow and `window.__gameDebug` usage.
- `docs/agent-piskel-workflow.md` - local Piskel workflow for agent-made pixel art.
- `src/agent/launch-options.ts` - parses `agent-tools`, `hud`, and `scene` flags for the local validation lane.
- `src/agent/debug.ts` - exposes the local debug bridge and HUD used by browser automation.
- `art/piskel/` - editable source files, briefs, and shared palettes.
- `public/assets/` - exported runtime art assets.

## Decisions
- Keep the agent toolchain local-only and browser-first instead of adding repo-pinned automation or editor dependencies.
- Keep gameplay validation on the fixed Vite dev URL and guard browser hooks behind dev-only query flags.
- Keep art source files separate from shipped assets: `.piskel` files stay in `art/piskel/`, exports go in `public/assets/`.

## Errors and fixes
- Symptom: `playwright-cli` commands are unavailable in a local session.
- Root cause: the repo does not install `playwright-cli` as a project dependency.
- Fix: provide `playwright-cli` in the local agent environment instead of changing `package.json`.

- Symptom: local browser automation targets the wrong game URL.
- Root cause: the regular Vite dev server does not guarantee the fixed host and port expected by the workflow.
- Fix: start the game with `pnpm dev:agent` and use `http://127.0.0.1:5173`.

## Follow-ups
- If the local toolchain ever changes away from `playwright-cli` or Piskel, rewrite this note and the two workflow docs together.
