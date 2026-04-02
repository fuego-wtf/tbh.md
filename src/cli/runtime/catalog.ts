import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import type { CatalogSnapshot, Listing, ListingType } from "./types.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const GROUP_TO_TYPE: Record<keyof CatalogSnapshot["groups"], ListingType> = {
  modes: "mode",
  lenses: "lens",
  skills: "skill",
  mcps: "mcp",
};

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
      const type = String(x.entity_type ?? fallbackType) as ListingType;
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
        url: x.url ? String(x.url) : null,
      } satisfies Listing;
    })
    .filter((x) => x.owner.length > 0 && x.slug.length > 0);
}

export async function loadCatalogSnapshot(): Promise<CatalogSnapshot> {
  const parsed = await loadCatalogPayload();

  return {
    generatedAt: parsed.generatedAt ?? null,
    groups: {
      modes: normalizeGroup("modes", parsed.groups?.modes ?? []),
      lenses: normalizeGroup("lenses", parsed.groups?.lenses ?? []),
      skills: normalizeGroup("skills", parsed.groups?.skills ?? []),
      mcps: normalizeGroup("mcps", parsed.groups?.mcps ?? []),
    },
  };
}

async function loadCatalogPayload(): Promise<{
  generatedAt?: string | null;
  groups?: Record<string, unknown[]>;
}> {
  const remote = process.env.TBH_CATALOG_URL?.trim();
  if (remote) {
    try {
      const response = await fetch(remote, { cache: "no-store" });
      if (response.ok) {
        return (await response.json()) as {
          generatedAt?: string | null;
          groups?: Record<string, unknown[]>;
        };
      }
    } catch {
      // fall through to local snapshot
    }
  }

  const filePath = path.resolve(__dirname, "../../../public/catalog/index.json");
  const raw = await readFile(filePath, "utf8");
  return JSON.parse(raw) as {
    generatedAt?: string | null;
    groups?: Record<string, unknown[]>;
  };
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
