# Oiling Charge Sandbox

## Summary
- `Oiling` remains an isolated maintenance prototype built around a single mechanic in an otherwise empty room.
- `GameScene` no longer hosts the oiling sandbox; the mechanic remains in reusable modules for later recomposition or a future dedicated test room.
- A dry gear triggers on a timer, alternates between left and right gears, and degrades from `needs-oil` to `grinding` if ignored.
- The player starts with `3` oil charges, can refill at the oil pump when empty, and services the active gear without picking up a carried item.
- Debug snapshots and the dev HUD still reserve `oilingTask` state for future oiling-room validation even when another sandbox is active.

## Files
- `src/game/oiling-flow.ts` - pure oiling state machine for dry-gear timing, oil charges, objectives, prompts, and service/refill interactions.
- `src/game/oiling-flow.test.ts` - unit coverage for gear triggering, grinding escalation, oil refills, service completion, and alternating gear order.
- `src/game/scenes/BootScene.ts` - runtime placeholder textures for the oil pump and gear states.
- `src/game/assets.ts` - asset keys for `gear-healthy`, `gear-needs-oil`, `gear-grinding`, and `oil-pump`.
- `src/agent/debug.ts` - `oilingTask` debug snapshot fields and HUD text for oiling-state reads during validation.

## Decisions
- Keep oiling rules in `src/game/oiling-flow.ts` so timing and interaction logic stay unit testable outside Phaser scene code.
- Model oiling as a refillable charge resource instead of a carried object, so dash remains available during the sandbox while routing pressure still comes from pump refills.
- Alternate the active gear after each successful service so attention shifts across the room over time.

## Errors and fixes
- None.

## Follow-ups
- Reuse `src/game/oiling-flow.ts` when oiling is composed back into multi-mechanic shift layouts.
