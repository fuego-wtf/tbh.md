import { allListings, loadCatalogSnapshot } from "../runtime/catalog.js";
import type { CliResult } from "../runtime/output.js";

export async function runFindCommand(query: string | null): Promise<CliResult> {
  const snapshot = await loadCatalogSnapshot();
  const entries = allListings(snapshot);
  const q = query?.trim().toLowerCase();

  const filtered = !q
    ? entries
    : entries.filter(
        (entry) =>
          entry.slug.toLowerCase().includes(q) ||
          entry.owner.toLowerCase().includes(q) ||
          entry.name.toLowerCase().includes(q) ||
          entry.description.toLowerCase().includes(q),
      );

  return {
    ok: true,
    code: 0,
    message: `Found ${filtered.length} listing(s).`,
    data: filtered.map((entry) => ({
      target: `@${entry.owner}/${entry.slug}`,
      type: entry.type,
      version: entry.version,
      description: entry.description,
      installs: entry.installs,
    })),
  };
}
