import { useEffect, useMemo, useRef, useState } from 'react';
import type { CatalogSource, Listing, ListingType, RouteState } from '../../core/types';
import { TYPE_ORDER, fmtInstalls, installCmd, shouldIgnoreCardClick } from '../../core/view-utils';
import CommandBar from '../../components/CommandBar';

interface FindPageProps {
  groups: Record<'modes' | 'lenses' | 'skills' | 'mcps', Listing[]>;
  generatedAt: string | null;
  source: CatalogSource;
  navigate: (route: RouteState) => void;
  onInstall: (item: Listing) => void;
  onCopyCommand: (msg: string) => void;
}

export default function FindPage({ groups, generatedAt, source, navigate, onInstall, onCopyCommand }: FindPageProps) {
  const [q, setQ] = useState('');
  const [type, setType] = useState<'all' | ListingType>('all');
  const [owner, setOwner] = useState('all');
  const [showCli, setShowCli] = useState(false);
  const searchRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    searchRef.current?.focus();
  }, []);

  const all = useMemo(() => Object.values(groups).flat(), [groups]);

  const owners = useMemo(() => {
    const set = new Set(all.map((x) => x.owner));
    return ['all', ...Array.from(set).sort()];
  }, [all]);

  const filtered = useMemo(() => {
    const query = q.trim().toLowerCase();
    return all.filter((item) => {
      if (type !== 'all' && item.type !== type) return false;
      if (owner !== 'all' && item.owner !== owner) return false;
      if (!query) return true;
      return (
        item.name.toLowerCase().includes(query) ||
        item.owner.toLowerCase().includes(query) ||
        item.slug.toLowerCase().includes(query) ||
        item.description.toLowerCase().includes(query)
      );
    });
  }, [all, q, type, owner]);

  const sourceDot = source === 'api' || source === 'network'
    ? 'var(--tb-ok)'
    : source === 'cache' || source === 'static-fallback'
      ? 'var(--tb-ok)'
      : source === 'unavailable'
        ? 'var(--tb-err)'
        : 'var(--tb-t3)';

  const sourceLabel = source === 'api' || source === 'network'
    ? 'Live'
    : source === 'cache' || source === 'static-fallback'
      ? 'Curated'
      : source === 'unavailable'
        ? 'Unavailable'
        : 'Loading\u2026';

  const cliGroups = [
    { label: 'Discovery', cmds: ['npx tbh find [query]', 'npx tbh view @owner/slug'] },
    { label: 'Install', cmds: ['npx tbh install @owner/slug', 'npx tbh install @owner/slug@1.2.0', 'npx tbh list', 'npx tbh remove @owner/slug'] },
    { label: 'Account', cmds: ['npx tbh login', 'npx tbh whoami'] },
  ];

  return (
    <main className="tbh-shell" style={{ paddingTop: 16, paddingBottom: 32 }}>
      <div className="tbh-search-row">
        <div className="tbh-search-wrap" style={{ flex: 1, minWidth: 200, display: 'flex', alignItems: 'center', gap: 8, border: '1px solid var(--tb-bdr)', borderRadius: 6, padding: '7px 10px', background: 'var(--tb-surface)' }}>
          <span style={{ color: 'var(--tb-t3)', fontSize: 12 }}>$</span>
          <span style={{ color: 'var(--tb-t3)', fontSize: 12, fontFamily: 'JetBrains Mono, monospace', whiteSpace: 'nowrap' }}>npx tbh find</span>
          <input
            ref={searchRef}
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="[query]"
            style={{ flex: 1, border: 'none', outline: 'none', background: 'transparent', color: 'var(--tb-t1)', fontSize: 13, fontFamily: 'JetBrains Mono, monospace' }}
          />
          {q && (
            <button onClick={() => setQ('')} style={{ border: 'none', background: 'transparent', color: 'var(--tb-t3)', fontSize: 12, cursor: 'pointer', padding: 0, lineHeight: 1 }}>
              ✕
            </button>
          )}
        </div>

        <button
          onClick={() => {
            const opts: Array<'all' | ListingType> = ['all', ...TYPE_ORDER];
            setType((prev) => opts[(opts.indexOf(prev) + 1) % opts.length]!);
          }}
          style={{ border: '1px solid var(--tb-bdr)', background: type !== 'all' ? 'var(--tb-surface)' : 'transparent', color: type !== 'all' ? 'var(--tb-t1)' : 'var(--tb-t2)', borderRadius: 6, padding: '7px 10px', fontSize: 12, cursor: 'pointer' }}
        >
          {type === 'all' ? 'All types' : type}
        </button>

        <button
          onClick={() => {
            setOwner((prev) => {
              const idx = owners.indexOf(prev);
              return owners[(idx + 1) % owners.length]!;
            });
          }}
          style={{ border: '1px solid var(--tb-bdr)', background: owner !== 'all' ? 'var(--tb-surface)' : 'transparent', color: owner !== 'all' ? 'var(--tb-t1)' : 'var(--tb-t2)', borderRadius: 6, padding: '7px 10px', fontSize: 12, cursor: 'pointer' }}
        >
          {owner === 'all' ? 'All owners' : `@${owner}`}
        </button>

        <button
          onClick={() => setShowCli((v) => !v)}
          style={{ border: '1px solid var(--tb-bdr)', background: showCli ? 'var(--tb-surface)' : 'transparent', color: 'var(--tb-t3)', borderRadius: 6, padding: '7px 10px', fontSize: 12, cursor: 'pointer' }}
        >
          CLI
        </button>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 12 }}>
        <div style={{ width: 5, height: 5, borderRadius: '50%', background: sourceDot }} />
        <span style={{ fontSize: 11, color: 'var(--tb-t3)' }}>
          {sourceLabel} catalog
        </span>
        {generatedAt && <span style={{ fontSize: 11, color: 'var(--tb-t3)', marginLeft: 4 }}>{new Date(generatedAt).toLocaleDateString()}</span>}
      </div>

      {showCli && (
        <div style={{ border: '1px solid var(--tb-bdr)', borderRadius: 8, background: 'var(--tb-surface)', padding: 12, marginBottom: 12 }}>
          <div style={{ fontSize: 12, color: 'var(--tb-t3)', marginBottom: 10 }}>CLI reference — <code style={{ fontFamily: 'JetBrains Mono, monospace' }}>npx tbh &lt;command&gt;</code></div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 12 }}>
            {cliGroups.map((group) => (
              <div key={group.label}>
                <div style={{ fontSize: 11, color: 'var(--tb-t3)', letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 6 }}>{group.label}</div>
                {group.cmds.map((cmd) => (
                  <div key={cmd} className="tbh-cli-row" style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4, padding: '2px 4px' }}>
                    <code style={{ fontSize: 12, color: 'var(--tb-t2)', fontFamily: 'JetBrains Mono, monospace', flex: 1 }}>{cmd}</code>
                    <button
                      onClick={async () => {
                        await navigator.clipboard.writeText(cmd);
                      }}
                      style={{ border: 'none', background: 'transparent', color: 'var(--tb-t3)', fontSize: 11, cursor: 'pointer', padding: '2px 4px' }}
                    >
                      copy
                    </button>
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
      )}

      {filtered.length === 0 ? (
        <div style={{ padding: '32px 0', textAlign: 'center', color: 'var(--tb-t3)', fontSize: 13 }}>
          {q ? `No results for "${q}"` : 'No listings in catalog.'}
        </div>
      ) : (
        filtered.map((item) => {
          const command = installCmd(item.owner, item.slug);
          return (
            <article
              key={item.id}
              className="tbh-card"
              onClick={(e) => {
                if (shouldIgnoreCardClick(e.target)) return;
                navigate({ page: 'detail', owner: item.owner, type: item.type, slug: item.slug });
              }}
              style={{ padding: 12, marginBottom: 8, cursor: 'pointer' }}
            >
              <div className="tbh-card-inner">
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 3 }}>
                    <button
                      className="tbh-slug-link"
                      onClick={() => navigate({ page: 'detail', owner: item.owner, type: item.type, slug: item.slug })}
                      style={{ border: 'none', padding: 0, background: 'transparent', color: 'var(--tb-t1)', fontSize: 16, fontWeight: 700, cursor: 'pointer', letterSpacing: '-0.01em', lineHeight: 1.2 }}
                    >
                      {item.slug}
                    </button>
                    <span style={{ fontSize: 11, color: 'var(--tb-t3)', border: '1px solid var(--tb-bdr)', borderRadius: 3, padding: '1px 5px' }}>{item.type}</span>
                    <span style={{ fontSize: 11, color: 'var(--tb-t3)', border: '1px solid var(--tb-bdr)', borderRadius: 3, padding: '1px 5px' }}>v{item.version}</span>
                  </div>
                  <div style={{ fontSize: 13, color: 'var(--tb-t2)', marginBottom: 6, lineHeight: 1.5 }}>{item.description}</div>
                  <div style={{ fontSize: 11, color: 'var(--tb-t3)', marginBottom: 8 }}>
                    <button onClick={() => navigate({ page: 'owner', owner: item.owner })} style={{ border: 'none', padding: 0, background: 'transparent', color: 'var(--tb-t3)', fontSize: 11, cursor: 'pointer' }}>
                      @{item.owner}
                    </button>
                    {' · '}{fmtInstalls(item.installs)} installs
                    {item.weeklyInstalls && <span style={{ marginLeft: 6, color: 'var(--tb-t3)' }}>({fmtInstalls(item.weeklyInstalls)}/wk)</span>}
                  </div>
                  <CommandBar command={command} onCopy={onCopyCommand} size={13} />
                </div>
              </div>
            </article>
          );
        })
      )}
    </main>
  );
}
