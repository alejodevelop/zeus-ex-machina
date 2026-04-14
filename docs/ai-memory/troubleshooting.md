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

## Missing keyboard plugin in gameplay

- Symptom: `Keyboard input is unavailable in GameScene.`
- Root cause: `src/game/scenes/GameScene.ts` requires `this.input.keyboard`; custom Phaser input config can remove or disable that plugin.
- Fix: keep the default keyboard plugin available when editing `src/game/config.ts` input settings.
