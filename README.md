# tbh.md

Open-source discovery surface for Graphyn modes, lenses, skills, and MCP listings.

Repository: https://github.com/fuego-wtf/tbh.md

## Stack

- React 19 + TypeScript + Vite

## Deploy

**Primary:** Cloudflare Pages.

## Local Development

```bash
bun install
bun run dev
```

## CLI (Open Source)

The repo now includes an executable CLI surface:

```bash
bun run build:cli
node cli-dist/cli.js --help
```

Preferred usage after publish (Bun):

```bash
bunx @tbh-md/cli find code-review
bunx @tbh-md/cli view @graphyn/code-review
bunx @tbh-md/cli install @graphyn/code-review
```

Alternative usage:

```bash
bun dlx @tbh-md/cli find code-review
bun dlx @tbh-md/cli view @graphyn/code-review
bun dlx @tbh-md/cli install @graphyn/code-review
```

### Static-first install (v0.1.2+)

Install is **backend-optional** and works from static artifacts by default.

Strategy order:
1. **API (optional override)** — attempted only when `TBH_INSTALL_API_BASE` is set and returns success.
2. **Static artifact** — local/remote artifact resolver chain.
3. **Generated** — if no artifact exists, CLI generates an install document from catalog metadata.

Current truth contract:
- CLI commands are executable.
- Install is backend-optional; without API it installs from static artifacts.
- `TBH_ARTIFACT_BASE_URL` controls optional remote static host.
- `TBH_INSTALL_TARGET` accepts: `default | claude-code | codex | custom`.
- `TBH_INSTALL_DIR` sets install root for `default`, and is required for `custom`.
- `TBH_INSTALL_API_BASE` enables optional API strategy; failure degrades to static.
- Integrity: SHA-256 hash returned in every install payload (`integrity` field).

## Environment

Copy from `.env.example`:

```text
VITE_TBH_CATALOG_URL=
```

Only `VITE_TBH_CATALOG_URL` is needed — it points to the Backyard catalog API. When unset, the app falls back to static sample data.

### CLI environment (optional)

```text
TBH_CATALOG_URL=
TBH_ARTIFACT_BASE_URL=https://tbh.md
TBH_INSTALL_TARGET=default
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
