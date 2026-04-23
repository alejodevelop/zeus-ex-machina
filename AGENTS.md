# Project Instructions

## Quick Capability Index

- Memory lookup: `docs/ai-memory/INDEX.md`, `/recall-feature`, `/remember-feature`, `/review-memory`
- Local game run: `pnpm dev`, `pnpm dev:agent`
- Browser validation: local `playwright-cli`, `?agent-tools=1`, `&hud=0`, `&scene=menu|game`, `window.__gameDebug`
- Pixel art workflow: `https://www.piskelapp.com/kids/`, `art/piskel/`, `public/assets/sprites/`, `public/assets/tilesets/`
- Quality checks: `pnpm lint`, `pnpm test`, `pnpm build`, `pnpm preview`
- Core stack at hand: `Phaser`, `Vite`, strict `TypeScript`, `Vitest`, `ESLint`, `pnpm`

<!-- opencode-memory-kit:start -->
## Project Memory Workflow

This project uses a durable AI memory layer stored in `docs/ai-memory/`.

### Persistent Memory

- Use `docs/ai-memory/INDEX.md` as the entry point.
- For explicit manual lookup, use `/recall-feature <query>`.
- Memory is intentionally lazy-loaded. Do not read every file in `docs/ai-memory/` by default.
- When a task mentions existing functionality, prior decisions, regressions, previous bugs, or continuing work from a past session:
  1. Read `docs/ai-memory/INDEX.md`.
  2. Use `grep` on `docs/ai-memory/**/*.md` for relevant feature names, file paths, tags, and error strings.
  3. Read only the matching notes.
- Prefer `docs/ai-memory/features/*.md` for feature-specific implementation context.
- Prefer `docs/ai-memory/decisions.md` for durable cross-feature decisions and constraints.
- Prefer `docs/ai-memory/troubleshooting.md` for recurring errors, exact messages, root causes, and fixes.

### Updating Memory

- After a feature is implemented, iterated on, and accepted, persist durable context with `/remember-feature <kebab-case-slug>`.
- After a large refactor, feature removal, or cleanup pass, review stale memory with `/review-memory [scope]`.
- `docs/ai-memory/` should represent the current truth of the repo, not a historical archive.
- `/remember-feature` and `/review-memory` may automatically rewrite or trim stale notes when confidence is high.
- Deletions from the active memory tree require a brief review before removal.
- The memory update should capture only long-lived project knowledge:
  - relevant behavior now implemented
  - important files or modules touched
  - decisions that future work must respect
  - reusable debugging knowledge
- Do not store raw conversation logs, temporary speculation, or large diff narration.

### Memory Quality Bar

- Keep notes concise and searchable.
- Include exact file paths and exact error strings when useful.
- Update existing notes in place instead of creating duplicates.
- Remove obsolete sections once they stop being true.
- Use Git history for old context instead of keeping dead notes under `docs/ai-memory/`.
<!-- opencode-memory-kit:end -->
