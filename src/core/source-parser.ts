import type { ListingType, RouteState } from './types';
import { isValidOwner, isValidSlug, isValidType } from './validators';

export const ROUTES = { find: '/find', manage: '/manage' };

export function parsePath(pathname: string): RouteState {
  const path = pathname || '/';
  if (path === '/' || path === ROUTES.find || path.endsWith('.html')) return { page: 'find' };
  if (path === ROUTES.manage) return { page: 'manage' };

  const parts = path.split('/').filter(Boolean);
  if (parts.length === 1) {
    const owner = parts[0]!.replace(/^@/, '');
    return isValidOwner(owner) ? { page: 'owner', owner } : { page: 'find' };
  }

  if (parts.length === 3) {
    const owner = parts[0]!.replace(/^@/, '');
    const type = parts[1] as ListingType;
    const slug = parts[2]!;
    if (isValidOwner(owner) && isValidType(type) && isValidSlug(slug)) {
      return { page: 'detail', owner, type, slug };
    }
  }

  return { page: 'find' };
}

export function toPath(route: RouteState): string {
  if (route.page === 'find') return ROUTES.find;
  if (route.page === 'manage') return ROUTES.manage;
  if (route.page === 'owner') return `/@${route.owner}`;
  return `/@${route.owner}/${route.type}/${route.slug}`;
}
