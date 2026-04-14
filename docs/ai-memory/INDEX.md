# AI Memory Index

This directory stores compact, durable context for future OpenCode sessions.

It should describe the current truth of the repo. Historical context lives in Git.

## How to use this memory

- Start here when a task depends on prior project work.
- For manual lookup in OpenCode, run `/recall-feature <query>`.
- For cleanup after refactors or removals, run `/review-memory [scope]`.
- Search this directory by feature name, file path, module name, tag, or exact error text.
- Read only the matching notes.
- Rewrite or trim stale notes in place, and review deletions before removing obsolete notes from the active tree.

## Shared notes

- `decisions.md` - cross-feature decisions and constraints
- `troubleshooting.md` - reusable errors, root causes, and fixes
- `features/README.md` - feature-note conventions

## Features

- `features/project-bootstrap.md` - initial stack, scene architecture, build constraints, and bootstrap entry points
