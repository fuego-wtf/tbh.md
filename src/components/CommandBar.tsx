import { useState } from 'react';

interface CommandBarProps {
  command: string;
  onCopy?: (msg: string) => void;
  size?: number;
}

export default function CommandBar({ command, onCopy, size = 14 }: CommandBarProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(command);
      setCopied(true);
      onCopy?.(`Copied: ${command}`);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      onCopy?.('Copy failed');
    }
  };

  return (
    <div style={{ border: '1px solid var(--tb-bdr)', borderRadius: 6, padding: '8px 10px', display: 'flex', alignItems: 'center', gap: 8, background: 'rgba(0,0,0,0.12)', minWidth: 0 }}>
      <span style={{ color: 'var(--tb-t3)', fontSize: 13, fontFamily: 'JetBrains Mono, monospace', userSelect: 'none', flexShrink: 0 }}>$</span>
      <code className="tbh-command-code" style={{ fontSize: size, color: 'var(--tb-t2)', fontFamily: 'JetBrains Mono, monospace', flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{command}</code>
      <button
        onClick={handleCopy}
        style={{
          border: '1px solid var(--tb-bdr)',
          background: copied ? 'rgba(40,200,64,0.1)' : 'transparent',
          color: copied ? 'var(--tb-ok)' : 'var(--tb-t3)',
          borderRadius: 4,
          padding: '3px 8px',
          fontSize: 11,
          cursor: 'pointer',
          flexShrink: 0,
        }}
      >
        {copied ? 'Copied' : 'Copy'}
      </button>
    </div>
  );
}
