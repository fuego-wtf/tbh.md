import type { InstallRequest, InstallResult } from './types';
import { emitTbhNotificationSignal } from './notification-emitter';

/**
 * Honest install client for tbh.md.
 *
 * Direct API-based installs are not available in this wave (no Backyard /tbh/install endpoint yet).
 * Desktop BrowserPane bridge installs are not available (no postMessage handshake yet).
 *
 * All install requests return an error with a truthful message directing the user
 * to use the copy command or install from Graphyn Desktop.
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
    },
  });

  return {
    status: 'error',
    message: 'Install from Graphyn Desktop or run the copy command in your terminal.',
  };
}
