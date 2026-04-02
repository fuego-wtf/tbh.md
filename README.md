# tbh.md

Open-source discovery surface for Graphyn modes, lenses, skills, and MCP listings.

Repository: https://github.com/fuego-wtf/tbh.md

## Stack

- React 19 + TypeScript + Vite

## Deploy

**Primary:** Cloudflare Pages.

## Local Development

```bash
pnpm install
pnpm run dev
```

## CLI (Open Source)

The repo now includes an executable CLI surface:

```bash
pnpm run build:cli
node cli-dist/cli.js --help
```

Preferred usage after publish (Bun):

```bash
bunx @graphyn/tbh find code-review
bunx @graphyn/tbh view @graphyn/code-review
bunx @graphyn/tbh install @graphyn/code-review
```

Alternative usage:

```bash
pnpm dlx @graphyn/tbh find code-review
pnpm dlx @graphyn/tbh view @graphyn/code-review
pnpm dlx @graphyn/tbh install @graphyn/code-review

# npm fallback
npm exec --yes --package @graphyn/tbh -- tbh find code-review
npm exec --yes --package @graphyn/tbh -- tbh install @graphyn/code-review
```

Current truth contract:
- CLI commands are executable.
- Install works without backend via static artifact install fallback.
- If `TBH_INSTALL_API_BASE` is configured, CLI prefers API install strategy.
- Static fallback installs to `.tbh/installed` by default (override with `TBH_INSTALL_DIR`).

## Environment

Copy from `.env.example`:

```text
VITE_TBH_CATALOG_URL=
```

Only `VITE_TBH_CATALOG_URL` is needed — it points to the Backyard catalog API. When unset, the app falls back to static sample data.

### CLI environment (optional)

```text
TBH_CATALOG_URL=
TBH_INSTALL_API_BASE=
TBH_INSTALL_PATH=/api/tbh/install
TBH_INSTALL_DIR=
```

## Route Map

| Path | Purpose |
|------|---------|
| `/find` | Browse listings |
| `/@owner` | Owner profile |
| `/@owner/:type/:slug` | Listing detail |
| `/manage` | (Future — not yet active) |

## License

MIT
