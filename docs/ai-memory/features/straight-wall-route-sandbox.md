# Straight Wall Route Sandbox

## Summary
- `GameScene` is now a straight-wall-only collision lab for validating route shaping, wall sliding, and dash stops in an otherwise empty room.
- The sandbox composes reusable straight-wall prefabs in quarter, half, and full lengths with horizontal or vertical orientation.
- Debug snapshots and the dev HUD expose `obstacleSandbox` state with the current route hint and active blocker count.

## Files
- `src/game/obstacles.ts` - pure obstacle prefab data, sandbox placements, blocker generation, size labels, and rotating route-hint summary.
- `src/game/obstacles.test.ts` - unit coverage for prefab composition, blocker bounds, wall sizes, route-hint cycling, and label helpers.
- `src/game/traversal-blockers.ts` - pure blocker collision helpers that stop movement through walls while allowing axis sliding.
- `src/game/traversal-blockers.test.ts` - unit coverage for blocker collisions, sliding, and safe escape when starting inside a blocker.
- `src/game/scenes/GameScene.ts` - obstacle sandbox room wiring, safe spawn selection, wall rendering, movement constraint application, and debug-state provider.
- `src/game/scenes/BootScene.ts` - runtime placeholder textures for horizontal and vertical straight walls.
- `src/game/assets.ts` - asset keys for the straight-wall textures.
- `src/agent/debug.ts` - `obstacleSandbox` debug snapshot fields and HUD summary for local validation.

## Decisions
- Keep wall prefab definitions and blocker geometry in `src/game/obstacles.ts` so future rooms can reuse obstacle layouts without Phaser scene code.
- Reuse `src/game/traversal-blockers.ts` for both normal movement and dash resolution so collision rules stay consistent and unit testable.

## Errors and fixes
- None.

## Follow-ups
- Reuse the obstacle prefab and traversal-blocker modules when later maintenance rooms need static route-shaping walls.
