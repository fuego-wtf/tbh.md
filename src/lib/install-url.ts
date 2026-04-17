/**
 * Deep-link URL helpers for graphyn://install protocol.
 *
 * Format: `graphyn://install/{owner}/{slug}?type={type}&version={version}`
 *
 * Used by InstallCTA when tbh.md is opened in an external browser —
 * clicking the link launches Graphyn Desktop (or brings it to foreground)
 * and triggers the install flow.
 */

/** Parameters for building a graphyn://install URL. */
export interface InstallUrlParams {
  owner: string;
  slug: string;
  /** Listing type (mode, lens, skill, mcp). */
  type?: string;
  /** Optional version pin (omit for latest). */
  version?: string;
}

/**
 * Build a `graphyn://install/{owner}/{slug}` deep-link URL.
 *
 * Path segments carry owner and slug (required). Type and version are
 * optional query parameters — the desktop installer uses owner/slug to
 * resolve the catalog entry; type/version are hints that skip a lookup
 * round-trip when present.
 */
export function buildInstallUrl(params: InstallUrlParams): string {
  const { owner, slug, type, version } = params;
  const base = `graphyn://install/${encodeURIComponent(owner)}/${encodeURIComponent(slug)}`;
  const qs: string[] = [];
  if (type) qs.push(`type=${encodeURIComponent(type)}`);
  if (version) qs.push(`version=${encodeURIComponent(version)}`);
  return qs.length > 0 ? `${base}?${qs.join('&')}` : base;
}
