import CommandBar from './CommandBar';
import type { InstallResult, Listing } from '../core/types';

interface InstallCTAProps {
  item: Listing;
  installState?: InstallResult;
  onInstall: (item: Listing) => void;
  onCopy?: (msg: string) => void;
  compact?: boolean;
  isGraphyn: boolean;
}

function installCmd(owner: string, slug: string, version: string | null = null): string {
  const base = `npx tbh install @${owner}/${slug}`;
  return version && version !== 'latest' ? `${base}@${version}` : base;
}

export default function InstallCTA({ item, installState, onInstall, onCopy, compact = false, isGraphyn }: InstallCTAProps) {
  const installing = installState?.status === 'installing' || installState?.status === 'queued';
  const installed = installState?.status === 'installed';
  const failed = installState?.status === 'error';
  const command = installCmd(item.owner, item.slug);

  if (isGraphyn) {
    return (
      <button
        onClick={() => !installing && !installed && onInstall(item)}
        disabled={installing || installed}
        style={{
          border: '1px solid var(--tb-bdr)',
          borderRadius: 6,
          padding: compact ? '5px 10px' : '7px 14px',
          fontSize: compact ? 11 : 13,
          cursor: installing || installed ? 'default' : 'pointer',
          background: installed ? 'rgba(40,200,64,0.12)' : failed ? 'rgba(255,95,87,0.08)' : 'transparent',
          color: installed ? 'var(--tb-ok)' : failed ? 'var(--tb-err)' : 'var(--tb-t2)',
          whiteSpace: 'nowrap',
        }}
      >
        {installing ? `Installing ${installState?.progress ?? 0}%`
          : installed ? 'Installed'
            : failed ? 'Retry'
              : 'Install'}
      </button>
    );
  }

  if (compact) {
    return (
      <button
        onClick={async () => {
          await navigator.clipboard.writeText(command);
          onCopy?.(`Copied: ${command}`);
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
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <CommandBar command={command} onCopy={onCopy} size={13} />
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <a
          href={`graphyn://install/${item.owner}/${item.slug}`}
          style={{ fontSize: 12, color: 'var(--tb-t2)', textDecoration: 'none', border: '1px solid var(--tb-bdr)', borderRadius: 6, padding: '5px 10px', display: 'inline-block' }}
        >
          Open in Graphyn
        </a>
        <span style={{ fontSize: 11, color: 'var(--tb-t3)' }}>or run the command above in your terminal</span>
      </div>
    </div>
  );
}
