import type { ListingType } from './types';

const SAFE = /^[a-z0-9._-]+$/i;

export function isValidOwner(owner: string): boolean {
  return owner.length > 0 && owner.length <= 64 && SAFE.test(owner);
}

export function isValidSlug(slug: string): boolean {
  return slug.length > 0 && slug.length <= 120 && SAFE.test(slug);
}

export function isValidType(type: string): type is ListingType {
  return type === 'mode' || type === 'lens' || type === 'skill' || type === 'mcp' || type === 'state';
}
