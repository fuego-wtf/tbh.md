import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import type {
  CatalogSnapshot,
  CatalogPayload,
  Listing,
  ListingType,
  ShardPointer,
} from "./types.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const GROUP_TO_TYPE: Record<keyof CatalogSnapshot["groups"], ListingType> = {
  modes: "mode",
  lenses: "lens",
  skills: "skill",
  mcps: "mcp",
  states: "state",
};

// Valid listing types, derived from the group map above so a poisoned shard
// payload cannot inject an arbitrary `entity_type` into the install pipeline.
const VALID_LISTING_TYPES = new Set<string>(Object.values(GROUP_TO_TYPE));

function toNumber(input: unknown, fallback = 0): number {
  return typeof input === "number" && Number.isFinite(input) ? input : fallback;
}

function normalizeGroup(group: keyof CatalogSnapshot["groups"], items: unknown[]): Listing[] {
  const fallbackType = GROUP_TO_TYPE[group];
  return items
    .map((item, index) => {
      const x = (item ?? {}) as Record<string, unknown>;
      const owner = String(x.owner ?? "community");
      const slug = String(x.slug ?? x.entity_id ?? `listing-${index}`);
      const rawType = String(x.entity_type ?? fallbackType);
      const type: ListingType = VALID_LISTING_TYPES.has(rawType)
        ? (rawType as ListingType)
        : fallbackType;
      const versions =
        Array.isArray(x.versions) && x.versions.length > 0
          ? x.versions.map((v) => String(v))
          : [String(x.version ?? "1.0.0")];

      return {
        id: String(x.listing_id ?? `${group}-${index}`),
        type,
        owner,
        slug,
        name: String(x.name ?? slug),
        description: String(x.description ?? ""),
        version: String(x.version ?? versions[0] ?? "1.0.0"),
        versions,
        installs: toNumber(x.installs, 0),
        weeklyInstalls:
          typeof x.weekly_installs === "number" && Number.isFinite(x.weekly_installs)
            ? Number(x.weekly_installs)
            : null,
        artifactPath: x.artifact_path ? String(x.artifact_path) : null,
        url: x.url ? String(x.url) : null,
      } satisfies Listing;
    })
    .filter((x) => x.owner.length > 0 && x.slug.length > 0);
}

/**
 * Deterministic dedupe key: owner + type + slug + version.
 * When a duplicate is encountered, the entry encountered first wins
 * (global catalog entries have priority, shard entries only fill gaps).
 */
function dedupeKey(listing: Listing): string {
  return `${listing.owner.toLowerCase()}|${listing.type}|${listing.slug.toLowerCase()}|${listing.version}`;
}

export async function loadCatalogSnapshot(): Promise<CatalogSnapshot> {
  const parsed = await loadCatalogPayload();

  // Normalize global groups into Listing arrays
  const globalSnapshot: CatalogSnapshot = {
    generatedAt: parsed.generatedAt ?? null,
    groups: {
      modes: normalizeGroup("modes", parsed.groups?.modes ?? []),
      lenses: normalizeGroup("lenses", parsed.groups?.lenses ?? []),
      skills: normalizeGroup("skills", parsed.groups?.skills ?? []),
      mcps: normalizeGroup("mcps", parsed.groups?.mcps ?? []),
      states: normalizeGroup("states", parsed.groups?.states ?? []),
    },
  };

  // If no shard pointers, return global snapshot as-is (fully backward-compatible)
  const shards: ShardPointer[] = Array.isArray(parsed.shards) ? parsed.shards : [];
  if (shards.length === 0) {
    return globalSnapshot;
  }

  // Attempt to load and merge org shard indexes
  try {
    return await mergeShards(globalSnapshot, shards);
  } catch {
    // Shard load failure: gracefully fall back to global catalog only
    return globalSnapshot;
  }
}

/**
 * Load org shard indexes and merge into the global snapshot.
 * Global entries always win on dedupe key collision.
 */
