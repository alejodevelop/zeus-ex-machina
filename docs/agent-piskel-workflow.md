# Agent Piskel Workflow

This repo uses Piskel as the first-choice pixel art editor for agent-driven asset work.

## Why Piskel

- It is browser-based, so the agent can operate it with `playwright-cli`.
- It is fast for small sprites, pickups, UI icons, tiles, and short animations.
- It exports PNG, GIF, and sprite sheets without adding a new repo dependency.

## Recommended URL

Use `https://www.piskelapp.com/kids/`.

- It keeps the editor ad-free and reduces layout noise during automation.
- It avoids depending on sign-in or gallery features.
- It exposes the same core drawing workflow the agent needs.

## Project file locations

- Save editable `.piskel` source files under `art/piskel/`.
- Save shared palettes under `art/piskel/palettes/`.
- Export runtime sprites into `public/assets/sprites/`.
- Export tiles and tile sheets into `public/assets/tilesets/`.

## Recommended flow

1. Open `https://www.piskelapp.com/kids/` with `playwright-cli`.
2. Set the target canvas size for the asset.
3. Draw with keyboard shortcuts plus mouse input.
4. Save the editable `.piskel` source file into `art/piskel/`.
5. Export the runtime PNG, GIF, or sprite sheet into `public/assets/...`.
6. Load the export in the game and review it with the local validation workflow.

## What I verified

- The agent can open `https://www.piskelapp.com/kids/` successfully through `playwright-cli`.
- The editor exposes stable keyboard shortcuts and a large central canvas stack suitable for mouse-driven drawing.
- The Kids URL keeps the editor free of ad slots that appeared on the default Piskel editor page.

## Useful shortcuts

- `P` - pen
- `B` - bucket fill
- `E` - eraser
- `L` - line
- `R` - rectangle
- `C` - circle
- `M` - move
- `S` - rectangle select
- `H` - lasso select
- `O` - color picker
- `A` - fill all matching pixels
- `T` - dithering
- `U` - lighten or darken
- `X` - swap colors

## Automation notes

- Prefer keyboard shortcuts over clicking toolbar icons because the shortcut path is more stable.
- The small canvas preview is not the drawing surface; the large center canvas stack is the one that receives drawing input.
- Save and export locally instead of relying on any cloud or gallery state.
- If the upstream UI changes, start with `playwright-cli snapshot` before drawing.

## Shared palette

- `art/piskel/palettes/scaffold-warm.gpl` is the default starter palette.
- `art/piskel/palettes/README.md` mirrors the same colors as hex values in case palette import is awkward in the current session.

## Practical limits

- Piskel is best for compact pixel assets and quick iteration, not painterly illustration.
- Canvas drawing is still coordinate-driven, so complex assets work best when the brief defines size, silhouette, and palette up front.
