import type { GraphynContext } from './types';

export const TBH_HOST_CONTEXT_REQUEST_TYPE = 'graphyn:tbh:context_request';
export const TBH_HOST_CONTEXT_RESPONSE_TYPE = 'graphyn:tbh:context_response';

const HOST_CONTEXT_TIMEOUT_MS = 3000;

/**
 * Origins that are permitted to act as the Graphyn Desktop parent frame.
 *
 * Tauri v2 serves the app shell from:
 *   - tauri://localhost       (macOS / Linux production)
 *   - https://tauri.localhost (Windows production)
 *   - http://localhost:1420   (dev mode, all platforms)
 *
 * Any message arriving from an origin not in this list is ignored.
 * Requests are sent only to the first matching origin determined at runtime;
 * if the parent origin is unknown we send to all allowed origins so at least
 * one reaches the real parent — still far narrower than '*'.
 */
const ALLOWED_PARENT_ORIGINS: readonly string[] = [
  'tauri://localhost',
  'https://tauri.localhost',
  'http://localhost:1420',
];

function isAllowedParentOrigin(origin: string): boolean {
  return ALLOWED_PARENT_ORIGINS.includes(origin);
}

interface InjectedGraphynContext {
  isGraphyn?: boolean;
  authToken?: string | null;
  idServiceUrl?: string | null;
  user?: {
    handle?: string | null;
    displayName?: string | null;
  } | null;
}

type GraphynContextWindow = Window & {
  __GRAPHYN_TBH_CONTEXT__?: InjectedGraphynContext;
};

interface HostContextResponseMessage {
  type?: string;
  requestId?: string;
  context?: InjectedGraphynContext;
}

function emptyGraphynContext(): GraphynContext {
  return {
    isGraphyn: false,
    user: null,
    authToken: null,
    idServiceUrl: null,
  };
}

function normalizeInjectedContext(raw: unknown): GraphynContext {
  if (!raw || typeof raw !== 'object') return emptyGraphynContext();
  const hostContext = raw as InjectedGraphynContext;
  if (hostContext.isGraphyn !== true) return emptyGraphynContext();

  const handle =
    typeof hostContext.user?.handle === 'string'
      ? hostContext.user.handle.trim()
      : '';
  const displayName =
    typeof hostContext.user?.displayName === 'string'
      ? hostContext.user.displayName.trim()
      : '';
  const authToken =
    typeof hostContext.authToken === 'string' && hostContext.authToken.trim()
      ? hostContext.authToken
      : null;
  const idServiceUrl =
    typeof hostContext.idServiceUrl === 'string' &&
    hostContext.idServiceUrl.trim()
      ? hostContext.idServiceUrl.replace(/\/+$/, '')
      : null;

  return {
    isGraphyn: true,
    user:
      handle && displayName
        ? {
            handle,
            displayName,
          }
        : null,
    authToken,
    idServiceUrl,
  };
}

function writeGraphynContext(context: GraphynContext): void {
  if (typeof window === 'undefined') return;
  Object.defineProperty(window, '__GRAPHYN_TBH_CONTEXT__', {
    value: context,
    writable: false,
    configurable: true,
    enumerable: true,
  });
}

function canRequestHostContext(): boolean {
  if (typeof window === 'undefined') return false;
  if (!window.parent) return false;
  return window.parent !== window;
}

/**
 * Detect whether tbh.md is running inside Graphyn Desktop (BrowserPane iframe).
 *
 * Honest detection only: reads the host-injected Graphyn context. It does not
 * invent user identity, auth, or listing API state.
 */
export function detectGraphynContext(): GraphynContext {
  if (typeof window === 'undefined') {
    return emptyGraphynContext();
  }

  return normalizeInjectedContext(
    (window as GraphynContextWindow).__GRAPHYN_TBH_CONTEXT__,
  );
}

export async function requestGraphynHostContext(): Promise<GraphynContext | null> {
  if (!canRequestHostContext()) return null;

  return new Promise<GraphynContext | null>((resolve) => {
    const requestId = `tbh-context-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    let settled = false;
    let timeoutId: number | null = null;

    const finish = (context: GraphynContext | null) => {
      if (settled) return;
      settled = true;
      if (timeoutId !== null) {
        window.clearTimeout(timeoutId);
      }
      window.removeEventListener('message', handleMessage);
      resolve(context);
    };

    const handleMessage = (event: MessageEvent) => {
      // Require the message to come from window.parent AND from an allowed origin.
      // Checking only event.source is insufficient: a hostile parent frame can
      // still be window.parent and spoof a crafted context response.
      if (event.source !== window.parent) return;
      if (!isAllowedParentOrigin(event.origin)) return;
      const payload = event.data as HostContextResponseMessage | undefined;
      if (!payload || typeof payload !== 'object') return;
      if (payload.type !== TBH_HOST_CONTEXT_RESPONSE_TYPE) return;
      if (payload.requestId !== requestId) return;

      const context = normalizeInjectedContext(payload.context);
      if (context.isGraphyn) {
        writeGraphynContext(context);
        finish(context);
        return;
      }

      finish(null);
    };

    timeoutId = window.setTimeout(
      () => finish(null),
      HOST_CONTEXT_TIMEOUT_MS,
    );

    window.addEventListener('message', handleMessage);
    // Send the request to each allowed parent origin instead of '*'.
    // The real Tauri parent will only receive the message on its actual origin;
    // the others are no-ops (the browser silently drops cross-origin postMessage
    // when targetOrigin does not match the recipient's origin).
    for (const allowedOrigin of ALLOWED_PARENT_ORIGINS) {
      window.parent.postMessage(
        {
          type: TBH_HOST_CONTEXT_REQUEST_TYPE,
          requestId,
        },
        allowedOrigin,
      );
    }
  });
}
