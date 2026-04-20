# Piskel Asset Workflow

## Summary
- The repo uses Piskel as the default agent-operated pixel art editor because it is browser-based and can be driven through `playwright-cli`.
- Use `https://www.piskelapp.com/kids/` by default; it removes ad noise and keeps automation more stable than the default editor page.
- Editable `.piskel` source files and shared palettes live under `art/piskel/`, while runtime exports belong in `public/assets/sprites/` or `public/assets/tilesets/`.
- Use `art/piskel/ASSET-BRIEF-TEMPLATE.md` to define canvas size, frame count, palette, and silhouette before drawing.
- `art/piskel/palettes/scaffold-warm.gpl` is the starter shared palette, mirrored as hex values in `art/piskel/palettes/README.md`.

## Files
- `docs/agent-piskel-workflow.md` - step-by-step workflow for agent-operated pixel art in Piskel.
- `art/piskel/README.md` - source file conventions.
- `art/piskel/ASSET-BRIEF-TEMPLATE.md` - reusable brief template for new art requests.
- `art/piskel/palettes/scaffold-warm.gpl` - starter palette file.
- `art/piskel/palettes/README.md` - human-readable hex reference for the shared palette.
- `public/assets/sprites/README.md` - runtime sprite export location.
- `public/assets/tilesets/README.md` - runtime tile export location.

## Decisions
- Use the Piskel Kids URL by default so browser automation does not fight ads or extra page chrome.
- Keep source art files separate from runtime assets: `.piskel` stays under `art/piskel/`, exported images stay under `public/assets/`.
- Prefer keyboard shortcuts over toolbar clicks when automating Piskel, because shortcuts are more stable across upstream UI changes.

## Errors and fixes
- Symptom: Piskel automation becomes noisy or unstable because page ads move the layout around.
- Root cause: the default editor page includes ad content above the editor.
- Fix: use `https://www.piskelapp.com/kids/`.

- Symptom: exported art exists in the repo but the editable source is missing.
- Root cause: only PNG, GIF, or sheet exports were saved.
- Fix: save the corresponding `.piskel` file under `art/piskel/` whenever the asset matters beyond a throwaway draft.
