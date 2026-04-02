export type ListingType = "mode" | "lens" | "skill" | "mcp";

export interface Listing {
  id: string;
  type: ListingType;
  owner: string;
  slug: string;
  name: string;
  description: string;
  version: string;
  versions: string[];
  installs: number;
  weeklyInstalls: number | null;
  artifactPath: string | null;
  url: string | null;
}

/**
 * Pointer to a per-org shard index file.
 * Present in the global catalog when org sharding is enabled.
 * Consumers that don't understand this field simply ignore it (additive).
 */
export interface ShardPointer {
  /** Org owner name (e.g. "graphyn", "xixu-me") */
  owner: string;
  /** Relative path from catalog root to the shard index (e.g. "orgs/graphyn.json") */
  path: string;
  /** Number of listings in the shard (informational) */
  count: number;
  /** SHA-256 hex digest of the shard payload for cache-busting / integrity checks */
  sha256: string;
}

/**
 * Raw global catalog payload as stored on disk / fetched remotely.
 * The `shards` field is optional and additive — existing consumers that don't
 * read it continue to work against `groups` alone.
 */
export interface CatalogPayload {
  generatedAt?: string | null;
  groups?: Record<string, unknown[]>;
  /** Optional per-org shard pointers. Absent = single-index mode. */
  shards?: ShardPointer[];
}

export interface CatalogSnapshot {
  generatedAt: string | null;
  groups: Record<"modes" | "lenses" | "skills" | "mcps", Listing[]>;
}

// --- Artifact source labels ---

export type ArtifactSource = "artifact-local" | "artifact-remote" | "generated";

// --- Install manifest ---

export interface InstallManifest {
  sha256: string;
  version: string;
  size?: number;
  created?: string;
}

// --- Install target adapters ---

export type InstallTargetType = "default" | "claude-code" | "codex" | "custom";
