# Contributing to tbh.md

## Local setup

```bash
pnpm install
pnpm run dev
```

## Quality gate

```bash
pnpm run typecheck
pnpm run build
```

## Principles

- Keep UI parity with prototype intent (`prototypes/tbh.jsx` in graphyn-workspace).
- No synthetic success states for catalog/install paths.
- Keep core logic in `src/core/*`, not in page components.
