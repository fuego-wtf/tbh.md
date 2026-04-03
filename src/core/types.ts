export type ListingType = 'mode' | 'lens' | 'skill' | 'mcp';
export type GroupName = 'modes' | 'lenses' | 'skills' | 'mcps';

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
  | { page: 'owner'; owner: string }
  | { page: 'detail'; owner: string; type: ListingType; slug: string };

export interface GraphynContext {
  isGraphyn: boolean;
  user: { handle: string; displayName: string } | null;
  authToken?: string | null;
  idServiceUrl?: string | null;
}
