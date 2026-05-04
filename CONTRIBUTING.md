# Contributing to tbh.md

## Local setup

```bash
bun install
bun run dev
```

## Quality gate

```bash
bun run typecheck
bun run build
```

## Principles

- Keep UI parity with prototype intent (`prototypes/tbh.jsx` in graphyn-workspace).
- No synthetic success states for catalog/install paths.
- Keep core logic in `src/core/*`, not in page components.
