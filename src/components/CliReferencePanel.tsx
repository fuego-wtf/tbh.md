import { useState } from 'react';
import HoverPopover from './HoverPopover';

interface CliReferencePanelProps {
  onCopy: (msg: string) => void;
}

const CLI_GROUPS = [
  {
    label: 'Discovery',
    cmds: [
      'bunx @graphyn/tbh find [query]',
      'bunx @graphyn/tbh view @owner/slug',
    ],
  },
  {
    label: 'Install',
    cmds: [
      'bunx @graphyn/tbh install @owner/slug',
      'bunx @graphyn/tbh install @owner/slug@1.2.0',
      'bunx @graphyn/tbh list',
      'bunx @graphyn/tbh remove @owner/slug',
    ],
  },
  {
    label: 'Account',
    cmds: [
      'bunx @graphyn/tbh login',
      'bunx @graphyn/tbh whoami',
    ],
  },
];

export default function CliReferencePanel({ onCopy }: CliReferencePanelProps) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div>
      {/* T-TBH-W175-002: HoverPopover wraps the CLI toggle button (prototype/tbh.jsx:463-470) */}
      <HoverPopover content="CLI reference" disabled={expanded}>
        <button
          onClick={() => setExpanded((v) => !v)}
          className="tbh-btn"
          style={{
            border: '1px solid var(--tb-bdr)',
            background: expanded ? 'var(--tb-surface)' : 'transparent',
            color: 'var(--tb-t3)',
            borderRadius: 6,
            padding: '7px 10px',
            fontSize: 12,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: 4,
            transition: 'background 0.12s',
          }}
        >
          <span style={{ fontSize: 10 }}>{expanded ? '\u25BC' : '\u25B6'}</span>
          CLI reference
        </button>
      </HoverPopover>

      {expanded && (
        <div
          style={{
            border: '1px solid var(--tb-bdr)',
            borderRadius: 8,
            background: 'var(--tb-surface)',
            padding: 12,
            marginTop: 8,
          }}
        >
          <div style={{ fontSize: 12, color: 'var(--tb-t3)', marginBottom: 10 }}>
            CLI reference &mdash;{' '}
            <code style={{ fontFamily: 'JetBrains Mono, monospace' }}>
              bunx @graphyn/tbh &lt;command&gt;
            </code>
          </div>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
              gap: 12,
            }}
          >
            {CLI_GROUPS.map((group) => (
              <div key={group.label}>
                <div
                  style={{
                    fontSize: 11,
                    color: 'var(--tb-t3)',
                    letterSpacing: '0.06em',
                    textTransform: 'uppercase',
                    marginBottom: 6,
                  }}
                >
                  {group.label}
                </div>
                {group.cmds.map((cmd) => (
                  <CliRow key={cmd} command={cmd} onCopy={onCopy} />
                ))}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function CliRow({ command, onCopy }: { command: string; onCopy: (msg: string) => void }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(command);
      setCopied(true);
      onCopy(`Copied: ${command}`);
      setTimeout(() => setCopied(false), 1200);
    } catch {
      onCopy('Copy failed');
    }
  };

  return (
    <div
      className="tbh-cli-row"
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 6,
        marginBottom: 4,
        padding: '2px 4px',
      }}
    >
      <code
        style={{
          fontSize: 12,
          color: 'var(--tb-t2)',
          fontFamily: 'JetBrains Mono, monospace',
          flex: 1,
          minWidth: 0,
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
        }}
      >
        {command}
      </code>
      <button
        onClick={handleCopy}
        style={{
          border: 'none',
          background: 'transparent',
          color: copied ? 'var(--tb-ok)' : 'var(--tb-t3)',
          fontSize: 11,
          cursor: 'pointer',
          padding: '2px 4px',
          flexShrink: 0,
        }}
      >
        {copied ? 'copied' : 'copy'}
      </button>
    </div>
  );
}
