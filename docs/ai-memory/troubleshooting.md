# Troubleshooting

Reusable debugging knowledge for this project.

## How to add entries

- Record only issues that are likely to recur.
- Prefer exact symptoms in backticks.
- Include root cause and fix.
- Rewrite or remove entries when the symptom, root cause, or fix no longer matches the current codebase.
- Do not keep solved-once historical notes that no longer help future debugging.

## Entries

## Relative asset paths for production uploads

- Symptom: built pages load but static assets fail when the `dist/` bundle is hosted from a subpath or zipped HTML5 upload.
- Root cause: absolute asset URLs break when the game is not served from the domain root.
- Fix: keep `base: './'` in `vite.config.ts`.

## Canvas ratio drift

- Symptom: the canvas looks clipped, stretched, or letterboxed oddly after layout changes.
- Root cause: `src/styles.css` and `src/game/config.ts` no longer agree on the game frame ratio.
- Fix: keep `#game` at `16 / 9` in `src/styles.css` or update it together with `GAME_WIDTH` and `GAME_HEIGHT` in `src/game/config.ts`.
