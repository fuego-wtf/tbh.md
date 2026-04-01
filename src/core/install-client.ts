import type { GraphynContext, InstallRequest, InstallResult } from './types';

const INSTALL_API_BASE = import.meta.env.VITE_TBH_INSTALL_API_BASE as string | undefined;
const INSTALL_PATH = (import.meta.env.VITE_TBH_INSTALL_PATH as string | undefined) ?? '/api/tbh/install';

function joinUrl(base: string, path: string): string {
  return `${base.replace(/\/$/, '')}/${path.replace(/^\//, '')}`;
}

export async function installListing(
  req: InstallRequest,
  ctx: GraphynContext
): Promise<InstallResult> {
  if (!ctx.isGraphyn) {
    return {
      status: 'error',
      message: 'External context: use copy command or deep-link fallback',
    };
  }

  if (!INSTALL_API_BASE) {
    return {
      status: 'error',
      message: 'Install API base not configured',
    };
  }

  const url = joinUrl(INSTALL_API_BASE, INSTALL_PATH);
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(req),
  });

  if (!res.ok) {
    const text = await res.text();
    return { status: 'error', message: text || `Install failed (${res.status})` };
  }

  const body = (await res.json()) as Partial<InstallResult>;
  return {
    status: body.status ?? 'queued',
    message: body.message,
    installId: body.installId,
    progress: body.progress,
  };
}
