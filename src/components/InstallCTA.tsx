import { useState } from 'react';
import CommandBar from './CommandBar';
import type { Listing } from '../core/types';
import { detectGraphynContext } from '../core/graphyn-context';
import { buildInstallUrl } from '../lib/install-url';
import { useToast } from './Toast';

interface InstallCTAProps {
  item: Listing;
  onCopy?: (msg: string) => void;
  onInstall?: (item: Listing) => Promise<boolean>;
  compact?: boolean;
  externalFallback?: boolean;
}

function installCmd(owner: string, slug: string, version: string | null = null): string {
  const base = `bunx @tbh-md/cli install @${owner}/${slug}`;
  return version && version !== 'latest' ? `${base}@${version}` : base;
}

export default function InstallCTA({
  item,
  onCopy,
  onInstall,
  compact = false,
  externalFallback = true,
}: InstallCTAProps) {
  const ctx = detectGraphynContext();
  const toast = useToast();
  const command = installCmd(item.owner, item.slug);
  const [installing, setInstalling] = useState(false);
  const [installed, setInstalled] = useState(false);

  const isDesktop = ctx.isGraphyn;
  const installUrl = buildInstallUrl({
    owner: item.owner,
    slug: item.slug,
    type: item.type,
  });

  const handleInstall = async () => {
    if (installing || installed) return;
    setInstalling(true);
    try {
      if (onInstall) {
        const didInstall = await onInstall(item);
        if (didInstall) {
          setInstalled(true);
        }
      }
    } catch {
      toast.error('Install failed. Please try again.');
    } finally {
      setInstalling(false);
    }
  };

  const handleCopyDeepLink = async () => {
    try {
      await navigator.clipboard.writeText(installUrl);
      onCopy?.(`Copied: ${installUrl}`);
    } catch {
      toast.error('Failed to copy link.');
    }
  };

  /* ─── Compact variant (listing cards) ─── */
  if (compact) {
    if (isDesktop) {
      return (
        <button
          onClick={handleInstall}
          disabled={installing || installed}
          style={{
            border: installed ? '1px solid var(--tb-ok)' : '1px solid var(--tb-bdr)',
            borderRadius: 6,
            padding: '5px 10px',
            fontSize: 11,
            cursor: installing || installed ? 'default' : 'pointer',
            background: installed ? 'rgba(40,200,64,0.1)' : 'transparent',
            color: installed ? 'var(--tb-ok)' : 'var(--tb-t3)',
            whiteSpace: 'nowrap',
          }}
        >
          {installing ? 'Installing\u2026' : installed ? 'Installed' : 'Install'}
        </button>
      );
    }

    if (!externalFallback) {
      return null;
    }

    return (
      <div style={{ display: 'inline-flex', gap: 4, alignItems: 'center' }}>
        <button
          onClick={async () => {
            try {
              await navigator.clipboard.writeText(command);
              onCopy?.(`Copied: ${command}`);
            } catch {
              toast.error('Failed to copy command.');
            }
          }}
          style={{
            border: '1px solid var(--tb-bdr)',
            borderRadius: 6,
            padding: '5px 10px',
            fontSize: 11,
            cursor: 'pointer',
            background: 'transparent',
            color: 'var(--tb-t3)',
            whiteSpace: 'nowrap',
          }}
        >
          Copy command
        </button>
        <a
          href={installUrl}
          style={{
            border: '1px solid var(--tb-bdr)',
            borderRadius: 6,
            padding: '5px 10px',
            fontSize: 11,
            cursor: 'pointer',
            background: 'transparent',
            color: 'var(--tb-t2)',
            whiteSpace: 'nowrap',
            textDecoration: 'none',
          }}
        >
          Open in Desktop
        </a>
      </div>
    );
  }

  /* ─── Full variant (detail page) ─── */
  if (isDesktop) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <button
          onClick={handleInstall}
          disabled={installing || installed}
          style={{
            border: installed ? '1px solid var(--tb-ok)' : '1px solid var(--tb-bdr)',
            borderRadius: 6,
            padding: '8px 16px',
            fontSize: 13,
            fontWeight: 500,
            cursor: installing || installed ? 'default' : 'pointer',
            background: installed ? 'rgba(40,200,64,0.1)' : 'var(--tb-surface)',
            color: installed ? 'var(--tb-ok)' : 'var(--tb-t1)',
            transition: 'background 0.12s, border-color 0.12s',
          }}
        >
          {installing ? 'Installing\u2026' : installed ? 'Installed' : 'Install'}
        </button>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <CommandBar command={command} onCopy={onCopy} size={13} />
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <a
          href={installUrl}
          style={{
            border: '1px solid var(--tb-bdr)',
            borderRadius: 6,
            padding: '6px 14px',
            fontSize: 12,
            fontWeight: 500,
            cursor: 'pointer',
            background: 'var(--tb-surface)',
            color: 'var(--tb-t1)',
            textDecoration: 'none',
            transition: 'background 0.12s, border-color 0.12s',
          }}
        >
          Open in Desktop
        </a>
        <button
          onClick={handleCopyDeepLink}
          style={{
            border: '1px solid var(--tb-bdr)',
            borderRadius: 6,
            padding: '6px 14px',
            fontSize: 12,
            cursor: 'pointer',
            background: 'transparent',
            color: 'var(--tb-t3)',
            whiteSpace: 'nowrap',
          }}
        >
          Copy deep link
        </button>
      </div>
    </div>
  );
}
