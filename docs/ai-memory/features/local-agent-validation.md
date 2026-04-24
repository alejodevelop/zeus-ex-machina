# Local Agent Validation

## Summary
- The repo supports local-only visual and playable validation through a fixed Vite dev server (`pnpm dev:agent`) plus Playwright-driven browser input.
- `?agent-tools=1` enables a dev-only HUD and `window.__gameDebug`, giving the agent scene state, canvas metrics, pointer info, gameplay state, focus recovery, and scene jump controls.
- `?agent-tools=1&hud=0` keeps the debug bridge active without drawing the HUD so screenshots stay clean.
- `?scene=game` and `?scene=menu` are the only supported preload shortcuts, and all agent flags are ignored outside Vite dev mode.
- The workflow assumes `playwright-cli` exists on the local agent machine and does not add it as a project dependency.

## Files
- `package.json` - adds `dev:agent` for a fixed local dev URL.
- `src/main.ts` - installs the dev-only game debug bridge alongside the Phaser game instance.
- `src/agent/launch-options.ts` - parses agent-specific URL flags.
- `src/agent/session.ts` - exports the parsed browser session options.
- `src/agent/debug.ts` - decorates the canvas with `data-testid="game-canvas"`, exposes `window.__gameDebug`, surfaces scene-provided gameplay snapshots including per-scene gameplay state, and mounts the optional HUD with automation-friendly `data-testid` values.
- `src/agent/launch-options.test.ts` - covers the query flag parsing rules.
- `src/game/scenes/PreloadScene.ts` - honors the optional local start-scene shortcut.
- `src/styles.css` - styles the local HUD.
- `docs/agent-local-validation.md` - documents the local browser workflow.

## Decisions
- Keep all agent validation hooks dev-only and opt-in via query params so shipping builds and player-facing visuals stay clean.
- Use Playwright or the local browser for real input, while `window.__gameDebug` stays limited to inspection, focus recovery, and scene-control helpers.
- Keep clean screenshot capture built into the same workflow through `hud=0` instead of maintaining a second debug mode.

## Errors and fixes
- Symptom: browser automation can open the page but still cannot infer canvas state.
- Root cause: Phaser gameplay renders inside a single canvas with little DOM-readable state.
- Fix: enable `?agent-tools=1` and read `window.__gameDebug.getSnapshot()` or the HUD `data-testid` values.

- Symptom: a screenshot looks polluted by the debug overlay.
- Root cause: the dev HUD is enabled by default when agent tools are active.
- Fix: reload with `?agent-tools=1&hud=0` before capturing the image.

## Follow-ups
- Extend `window.__gameDebug` through per-scene `getDebugState()` providers when new gameplay loops need automation-visible state.
- Keep future scene additions reflected in the local HUD and scene-jump helpers when they become part of the playable validation workflow.
