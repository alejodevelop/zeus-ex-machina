# Main Menu

## Summary
- `MenuScene` is now a minimal title screen with a pulsing prompt that starts the game on any pointer click or keyboard press.
- `PreloadScene` immediately routes into `MenuScene` by default, while still honoring the local agent `startScene` override.
- `GameScene` keeps the placeholder scaffold but now includes explicit return-to-menu controls.

## Files
- `src/game/scenes/MenuScene.ts` - title text, animated start prompt, and guarded fade transition into `GameScene`.
- `src/game/scenes/PreloadScene.ts` - skips a standalone preload screen and routes to the configured start scene.
- `src/game/scenes/GameScene.ts` - placeholder handoff scene with `Back to Menu` UI plus `Esc` and `M` shortcuts.

## Decisions
- Keep the menu as a lightweight scene transition layer instead of adding separate preload/menu state management.
- Accept both pointer and keyboard input from the menu so local play and browser automation can start the game the same way.

## Errors and fixes
- None.
