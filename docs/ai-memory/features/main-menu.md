# Main Menu

## Summary
- `MenuScene` is a minimal title screen with a pulsing prompt that starts the game on any pointer click or keyboard press.
- `PreloadScene` immediately routes into `MenuScene` by default, while still honoring the local agent `startScene` override.
- `GameScene` remains the main playable scene launched from the menu, but its sandbox content changes as maintenance prototypes rotate.

## Files
- `src/game/scenes/MenuScene.ts` - title text, animated start prompt, and guarded fade transition into `GameScene`.
- `src/game/scenes/PreloadScene.ts` - skips a standalone preload screen and routes to the configured start scene.
- `src/game/scenes/GameScene.ts` - current maintenance sandbox scene launched from the menu.

## Decisions
- Keep the menu as a lightweight scene transition layer instead of adding separate preload/menu state management.
- Accept both pointer and keyboard input from the menu so local play and browser automation can start the game the same way.

## Errors and fixes
- None.
