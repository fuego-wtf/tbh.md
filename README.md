# tbh.md

Open-source honesty registry and discovery surface for Graphyn modes/lenses/skills/MCP listings.

## Stack

- React + TypeScript + Vite

## Local Development

```bash
pnpm install
pnpm run dev
```

## Environment

Copy from `.env.example`:

```text
VITE_TBH_CATALOG_URL=
VITE_TBH_INSTALL_API_BASE=
VITE_TBH_INSTALL_PATH=/api/tbh/install
VITE_TBH_DEEPLINK_SCHEME=graphyn://install
```

## Route Map

- `/find`
- `/@owner`
- `/@owner/:type/:slug`
- `/manage`

## Install behavior

- Graphyn context (`?graphyn_auth=1`): attempts backend install API.
- External context: command/deeplink fallback.

## License

MIT
