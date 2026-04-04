import posthog from 'posthog-js';

const SOURCE = 'tbh-md';
const APP_VERSION = '0.1.3';
const SESSION_STORAGE_KEY = 'graphyn:tbh:session_id';
const DEFAULT_HOST = 'https://us.i.posthog.com';

const dedupeMap = new Map<string, number>();
let telemetryReady = false;

type TelemetryEventName =
  | 'app.lifecycle'
  | 'feature.use'
  | 'waitlist.state_checked'
  | 'waitlist.entry_submitted'
  | 'waitlist.entry_created'
  | 'waitlist.entry_duplicate'
  | 'api.error';

interface CaptureOptions {
  dedupeKey?: string;
  dedupeMs?: number;
}

function randomId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function getSessionId(): string {
  if (typeof window === 'undefined') return 'server';
  try {
    const existing = window.sessionStorage.getItem(SESSION_STORAGE_KEY);
    if (existing) return existing;
    const created = randomId();
    window.sessionStorage.setItem(SESSION_STORAGE_KEY, created);
    return created;
  } catch {
    return randomId();
  }
}

function isWithinDedupeWindow(key: string, ms: number): boolean {
  const now = Date.now();
  const previous = dedupeMap.get(key);
  if (previous && now - previous < ms) {
    return true;
  }
  dedupeMap.set(key, now);
  return false;
}

function baseProperties(): Record<string, unknown> {
  return {
    source: SOURCE,
    app_version: APP_VERSION,
    env: import.meta.env.DEV ? 'development' : 'production',
    session_id: getSessionId(),
  };
}

export function initTelemetry(): boolean {
  const apiKey = import.meta.env.VITE_POSTHOG_KEY;
  if (!apiKey) {
    return false;
  }
  if (telemetryReady) {
    return true;
  }

  posthog.init(apiKey, {
    api_host: import.meta.env.VITE_POSTHOG_HOST || DEFAULT_HOST,
    capture_pageview: false,
    capture_pageleave: true,
    autocapture: true,
    session_recording: {
      maskAllInputs: true,
    },
  });
  telemetryReady = true;

  captureEvent('app.lifecycle', { state: 'started' }, { dedupeKey: 'tbh-app-started', dedupeMs: 60000 });
  return true;
}

export function captureEvent(
  event: TelemetryEventName,
  properties: Record<string, unknown> = {},
  options: CaptureOptions = {},
): void {
  if (!telemetryReady) return;
  if (options.dedupeKey && isWithinDedupeWindow(options.dedupeKey, options.dedupeMs ?? 1200)) {
    return;
  }
  posthog.capture(event, {
    ...baseProperties(),
    ...properties,
  });
}

export function captureException(
  error: unknown,
  properties: Record<string, unknown> = {},
  options: CaptureOptions = {},
): void {
  const normalized = error instanceof Error
    ? {
      name: error.name,
      message: error.message,
      stack: error.stack?.split('\n').slice(0, 6).join('\n'),
    }
    : {
      message: String(error),
    };
  captureEvent('api.error', { ...properties, error: normalized }, options);
}

export function identifyUser(userId: string, traits?: Record<string, string>): void {
  if (!telemetryReady) return;
  posthog.identify(userId, {
    ...traits,
    source: SOURCE,
  });
}

export function resetUser(): void {
  if (!telemetryReady) return;
  posthog.reset();
}

export function captureRouteView(route: string): void {
  captureEvent(
    'feature.use',
    {
      feature: 'route.view',
      route,
    },
    {
      dedupeKey: `route:${route}`,
      dedupeMs: 1500,
    },
  );
}
