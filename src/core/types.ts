export type ListingType = 'mode' | 'lens' | 'skill' | 'mcp' | 'state';
export type GroupName = 'modes' | 'lenses' | 'skills' | 'mcps' | 'states';

export interface ListingAudit {
  name: string;
  status: 'PASS' | 'WARN' | 'FAIL' | string;
}

export interface Listing {
  id: string;
  type: ListingType;
  owner: string;
  slug: string;
  name: string;
  description: string;
  version: string;
  versions: string[];
  provider: string;
  installs: number;
  weeklyInstalls: number | null;
  repository: string | null;
  githubStars: number | null;
  firstSeen: string | null;
  audits: ListingAudit[];
  artifactPath: string | null;
  installBehavior: string;
  url: string | null;
  insights?: ListingInsights;
  trust?: TrustProvenance;
  experiences?: AgentExperience[];
}

// Honesty platform: every number is a receipt (value+denominator+n+source) or
// status:'unavailable' (no number rendered). Populated by future packs; absent today.

export interface Insight {
  value: number | null;
  denominator: number | null;
  n: number;
  computed_at: string | null;
  confidence?: { ci_low: number; ci_high: number } | null;
  source_event: string;
  status: 'ok' | 'insufficient_n' | 'low_coverage' | 'stale' | 'unavailable';
}

export interface ListingInsights {
  retention_7d?: Insight;
  retention_30d?: Insight;
  adoption?: Insight;
  success_rate?: Insight;
  version_coverage?: Insight;
  freshness?: { days_since_publish?: number; days_since_last_run?: number };
  popularity?: Insight;
}

export interface TrustProvenance {
  tier: 'official' | 'verified' | 'community';
  manifest_signed: boolean;
  reputation?: Insight;
}

export interface AgentExperience {
  listing_version_used: string;
  manifest_sha_used: string;
  way_of_work: string;
  outcome_evidence?: string;
  corroborations: number;
  visible: boolean;
}

export interface CatalogSnapshot {
  generatedAt: string | null;
  groups: Record<GroupName, Listing[]>;
}

export type CatalogSource = 'loading' | 'network' | 'cache' | 'unavailable' | 'api' | 'static-fallback';

export interface CatalogLoadResult {
  snapshot: CatalogSnapshot;
  source: CatalogSource;
}

export interface InstallRequest {
  owner: string;
  type: ListingType;
  slug: string;
  version?: string;
  listingId?: string;
  sourceUrl?: string | null;
  artifactPath?: string | null;
}

export type InstallState = 'idle' | 'queued' | 'installing' | 'installed' | 'error';

export interface InstallResult {
  status: InstallState;
  message?: string;
  installId?: string;
  progress?: number;
}

export type RouteState =
  | { page: 'find' }
  | { page: 'manage' }
  | { page: 'handoff'; token: string }
  | { page: 'owner'; owner: string }
  | { page: 'detail'; owner: string; type: ListingType; slug: string };

export interface GraphynContext {
  isGraphyn: boolean;
  user: { handle: string; displayName: string } | null;
  authToken?: string | null;
  idServiceUrl?: string | null;
}
