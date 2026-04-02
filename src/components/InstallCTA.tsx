import CommandBar from './CommandBar';
import type { Listing } from '../core/types';

interface InstallCTAProps {
  item: Listing;
  onCopy?: (msg: string) => void;
  compact?: boolean;
}

function installCmd(owner: string, slug: string, version: string | null = null): string {
  const base = `npx @graphyn/tbh install @${owner}/${slug}`;
  return version && version !== 'latest' ? `${base}@${version}` : base;
}

export default function InstallCTA({ item, onCopy, compact = false }: InstallCTAProps) {
  const command = installCmd(item.owner, item.slug);

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
        <span style={{ fontSize: 12, color: 'var(--tb-t3)' }}>Desktop install not available on web — use the copy command above</span>
      </div>
    </div>
  );
}
