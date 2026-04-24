# Battery Replacement Slice

## Summary
- `Battery replacement` is now the first implemented maintenance slice and covers a complete `remove -> discard -> take -> install` loop.
- `GameScene` uses three stations for the loop: the machine socket, a discard bin, and a fresh battery supply.
- Interaction uses `E`, surfaces contextual prompts plus objective text, and ends in a simple completed state once the fresh battery is installed.

## Files
- `src/game/battery-flow.ts` - pure state machine for the battery task, held item rules, interaction targets, prompts, and completion state.
- `src/game/battery-flow.test.ts` - unit coverage for the ordered battery loop and invalid interaction cases.
- `src/game/scenes/GameScene.ts` - room layout, station placement, `E` interaction wiring, objective/prompt rendering, held-item handling, and battery-task completion flow.
- `src/game/scenes/BootScene.ts` - runtime placeholder textures for the machine, batteries, discard bin, and fresh battery supply.
- `src/game/assets.ts` - runtime asset keys for the new battery-slice placeholder textures.
- `src/agent/debug.ts` - gameplay snapshots now include battery task state, held item, can-dash status, and nearby interaction target.

## Decisions
- Keep the battery task logic in `src/game/battery-flow.ts` so interaction rules stay pure and unit testable outside Phaser scene code.
- Limit the player to one held item at a time during maintenance interactions.
- Disable dash while carrying a battery so transport remains a deliberate tradeoff instead of a faster version of movement.

## Errors and fixes
- None.

## Follow-ups
- Reuse the same station-and-state-machine pattern for later maintenance slices so new tasks can expose prompts, objectives, and debug state without embedding rules directly in `GameScene`.
