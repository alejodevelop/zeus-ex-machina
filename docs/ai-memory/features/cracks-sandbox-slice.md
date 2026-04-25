# Cracks Sandbox Slice

## Summary
- `Cracks` remains a reusable isolated maintenance prototype built around a single mechanic in an otherwise empty room.
- A crack appears on a timed interval, progresses through warning and blocked states, and is repaired by carrying a repair plate to the blocked lane.
- After repair, the next crack later respawns on the alternate lane so traversal pressure shifts across the room over time.
- `GameScene` no longer hosts the cracks sandbox; the mechanic now lives in reusable modules for later recomposition or a future dedicated test room.

## Files
- `src/game/cracks-flow.ts` - pure crack lifecycle logic for spawn timing, warning/blocked windows, repair handling, and alternating lane selection.
- `src/game/cracks-flow.test.ts` - unit coverage for timed crack progression, repair behavior, and respawn lane alternation.
- `src/game/traversal-blockers.ts` - pure helpers that derive lane blockage state from active crack data.
- `src/game/traversal-blockers.test.ts` - unit coverage for blocked-lane calculations.
- `src/game/maintenance-items.ts` - shared carried-item helpers used by the repair-plate flow and reusable by other maintenance tasks.
- `src/game/scenes/BootScene.ts` - runtime placeholder textures for crack-sandbox props.
- `src/game/assets.ts` - asset keys for crack, repair-plate, and related sandbox placeholders.
- `src/agent/debug.ts` - debug snapshots still reserve `cracksTask` state for future crack-room validation even when another sandbox is active.

## Decisions
- Treat cracks as pure gameplay logic outside Phaser scene code so timing and repair rules stay unit testable.
- Reuse shared maintenance-item carry helpers instead of duplicating held-item rules per mechanic.
- Disable dash while carrying the repair plate so repair runs preserve the same movement tradeoff as other transport tasks.

## Errors and fixes
- None.

## Follow-ups
- Reuse the cracks and traversal-blocker modules when cracks are later composed into multi-mechanic levels.
