# tbh.md

Open-source discovery surface for Graphyn modes, lenses, skills, and MCP listings.

## Stack

- React 19 + TypeScript + Vite

## Deploy

**Primary:** Cloudflare Pages.

## Local Development

```bash
pnpm install
pnpm run dev
```

## Environment

Copy from `.env.example`:

```text
VITE_TBH_CATALOG_URL=
```

Only `VITE_TBH_CATALOG_URL` is needed — it points to the Backyard catalog API. When unset, the app falls back to static sample data.

## Route Map

| Path | Purpose |
|------|---------|
| `/find` | Browse listings |
| `/@owner` | Owner profile |
| `/@owner/:type/:slug` | Listing detail |
| `/manage` | (Future — not yet active) |

## License

MIT
