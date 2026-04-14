# Feature Notes

Create one file per accepted feature using a kebab-case slug.

## When to create a feature note

- The feature changed durable project behavior.
- Future work will benefit from remembering touched files, constraints, or fixes.

## Lifecycle

- Treat each feature note as the canonical record for the current state of that feature.
- Rewrite the note in place when behavior changes.
- Trim sections that became stale while keeping the useful parts.
- Delete the file when the feature is removed, absorbed, or no longer carries durable value.
- Do not archive obsolete feature notes under `docs/ai-memory/`; rely on Git history instead.
- Deletions require a brief review before removal.

## Recommended structure

- `# <Feature Title>`
- `## Summary`
- `## Files`
- `## Decisions`
- `## Errors and fixes`
- `## Follow-ups`

Record durable knowledge only. Avoid raw diff summaries and transient chat context.