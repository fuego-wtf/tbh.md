import { findListing, loadCatalogSnapshot } from "../runtime/catalog.js";
import { loadCliEnv } from "../runtime/env.js";
import { runInstallViaApi } from "../runtime/http.js";
import type { CliResult } from "../runtime/output.js";
import { parseInstallTarget } from "../runtime/target.js";

export async function runInstallCommand(rawTarget: string | null): Promise<CliResult> {
  if (!rawTarget) {
    return {
      ok: false,
      code: 1,
      message: "Missing target. Usage: tbh install @owner/slug[@version]",
    };
  }

  let target;
  try {
    target = parseInstallTarget(rawTarget);
  } catch (error) {
    return {
      ok: false,
      code: 1,
      message: error instanceof Error ? error.message : "Invalid install target",
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

  const env = loadCliEnv();
  const installResponse = await runInstallViaApi(env, {
    ...target,
    type: listing.type,
  });

  if (!installResponse.ok) {
    return {
      ok: false,
      code: 2,
      message: installResponse.message,
      data: {
        fallback: `npx @graphyn/tbh view @${listing.owner}/${listing.slug}`,
      },
    };
  }

  return {
    ok: true,
    code: 0,
    message: installResponse.message,
    data: {
      installId: installResponse.installId ?? null,
      target: `@${listing.owner}/${listing.slug}`,
      version: target.version ?? listing.version,
    },
  };
}
