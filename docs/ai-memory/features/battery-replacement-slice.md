# Battery Replacement Slice

## Summary
- `Battery replacement` is now the first implemented maintenance slice and covers a complete `remove -> discard -> take -> install` loop.
- The active battery sandbox was removed from `GameScene` after the project adopted isolated one-mechanic prototype rooms.
- Battery logic remains reusable for future composition back into shared levels or dedicated battery test rooms.

## Files
- `src/game/battery-flow.ts` - pure state machine for the battery task, held item rules, interaction targets, prompts, and completion state.
- `src/game/battery-flow.test.ts` - unit coverage for the ordered battery loop and invalid interaction cases.
- `src/game/maintenance-items.ts` - shared carried-item helpers reused by battery and cracks tasks.
- `src/game/scenes/BootScene.ts` - runtime placeholder textures for the machine, batteries, discard bin, and fresh battery supply.
- `src/game/assets.ts` - runtime asset keys for battery-related placeholder textures that remain available even when the active sandbox changes.
- `src/agent/debug.ts` - gameplay snapshots still expose the battery field, which can be set to `null` when another isolated sandbox is active.

## Decisions
- Keep the battery task logic in `src/game/battery-flow.ts` so interaction rules stay pure and unit testable outside Phaser scene code.
- Limit the player to one held item at a time during maintenance interactions.
- Disable dash while carrying a battery so transport remains a deliberate tradeoff instead of a faster version of movement.
- Preserve battery systems as modular building blocks even when the current `GameScene` prototype focuses on another mechanic.

## Errors and fixes
- None.

## Follow-ups
- Recompose the battery loop with other maintenance mechanics later at the level-design stage instead of reactivating multiple mechanics in the same prototype room too early.
