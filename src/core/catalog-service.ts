import type {
  CatalogLoadResult,
  CatalogSnapshot,
  GroupName,
  Listing,
  ListingType,
} from './types';
import { isValidOwner, isValidSlug, isValidType } from './validators';
import { providerRegistry } from './providers/registry';

const CACHE_KEY = 'tbh.catalog.snapshot.v2';

const GROUP_TO_TYPE: Record<GroupName, ListingType> = {
  modes: 'mode',
  lenses: 'lens',
  skills: 'skill',
  mcps: 'mcp',
};

export function emptyGroups(): Record<GroupName, Listing[]> {
  return { modes: [], lenses: [], skills: [], mcps: [] };
}

function safeNumber(value: unknown, fallback = 0): number {
  return typeof value === 'number' && Number.isFinite(value) ? value : fallback;
}

export function normalizeCatalog(payload: any): CatalogSnapshot {
  const groups = emptyGroups();

  for (const [group, items] of Object.entries(payload?.groups ?? {})) {
    if (!Array.isArray(items)) continue;
    if (!['modes', 'lenses', 'skills', 'mcps'].includes(group)) continue;

    const mapped = (items as any[])
      .map((x, i): Listing | null => {
        const fallbackType = GROUP_TO_TYPE[group as GroupName];
        const typeRaw = x.entity_type ?? fallbackType;
        if (!isValidType(String(typeRaw))) return null;

        const owner = String(x.owner ?? 'community');
        const slug = String(x.slug ?? x.entity_id ?? x.name?.toLowerCase().replace(/\s+/g, '-') ?? `${typeRaw}-${i}`);
        if (!isValidOwner(owner) || !isValidSlug(slug)) return null;

        const versions = Array.isArray(x.versions) && x.versions.length > 0
          ? x.versions.map(String)
          : [String(x.version ?? '1.0.0')];

        return {
          id: String(x.listing_id ?? `${group}-${i}`),
          type: typeRaw,
          owner,
          slug,
          name: String(x.name ?? slug),
          description: String(x.description ?? ''),
          version: String(x.version ?? versions[0] ?? '1.0.0'),
          versions,
          provider: String(x.provider ?? 'community'),
          installs: safeNumber(x.installs, 0),
          weeklyInstalls: Number.isFinite(x.weekly_installs) ? Number(x.weekly_installs) : null,
          repository: x.repository ? String(x.repository) : null,
          githubStars: Number.isFinite(x.github_stars) ? Number(x.github_stars) : null,
          firstSeen: x.first_seen ? String(x.first_seen) : null,
          audits: Array.isArray(x.audits) ? x.audits : [],
          artifactPath: x.artifact_path ? String(x.artifact_path) : null,
          installBehavior: String(x.install_behavior ?? 'normal'),
          url: x.url ? String(x.url) : null,
        };
      })
      .filter((x): x is Listing => x !== null);

    groups[group as GroupName] = mapped;
  }

  return {
    generatedAt: payload?.generatedAt ?? payload?.generated_at ?? null,
    groups,
  };
}

export async function loadCatalog(): Promise<CatalogLoadResult> {
  const providers = providerRegistry.getProviders();
  for (const p of providers) {
    try {
      return await p.load();
    } catch {
      // fall through
    }
  }

  const cached = localStorage.getItem(CACHE_KEY);
  if (cached) {
    const parsed = JSON.parse(cached);
    return { snapshot: normalizeCatalog(parsed), source: 'cache' };
  }

  return { snapshot: { generatedAt: null, groups: emptyGroups() }, source: 'unavailable' };
}

export function cacheCatalogPayload(payload: unknown): void {
  localStorage.setItem(CACHE_KEY, JSON.stringify(payload));
}
