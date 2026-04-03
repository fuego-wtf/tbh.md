import { detectGraphynContext } from './graphyn-context';

type EmitStatus = 'sent' | 'skipped_unauthenticated' | 'failed';

interface EmitSignalInput {
  signal: string;
  detail?: string;
  metadata?: Record<string, unknown>;
}

export interface EmitSignalResult {
  status: EmitStatus;
  reason?: string;
}

function resolveIdBaseUrl(explicitUrl?: string | null): string {
  if (explicitUrl) {
    return explicitUrl;
  }
  return import.meta.env.DEV ? 'http://localhost:34785' : 'https://id.graphyn.xyz';
}

export async function emitTbhNotificationSignal(input: EmitSignalInput): Promise<EmitSignalResult> {
  const ctx = detectGraphynContext();
  if (!ctx.isGraphyn || !ctx.authToken) {
    return {
      status: 'skipped_unauthenticated',
      reason: 'Authenticated Graphyn context was not detected.',
    };
  }

  const endpoint = `${resolveIdBaseUrl(ctx.idServiceUrl)}/notifications/events`;
  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      authorization: `Bearer ${ctx.authToken}`,
    },
    body: JSON.stringify({
      event_type: 'product_signal',
      source: 'tbh-md',
      payload: {
        signal: input.signal,
        detail: input.detail,
        metadata: input.metadata,
      },
      idempotency_key: `tbh:${input.signal}:${Date.now()}`,
    }),
  }).catch(() => null);

  if (!response) {
    return {
      status: 'failed',
      reason: 'Notification ingest request failed to reach ID service.',
    };
  }

  if (!response.ok) {
    const reason = await response.text().catch(() => '');
    return {
      status: 'failed',
      reason: reason || `Notification ingest failed (${response.status}).`,
    };
  }

  return { status: 'sent' };
}
