import type { AgentExperience, Insight, Listing } from '../core/types';
import { detectGraphynContext } from '../core/graphyn-context';

/* ------------------------------------------------------------------ */
/*  Errors                                                            */
/* ------------------------------------------------------------------ */

export class ListingApiError extends Error {
  constructor(
    message: string,
    public readonly status?: number,
  ) {
    super(message);
    this.name = 'ListingApiError';
  }
}

/* ------------------------------------------------------------------ */
/*  Helpers                                                           */
/* ------------------------------------------------------------------ */

function getBaseUrl(): string {
  const ctx = detectGraphynContext();
  if (ctx.idServiceUrl) return ctx.idServiceUrl;
  const envUrl = typeof import.meta !== 'undefined'
    ? (import.meta as { env?: Record<string, string | undefined> }).env?.VITE_LISTING_API_URL
    : undefined;
  if (envUrl) return envUrl;
  throw new ListingApiError('Listing API URL is not configured.');
}

function getAuthToken(explicit?: string): string {
  if (explicit) return explicit;
  const ctx = detectGraphynContext();
  if (ctx.authToken) return ctx.authToken;
  throw new ListingApiError('Auth token is not available. Sign in via Graphyn Desktop.');
}

async function request<T>(
  path: string,
  options: RequestInit & { authToken?: string },
): Promise<T> {
  const baseUrl = getBaseUrl();
  const token = getAuthToken(options.authToken);

  const res = await fetch(`${baseUrl}${path}`, {
    ...options,
    headers: {
      ...options.headers,
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });

  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new ListingApiError(
      body || `Listing API error: ${res.status} ${res.statusText}`,
      res.status,
    );
  }

  if (res.status === 204) return undefined as T;

  return res.json() as Promise<T>;
}

/* ------------------------------------------------------------------ */
/*  API functions                                                     */
/* ------------------------------------------------------------------ */

/** Fetch all listings owned by the authenticated user. */
export async function fetchMyListings(authToken?: string): Promise<Listing[]> {
  const data = await request<Listing[]>('/api/listings/mine', {
    method: 'GET',
    authToken,
  });
  return Array.isArray(data) ? data : [];
}

/** Publish a listing (new or re-publish). */
export async function publishListing(
  authToken: string | undefined,
  slug: string,
): Promise<void> {
  await request<void>(`/api/listings/${encodeURIComponent(slug)}/publish`, {
    method: 'POST',
    authToken,
  });
}

/** Unpublish a listing. */
export async function unpublishListing(
  authToken: string | undefined,
  slug: string,
): Promise<void> {
  await request<void>(`/api/listings/${encodeURIComponent(slug)}/unpublish`, {
    method: 'POST',
    authToken,
  });
}

/** Bump a listing to a new version. */
export async function bumpVersion(
  authToken: string | undefined,
  slug: string,
  version: string,
): Promise<void> {
  await request<void>(`/api/listings/${encodeURIComponent(slug)}/versions`, {
    method: 'POST',
    body: JSON.stringify({ version }),
    authToken,
  });
}

/** Delete a listing entirely. */
export async function deleteListing(
  authToken: string | undefined,
  slug: string,
): Promise<void> {
  await request<void>(`/api/listings/${encodeURIComponent(slug)}`, {
    method: 'DELETE',
    authToken,
  });
}

/* ------------------------------------------------------------------ */
/*  Honesty platform — product-signal insights (P4 → P5b consumer)    */
/* ------------------------------------------------------------------ */

/** Response shape of the id service `GET /signals/insights/:listing_slug`. */
export interface ListingInsightsResponse {
  listing_slug: string;
  insights: {
    success_rate?: Insight;
    adoption?: Insight;
    retention_7d?: Insight;
    retention_30d?: Insight;
  };
}

/**
 * Fetch org-scoped, suppression-first product-signal insights for a listing.
 *
 * The id endpoint is `requireAuth` + org-scoped, so this only resolves inside an
 * authenticated Graphyn context (Desktop host bridge or a signed-in tbh.md
 * session). In a plain public browser there is no token — `request()` throws,
 * and the caller renders suppression-first (no number). That is the honest,
 * privacy-correct default: org-scoped numbers are never shown to an anonymous
 * visitor, and nothing is ever merged into the public (cached) catalog payload.
 */
export async function fetchListingInsights(
  slug: string,
  authToken?: string,
): Promise<ListingInsightsResponse> {
  return request<ListingInsightsResponse>(
    `/signals/insights/${encodeURIComponent(slug)}`,
    { method: 'GET', authToken },
  );
}

/** Resolve an API base without requiring auth; null when none is configured. */
function getPublicBaseUrl(): string | null {
  const ctx = detectGraphynContext();
  if (ctx.idServiceUrl) return ctx.idServiceUrl;
  const envUrl =
    typeof import.meta !== 'undefined'
      ? (import.meta as { env?: Record<string, string | undefined> }).env?.VITE_LISTING_API_URL
      : undefined;
  return envUrl ?? null;
}

/**
 * Fetch the PUBLIC visible (approved + corroborated) Agent Experiences for a
 * listing. Unauthenticated — published experiences are public, redacted content
 * only. Best-effort: resolves to [] when no base URL is configured or the
 * request fails, so the caller renders the honest empty state.
 */
export async function fetchVisibleExperiences(slug: string): Promise<AgentExperience[]> {
  const base = getPublicBaseUrl();
  if (!base) return [];
  try {
    const res = await fetch(`${base}/experiences/${encodeURIComponent(slug)}`, {
      cache: 'no-store',
    });
    if (!res.ok) return [];
    const data = (await res.json().catch(() => null)) as
      | { experiences?: AgentExperience[] }
      | null;
    return Array.isArray(data?.experiences) ? data!.experiences : [];
  } catch {
    return [];
  }
}
