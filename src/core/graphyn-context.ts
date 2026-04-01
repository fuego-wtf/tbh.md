import type { GraphynContext } from './types';

export function detectGraphynContext(): GraphynContext {
  const isGraphyn =
    typeof window !== 'undefined' &&
    new URLSearchParams(window.location.search).get('graphyn_auth') === '1';

  return {
    isGraphyn,
    user: isGraphyn ? { handle: 'graphyn', displayName: 'Resat @ Graphyn' } : null,
  };
}
