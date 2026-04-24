# Basic Movement

## Summary
- `GameScene` is now a single-room top-down movement prototype instead of a static placeholder.
- The player moves on both axes with `WASD` or arrow keys, diagonal input is normalized, and movement stays inside the room bounds.
- The scene exposes minimal gameplay debug state so local agent validation can read player position, movement state, and walk bounds.

## Files
- `src/game/movement.ts` - pure movement helpers for direction normalization, delta-based movement, and bounds clamping.
- `src/game/movement.test.ts` - unit coverage for diagonal normalization, speed-by-delta movement, and bounds clamping.
- `src/game/scenes/GameScene.ts` - room layout, input wiring, player spawn, bounded movement loop, and debug-state provider.
- `src/game/scenes/BootScene.ts` - runtime-generated player texture.
- `src/game/assets.ts` - canonical runtime asset key for the player texture.
- `src/agent/debug.ts` - includes gameplay state from scenes that expose `getDebugState()`.

## Decisions
- Keep movement math in `src/game/movement.ts` so the Phaser scene stays thin and the rules remain unit testable in Vitest's `node` environment.
- Cap each movement step to `100ms` in `src/game/movement.ts` so tab stalls or long frames do not cause oversized jumps.

## Errors and fixes
- None.

## Follow-ups
- Add animation, collisions, or interactions on top of the existing bounded movement loop instead of re-embedding movement math directly in `GameScene`.
