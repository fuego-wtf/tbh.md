import { findListing, loadCatalogSnapshot } from "../runtime/catalog.js";
import { parseInstallTarget } from "../runtime/target.js";
import type { CliResult } from "../runtime/output.js";

export async function runViewCommand(rawTarget: string | null): Promise<CliResult> {
  if (!rawTarget) {
    return {
      ok: false,
      code: 1,
      message: "Missing target. Usage: tbh view @owner/slug",
    };
  }

  let target;
  try {
    target = parseInstallTarget(rawTarget);
  } catch (error) {
    return {
      ok: false,
      code: 1,
      message: error instanceof Error ? error.message : "Invalid target format",
    };
  }

  const snapshot = await loadCatalogSnapshot();
  const listing = findListing(snapshot, target.owner, target.slug, target.type ?? undefined);
  if (!listing) {
    return {
      ok: false,
      code: 1,
      message: `Listing not found: @${target.owner}/${target.slug}`,
    };
  }

  return {
    ok: true,
    code: 0,
    message: `Listing: @${listing.owner}/${listing.slug}`,
    data: listing,
  };
}
