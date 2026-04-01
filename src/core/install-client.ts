import type { InstallRequest, InstallResult } from './types';

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
  _req: InstallRequest,
): Promise<InstallResult> {
  return {
    status: 'error',
    message: 'Install from Graphyn Desktop or run the copy command in your terminal.',
  };
}
