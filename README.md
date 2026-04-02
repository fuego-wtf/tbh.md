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

Target usage after publish:

```bash
npx @graphyn/tbh find code-review
npx @graphyn/tbh view @graphyn/code-review
npx @graphyn/tbh install @graphyn/code-review
```

Current truth contract:
- CLI commands are executable.
- Install only returns success when a real install API is configured.
- If install API is not configured, CLI returns an explicit unavailable message (no fake success).

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
