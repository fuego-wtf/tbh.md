import type { GraphynContext } from './types';

/**
 * Detect whether tbh.md is running inside Graphyn Desktop (BrowserPane iframe).
 *
 * Honest detection only: checks for a parent window (iframe context).
 * Does NOT invent user identity or session data — that requires the
 * postMessage handshake in host-bridge.ts (follow-up wave).
 *
 * Until the host bridge is wired, this always returns { isGraphyn: false }.
 */
export function detectGraphynContext(): GraphynContext {
  const isIframe = typeof window !== 'undefined' && window.parent !== window;

  // For now, we do NOT trust iframe context alone for authenticated features.
  // The real Graphyn host bridge (follow-up) will confirm via postMessage handshake.
  // Until then, always report non-Graphyn context to keep all UI honest.
  void isIframe;

  return {
    isGraphyn: false,
    user: null,
  };
}
