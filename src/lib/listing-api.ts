import type { Listing } from '../core/types';
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
