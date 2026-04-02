export function helpText(): string {
  return `
tbh — tbh.md CLI (open source)

USAGE
  tbh <command> [options]

COMMANDS
  find [query]                 Search listings
  view @owner/slug             Show listing detail
  install @owner/slug[@ver]    Install listing (truthful contract path)
  list                         List catalog entries
  remove @owner/slug           Remove listing (not wired yet)
  login                        Sign in guidance
  whoami                       Session status guidance

GLOBAL OPTIONS
  --json                       Machine-readable output
  --help, -h                   Show help
  --version, -v                Show version

ENVIRONMENT
  TBH_CATALOG_URL              Optional remote catalog endpoint
  TBH_INSTALL_API_BASE         Optional install API base URL
  TBH_INSTALL_PATH             Optional install path (default: /api/tbh/install)
  TBH_INSTALL_DIR              Optional local install output directory

REPO
  https://github.com/fuego-wtf/tbh.md
`.trim();
}
