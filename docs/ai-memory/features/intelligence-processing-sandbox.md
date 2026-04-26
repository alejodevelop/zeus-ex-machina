# Intelligence Processing Sandbox

## Summary
- `GameScene` is now an intelligence-only prototype room for validating the memory-module restore loop in isolation.
- The loop is `remove depleted module -> load station -> wait for processing -> take ready module -> reinstall`.
- Carrying either memory-module state disables dash, while the processing wait keeps room-routing pressure without adding another carried resource.
- Debug snapshots and the dev HUD expose the current intelligence objective, machine state, station state, and remaining processing time.

## Files
- `src/game/intelligence-flow.ts` - pure intelligence state machine for objectives, prompts, processing time, and interactions.
- `src/game/intelligence-flow.test.ts` - unit coverage for module removal, station loading, timer completion, ready pickup, reinstall, and dash restrictions.
- `src/game/scenes/GameScene.ts` - intelligence sandbox room wiring, interaction targeting, objective/status banners, and debug-state provider.
- `src/game/scenes/BootScene.ts` - runtime placeholder textures for the main computer, intelligence station, and memory modules.
- `src/game/assets.ts` - asset keys for the intelligence sandbox placeholders.
- `src/game/maintenance-items.ts` - shared held-item ids used by battery, cracks, and intelligence carry rules.
- `src/agent/debug.ts` - `intelligenceTask` debug snapshot fields and HUD summary for validation reads.

## Decisions
- Keep intelligence rules in `src/game/intelligence-flow.ts` so the timed processing loop stays unit testable outside Phaser scene code.
- Reuse `src/game/maintenance-items.ts` for memory-module carry states instead of adding intelligence-only held-item handling in the scene.
- Disable dash while carrying a module so the transport tradeoff matches the other carried-item maintenance mechanics.

## Errors and fixes
- None.

## Follow-ups
- Reuse `src/game/intelligence-flow.ts` when intelligence is composed back into later multi-mechanic shift layouts.
