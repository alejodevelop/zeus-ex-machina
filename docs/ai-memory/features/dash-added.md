# Dash Added

## Summary
- `GameScene` now supports a short Shift-triggered dash on top of the existing bounded movement loop.
- Dash direction locks when the dash starts, uses a short active window plus cooldown, and still respects room bounds.
- Local debug snapshots now expose dash state so browser validation can confirm active dashes and remaining cooldown.

## Files
- `src/game/movement.ts` - owns dash state, dash config, movement advancement, and bounds clamping in a pure testable module.
- `src/game/movement.test.ts` - covers dash start rules, locked dash direction, cooldown gating, large-delta clamping, and bounded dash movement.
- `src/game/scenes/GameScene.ts` - queues Shift input, applies dash-aware movement steps, and mirrors dash state into scene debug data.
- `src/agent/debug.ts` - exposes gameplay snapshots that now include `isDashing` and `dashCooldownRemainingMs`.

## Decisions
- Keep dash rules inside `src/game/movement.ts` instead of embedding them in Phaser update code so movement stays unit testable.
- Queue dash from non-repeating `keydown-SHIFT` events so holding Shift does not retrigger a dash every frame.

## Errors and fixes
- None.

## Follow-ups
- Reuse `advancePosition()` and the scene debug snapshot shape when future combat or animation work needs dash-aware movement state.