async function mergeShards(
  globalSnapshot: CatalogSnapshot,
  shards: ShardPointer[],
): Promise<CatalogSnapshot> {
  // Build a seen-set from global entries (they have priority)
  const seen = new Set<string>();
  for (const listing of allListings(globalSnapshot)) {
    seen.add(dedupeKey(listing));
  }

  // Merge shard listings into group buckets (preserving group order)
  const merged: CatalogSnapshot = {
    generatedAt: globalSnapshot.generatedAt,
    groups: {
      modes: [...globalSnapshot.groups.modes],
      lenses: [...globalSnapshot.groups.lenses],
      skills: [...globalSnapshot.groups.skills],
      mcps: [...globalSnapshot.groups.mcps],
      states: [...globalSnapshot.groups.states],
    },
  };

  const catalogBasePath = path.resolve(__dirname, "../../../public/catalog");

  for (const shard of shards) {
    try {
      const shardPayload = await loadShardPayload(catalogBasePath, shard);
      if (!shardPayload) continue;

      for (const group of ["modes", "lenses", "skills", "mcps", "states"] as const) {
        const items = normalizeGroup(group, shardPayload.groups?.[group] ?? []);
        for (const item of items) {
          const key = dedupeKey(item);
          if (!seen.has(key)) {
            seen.add(key);
            merged.groups[group].push(item);
          }
        }
      }
    } catch {
      // Individual shard failure: skip this shard, continue with others
    }
  }

  return merged;
}

/**
 * Load a single org shard index from local disk.
 *
 * Security: (1) path-containment — the resolved path must stay inside
 * catalogBasePath to prevent directory traversal via poisoned shard pointers.
 * (2) SHA-256 integrity — the raw bytes are hashed and compared to
 * ShardPointer.sha256 before parsing; shards with a missing or mismatched
 * digest are rejected with a clear console warning.
 */
async function loadShardPayload(
  catalogBasePath: string,
  shard: ShardPointer,
): Promise<CatalogPayload | null> {
  // (1) Path-containment check — reject any shard that escapes the catalog root.
  const resolved = path.resolve(catalogBasePath, shard.path);
  const containmentPrefix = catalogBasePath.endsWith(path.sep)
    ? catalogBasePath
    : catalogBasePath + path.sep;
  if (resolved !== catalogBasePath && !resolved.startsWith(containmentPrefix)) {
    console.warn(
      `[catalog] Rejected shard "${shard.owner}": path "${shard.path}" escapes catalog root.`,
    );
    return null;
  }

  const rawBytes = await readFile(resolved);

  // (2) SHA-256 integrity check — skip shard when digest is absent or mismatched.
  if (!shard.sha256 || typeof shard.sha256 !== "string" || shard.sha256.trim() === "") {
    console.warn(
      `[catalog] Skipping shard "${shard.owner}": no sha256 digest provided.`,
    );
    return null;
  }
  const actualDigest = createHash("sha256").update(rawBytes).digest("hex");
  if (actualDigest !== shard.sha256.trim().toLowerCase()) {
    console.warn(
      `[catalog] Rejected shard "${shard.owner}": SHA-256 mismatch ` +
        `(expected ${shard.sha256}, got ${actualDigest}).`,
    );
    return null;
  }

  return JSON.parse(rawBytes.toString("utf8")) as CatalogPayload;
}

async function loadCatalogPayload(): Promise<CatalogPayload> {
  const remote = process.env.TBH_CATALOG_URL?.trim();
  if (remote) {
    try {
      const response = await fetch(remote, { cache: "no-store" });
      if (response.ok) {
        return (await response.json()) as CatalogPayload;
      }
    } catch {
      // fall through to local snapshot
    }
  }

  const filePath = path.resolve(__dirname, "../../../public/catalog/index.json");
  const raw = await readFile(filePath, "utf8");
  return JSON.parse(raw) as CatalogPayload;
}

export function allListings(snapshot: CatalogSnapshot): Listing[] {
  return Object.values(snapshot.groups).flat();
}

export function findListing(
  snapshot: CatalogSnapshot,
  owner: string,
  slug: string,
  type?: ListingType,
): Listing | null {
  const entries = allListings(snapshot);
  return (
    entries.find(
      (listing) =>
        listing.owner.toLowerCase() === owner.toLowerCase() &&
        listing.slug.toLowerCase() === slug.toLowerCase() &&
        (!type || listing.type === type),
    ) ?? null
  );
}
