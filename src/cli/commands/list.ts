import { allListings, loadCatalogSnapshot } from "../runtime/catalog.js";
import type { CliResult } from "../runtime/output.js";

export async function runListCommand(): Promise<CliResult> {
  const snapshot = await loadCatalogSnapshot();
  const entries = allListings(snapshot);

  return {
    ok: true,
    code: 0,
    message: `Catalog contains ${entries.length} listing(s).`,
    data: entries.map((entry) => ({
      target: `@${entry.owner}/${entry.slug}`,
      type: entry.type,
      version: entry.version,
    })),
  };
}
