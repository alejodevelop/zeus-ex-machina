# Local Agent Validation

This repo now includes a local-only workflow for visual checks and playable browser automation.

## What it enables

- Open the game on a fixed dev URL with `pnpm dev:agent`.
- Drive real keyboard and mouse input through the local browser.
- Capture clean screenshots for art and layout review.
- Read scene state from `window.__gameDebug` when the canvas alone is not enough.

## Local dependency assumption

This workflow assumes the agent machine already has access to `playwright-cli`.

- It is intentionally not added to `package.json` because this setup is local-only.
- On this machine, `playwright-cli` is already available to the agent.

## URL flags

- `?agent-tools=1` enables the dev-only HUD and the `window.__gameDebug` bridge.
- `?agent-tools=1&hud=0` keeps the bridge active without drawing the HUD.
- `?agent-tools=1&scene=game` jumps from preload straight into `GameScene`.
- `?agent-tools=1&scene=menu` jumps from preload straight into `MenuScene`.

The flags are ignored outside Vite dev mode.

## Recommended local flow

1. Start the game with `pnpm dev:agent`.
2. Open `http://127.0.0.1:5173/?agent-tools=1` with `playwright-cli`.
3. Use browser input to play: click the canvas, press keys, and take screenshots.
4. When you need exact state, run `playwright-cli eval "window.__gameDebug?.getSnapshot()"`.
5. When you need a clean visual capture, reload with `?agent-tools=1&hud=0`.

## Useful browser commands

```bash
playwright-cli open http://127.0.0.1:5173/?agent-tools=1
playwright-cli snapshot
playwright-cli screenshot --filename=.playwright-cli/menu.png
playwright-cli press Space
playwright-cli eval "window.__gameDebug?.getSnapshot()"
playwright-cli eval "window.__gameDebug?.startScene('game')"
playwright-cli eval "window.__gameDebug?.restartActiveScene()"
```

## Exposed helpers

`window.__gameDebug` is available only when `?agent-tools=1` is active in dev mode.

- `getSnapshot()` returns the active scene, active scene list, canvas sizes, FPS, and pointer state.
- `listScenes()` returns all registered Phaser scene keys.
- `startScene(sceneKey)` jumps directly to a registered scene.
- `restartActiveScene()` restarts the current active scene.
- `focusCanvas()` focuses the game canvas before input.

## DOM hooks for automation

- The Phaser canvas gets `data-testid="game-canvas"` and an accessible label.
- The HUD uses `data-testid` attributes so browser automation can read its current values.
- The HUD includes scene jump buttons plus `restart` and `focus` shortcuts for faster local iteration.
