# AI Memory Index

This directory stores compact, durable context for future OpenCode sessions.

It should describe the current truth of the repo. Historical context lives in Git.

## How to use this memory

- Start here when a task depends on prior project work.
- For manual lookup in OpenCode, run `/recall-feature <query>`.
- For cleanup after refactors or removals, run `/review-memory [scope]`.
- Search this directory by feature name, file path, module name, tag, or exact error text.
- Read only the matching notes.
- Rewrite or trim stale notes in place, and review deletions before removing obsolete notes from the active tree.

## Shared notes

- `decisions.md` - cross-feature decisions and constraints
- `troubleshooting.md` - reusable errors, root causes, and fixes
- `features/README.md` - feature-note conventions

## Features

- `features/basic-movement.md` - single-room top-down movement prototype with bounded `WASD`/arrow-key movement and gameplay debug state
- `features/dash-added.md` - Shift-triggered movement dash with locked dash direction, short cooldown, and debug-visible dash state
- `features/game-direction.md` - agreed pre-content machine-maintenance direction, planned failure types, shift framing, and current non-implemented status
- `features/local-agent-toolchain.md` - local-only agent workflow boundary: fixed dev URL, external `playwright-cli`, and validation/art entry points
- `features/local-agent-validation.md` - dev-only browser validation flow with Playwright-friendly hooks and `window.__gameDebug`
- `features/main-menu.md` - minimal title screen flow, preload routing into the menu, and return-to-menu controls from the playable game scene
- `features/piskel-asset-workflow.md` - ad-free Piskel browser workflow, source/export locations, and shared starter palette for agent-made pixel art
- `features/project-setup.md` - neutral Phaser/Vite/TypeScript scaffold, scene startup flow, and build constraints
