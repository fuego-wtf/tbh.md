import type { InstallRequest, InstallResult } from './types';
import { emitTbhNotificationSignal } from './notification-emitter';

const TBH_HOST_INSTALL_REQUEST_TYPE = 'graphyn:tbh:install_listing';
const TBH_HOST_INSTALL_RESULT_TYPE = 'graphyn:tbh:install_listing:result';
const HOST_INSTALL_TIMEOUT_MS = 30000;

interface HostInstallResultMessage {
  type: string;
  requestId: string;
  status?: InstallResult['status'];
  message?: string;
  installId?: string;
  progress?: number;
}

function canAttemptHostInstall(): boolean {
  if (typeof window === 'undefined') return false;
  if (!window.parent) return false;
  return window.parent !== window;
}

function normalizeHostInstallResult(
  message: HostInstallResultMessage,
): InstallResult {
  const status = message.status;
  if (
    status === 'idle' ||
    status === 'queued' ||
    status === 'installing' ||
    status === 'installed' ||
    status === 'error'
  ) {
    return {
      status,
      message: message.message,
      installId: message.installId,
      progress: message.progress,
    };
  }

  return {
    status: 'error',
    message: message.message || 'Graphyn host returned an invalid install response.',
  };
}

async function installViaGraphynHost(req: InstallRequest): Promise<InstallResult | null> {
  if (!canAttemptHostInstall()) return null;

  return new Promise<InstallResult | null>((resolve) => {
    const requestId = `tbh-install-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const timeoutId = window.setTimeout(() => {
      window.removeEventListener('message', handleResult);
      resolve(null);
    }, HOST_INSTALL_TIMEOUT_MS);

    const handleResult = (event: MessageEvent) => {
      if (event.source !== window.parent) return;
      const payload = event.data as HostInstallResultMessage | undefined;
      if (!payload || typeof payload !== 'object') return;
      if (payload.type !== TBH_HOST_INSTALL_RESULT_TYPE) return;
      if (payload.requestId !== requestId) return;

      const result = normalizeHostInstallResult(payload);
      if (result.status === 'queued' || result.status === 'installing') {
        void emitTbhNotificationSignal({
          signal: 'install_progress',
          detail: result.message ?? `Install ${result.status}.`,
          metadata: {
            owner: req.owner,
            slug: req.slug,
            type: req.type,
            status: result.status,
            progress: result.progress ?? null,
          },
        });
        return;
      }

      window.clearTimeout(timeoutId);
      window.removeEventListener('message', handleResult);
      resolve(result);
    };

    window.addEventListener('message', handleResult);
    window.parent.postMessage(
      {
        type: TBH_HOST_INSTALL_REQUEST_TYPE,
        requestId,
        listing: {
          owner: req.owner,
          type: req.type,
          slug: req.slug,
          version: req.version ?? null,
          listingId: req.listingId ?? null,
          sourceUrl: req.sourceUrl ?? null,
          artifactPath: req.artifactPath ?? null,
        },
      },
      '*',
    );
  });
}

/**
 * Honest install client for tbh.md.
 *
 * Priority:
 * 1) Graphyn Desktop BrowserPane host bridge (postMessage)
 * 2) External web fallback (truthful error + copy command guidance)
 */
export async function installListing(
  req: InstallRequest,
): Promise<InstallResult> {
  void emitTbhNotificationSignal({
    signal: 'install_attempt',
    detail: 'Install request received in tbh.md web client.',
    metadata: {
      owner: req.owner,
      slug: req.slug,
      type: req.type,
      version: req.version ?? null,
      listingId: req.listingId ?? null,
    },
  });

  const hostResult = await installViaGraphynHost(req);
  if (hostResult) {
    return hostResult;
  }

  return {
    status: 'error',
    message:
      'Install via Graphyn Desktop, or run the copy command in your terminal.',
  };
}
