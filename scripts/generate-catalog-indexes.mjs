#!/usr/bin/env node

/**
 * generate-catalog-indexes.mjs
 *
 * Reads the canonical global catalog (public/catalog/index.json),
 * extracts per-owner listings into deterministic shard indexes,
 * and rewrites the global index with additive shard pointers.
 *
 * Non-destructive: the global `groups` field retains ALL listings.
 * Shards are a denormalized view used by the CLI for optional merge.
 *
 * Usage:
 *   node scripts/generate-catalog-indexes.mjs
 *   node scripts/generate-catalog-indexes.mjs --input <path> --output-dir <path>
 */

import { readFileSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import { join, dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { createHash } from "node:crypto";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const REPO_ROOT = resolve(__dirname, "..");

// ---------------------------------------------------------------------------
// CLI arg parsing (minimal)
// ---------------------------------------------------------------------------
function parseArgs() {
  const args = process.argv.slice(2);
  let input, outputDir;
  for (let i = 0; i < args.length; i++) {
    if (args[i] === "--input" && args[i + 1]) input = args[++i];
    if (args[i] === "--output-dir" && args[i + 1]) outputDir = args[++i];
  }
  return {
    input: input ?? join(REPO_ROOT, "public/catalog/index.json"),
    outputDir: outputDir ?? join(REPO_ROOT, "public/catalog"),
  };
}

// ---------------------------------------------------------------------------
// SHA-256 helper
// ---------------------------------------------------------------------------
function sha256Hex(content) {
  return createHash("sha256").update(content).digest("hex");
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------
function main() {
  const { input, outputDir } = parseArgs();

  if (!existsSync(input)) {
    console.error(`[generate-catalog-indexes] ERROR: canonical source not found: ${input}`);
    process.exit(1);
  }

  const raw = readFileSync(input, "utf8");
  const source = JSON.parse(raw);

  const groups = source.groups ?? {};
  const groupNames = Object.keys(groups);
  if (groupNames.length === 0) {
    console.warn("[generate-catalog-indexes] WARN: no groups found in source — nothing to shard.");
    process.exit(0);
  }

  // 1. Collect all listings and bucket by owner
  const ownerToListings = new Map();
  for (const groupName of groupNames) {
    const items = Array.isArray(groups[groupName]) ? groups[groupName] : [];
    for (const item of items) {
      const owner = String(item.owner ?? "community").toLowerCase();
      if (!ownerToListings.has(owner)) ownerToListings.set(owner, []);
      ownerToListings.get(owner).push({ ...item, _group: groupName });
    }
  }

  // 2. Generate per-org shard indexes (deterministic sort by group + slug + version)
  const orgDir = join(outputDir, "orgs");
  mkdirSync(orgDir, { recursive: true });

  const shardPointers = [];
  const sortedOwners = [...ownerToListings.keys()].sort();

  for (const owner of sortedOwners) {
    const listings = ownerToListings.get(owner);

    // Sort deterministically: group name → slug → version
    listings.sort((a, b) => {
      const gc = a._group.localeCompare(b._group);
      if (gc !== 0) return gc;
      const sc = String(a.slug).localeCompare(String(b.slug));
      if (sc !== 0) return sc;
      return String(a.version).localeCompare(String(b.version));
    });

    // Partition into groups
    const shardGroups = {};
    for (const item of listings) {
      const group = item._group;
      delete item._group; // strip internal field before writing
      if (!shardGroups[group]) shardGroups[group] = [];
      shardGroups[group].push(item);
    }

    const shardPayload = {
      generatedAt: source.generatedAt ?? new Date().toISOString(),
      groups: shardGroups,
    };

    const shardJson = JSON.stringify(shardPayload, null, 2) + "\n";
    const shardPath = `orgs/${owner}.json`;

    writeFileSync(join(outputDir, shardPath), shardJson, "utf8");

    shardPointers.push({
      owner,
      path: shardPath,
      count: listings.length,
      sha256: sha256Hex(shardJson),
    });

    console.log(`  shard → ${shardPath} (${listings.length} listing(s))`);
  }

  // 3. Rebuild global index with shard pointers (additive field)
  const globalPayload = {
    ...source,
    shards: shardPointers,
  };

  const globalJson = JSON.stringify(globalPayload, null, 2) + "\n";
  writeFileSync(join(outputDir, "index.json"), globalJson, "utf8");

  const totalListings = [...ownerToListings.values()].flat().length;
  console.log(
    `[generate-catalog-indexes] OK — ${totalListings} listing(s) across ${sortedOwners.length} org(s), ${shardPointers.length} shard(s) written.`,
  );
}

main();
