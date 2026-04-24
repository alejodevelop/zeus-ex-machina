# Cracks Sandbox Slice

## Summary
- `GameScene` is now a cracks-only prototype room for focused playtesting of a single mechanic in isolation.
- A crack appears on a timed interval, progresses through warning and blocked states, and is repaired by carrying a repair plate to the blocked lane.
- After repair, the next crack later respawns on the alternate lane so traversal pressure shifts across the room over time.

## Files
- `src/game/cracks-flow.ts` - pure crack lifecycle logic for spawn timing, warning/blocked windows, repair handling, and alternating lane selection.
- `src/game/cracks-flow.test.ts` - unit coverage for timed crack progression, repair behavior, and respawn lane alternation.
- `src/game/traversal-blockers.ts` - pure helpers that derive lane blockage state from active crack data.
- `src/game/traversal-blockers.test.ts` - unit coverage for blocked-lane calculations.
- `src/game/maintenance-items.ts` - shared carried-item helpers used by the repair-plate flow and reusable by other maintenance tasks.
- `src/game/scenes/GameScene.ts` - isolated sandbox-room wiring for crack spawn timing, plate pickup and repair interactions, traversal gating, and focused prototype HUD text.
- `src/game/scenes/BootScene.ts` - runtime placeholder textures for crack-sandbox props.
- `src/game/assets.ts` - asset keys for crack, repair-plate, and related sandbox placeholders.
- `src/agent/debug.ts` - debug snapshots expose crack-task state while `batteryTask` is intentionally `null` in this sandbox.

## Decisions
- Treat cracks as pure gameplay logic outside Phaser scene code so timing and repair rules stay unit testable.
- Reuse shared maintenance-item carry helpers instead of duplicating held-item rules per mechanic.
- Disable dash while carrying the repair plate so repair runs preserve the same movement tradeoff as other transport tasks.

## Errors and fixes
- None.

## Follow-ups
- Reuse the cracks and traversal-blocker modules when cracks are later composed into multi-mechanic levels.
