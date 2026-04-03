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
  if (typeof window === 'undefined') {
    return {
      isGraphyn: false,
      user: null,
      authToken: null,
      idServiceUrl: null,
    };
  }

  const hostContext = (window as Window & {
    __GRAPHYN_TBH_CONTEXT__?: {
      isGraphyn?: boolean;
      authToken?: string;
      idServiceUrl?: string;
      user?: {
        handle?: string;
        displayName?: string;
      };
    };
  }).__GRAPHYN_TBH_CONTEXT__;

  if (hostContext?.isGraphyn === true) {
    const hasValidUser = Boolean(
      hostContext.user?.handle && hostContext.user?.displayName,
    );

    return {
      isGraphyn: true,
      user: hasValidUser
        ? {
          handle: hostContext.user!.handle!,
          displayName: hostContext.user!.displayName!,
        }
        : null,
      authToken: hostContext.authToken || null,
      idServiceUrl: hostContext.idServiceUrl || null,
    };
  }

  return {
    isGraphyn: false,
    user: null,
    authToken: null,
    idServiceUrl: null,
  };
}
