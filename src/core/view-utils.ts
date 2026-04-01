import type { ListingType } from './types';

export const TYPE_ORDER: ListingType[] = ['mode', 'lens', 'skill', 'mcp'];

export function installCmd(owner: string, slug: string, version: string | null = null): string {
  const base = `npx tbh install @${owner}/${slug}`;
  return version && version !== 'latest' ? `${base}@${version}` : base;
}

export function fmtInstalls(n: number): string {
  return n >= 1000 ? `${(n / 1000).toFixed(n >= 10000 ? 0 : 1)}k` : String(n);
}

export function statusColor(s: string): string {
  return s === 'PASS'
    ? 'var(--tb-ok)'
    : s === 'WARN'
      ? 'var(--tb-warn)'
      : s === 'FAIL'
        ? 'var(--tb-err)'
        : 'var(--tb-t3)';
}

export function shouldIgnoreCardClick(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  return !!target.closest('button, a, input, textarea, select');
}
