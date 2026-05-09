import { useEffect, useMemo, useRef, useState } from 'react';
import type { CatalogSource, Listing, ListingType, RouteState } from '../../core/types';
import { TYPE_ORDER, fmtInstalls, installCmd, shouldIgnoreCardClick } from '../../core/view-utils';
import CommandBar from '../../components/CommandBar';
import CopyUrlButton from '../../components/CopyUrlButton';
import InstallCTA from '../../components/InstallCTA';
import SnapshotStatus from '../../components/SnapshotStatus';
import CliReferencePanel from '../../components/CliReferencePanel';
import EmptyState from '../../components/EmptyState';
import StaggeredList from '../../components/StaggeredList';
import FilterPills from '../../components/FilterPills';

interface FindPageProps {
  groups: Record<'modes' | 'lenses' | 'skills' | 'mcps', Listing[]>;
  generatedAt: string | null;
  source: CatalogSource;
  navigate: (route: RouteState) => void;
  onInstall: (item: Listing) => Promise<boolean>;
  onCopyCommand: (msg: string) => void;
}

export default function FindPage({
  groups,
  generatedAt,
  source,
  navigate,
  onInstall,
  onCopyCommand,
}: FindPageProps) {
  const [q, setQ] = useState('');
  const [type, setType] = useState<'all' | ListingType>('all');
  const [owner, setOwner] = useState('all');
  const searchTopRef = useRef<HTMLInputElement>(null);
  const searchBottomRef = useRef<HTMLInputElement>(null);

  const [isMobile, setIsMobile] = useState(() => {
    if (typeof window === 'undefined') return false;
    return window.matchMedia('(max-width: 640px)').matches;
  });

  useEffect(() => {
    const media = window.matchMedia('(max-width: 640px)');
    const onChange = (event: MediaQueryListEvent) => setIsMobile(event.matches);
    if (typeof media.addEventListener === 'function') media.addEventListener('change', onChange);
    else media.addListener(onChange);

    return () => {
      if (typeof media.removeEventListener === 'function') media.removeEventListener('change', onChange);
      else media.removeListener(onChange);
    };
  }, []);

  useEffect(() => {
    if (isMobile) searchBottomRef.current?.focus();
    else searchTopRef.current?.focus();
  }, [isMobile]);

  const all = useMemo(() => Object.values(groups).flat(), [groups]);

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

  return (
    <main className="tbh-shell" style={{ paddingTop: 16, paddingBottom: 32 }} data-find-main="true">
      {/* Filter pills row */}
      <div className="tbh-search-row">
        <FilterPills
          all={all}
          selectedType={type}
          selectedOwner={owner}
          onTypeChange={setType}
          onOwnerChange={setOwner}
        />
      </div>

      {/* Top search (desktop/tablet) */}
      <div
        className="tbh-search-wrap tbh-search-wrap-top"
        style={{
          minWidth: 200,
          alignItems: 'center',
          gap: 8,
          border: '1px solid var(--tb-bdr)',
          borderRadius: 6,
          padding: '7px 10px',
          background: 'var(--tb-surface)',
          marginBottom: 12,
        }}
      >
        <span style={{ color: 'var(--tb-t3)', fontSize: 12 }}>$</span>
        <span
          style={{
            color: 'var(--tb-t3)',
            fontSize: 12,
            fontFamily: 'JetBrains Mono, monospace',
            whiteSpace: 'nowrap',
          }}
        >
          bunx @tbh-md/cli find
        </span>
        <input
          ref={searchTopRef}
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="[query]"
          style={{
            flex: 1,
            border: 'none',
            outline: 'none',
            background: 'transparent',
            color: 'var(--tb-t1)',
            fontSize: 13,
            fontFamily: 'JetBrains Mono, monospace',
          }}
        />
        {q && (
          <button
            aria-label="Clear search"
            onClick={() => setQ('')}
            style={{
              border: 'none',
              background: 'transparent',
              color: 'var(--tb-t3)',
              fontSize: 12,
              cursor: 'pointer',
              padding: 0,
              lineHeight: 1,
            }}
          >
            ✕
          </button>
        )}
      </div>

      {/* Snapshot status indicator */}
      <SnapshotStatus source={source} generatedAt={generatedAt} />

      {/* CLI reference panel */}
      <CliReferencePanel onCopy={onCopyCommand} />

      {/* Listings or empty state */}
      {filtered.length === 0 ? (
        <EmptyState
          title={q ? `No results for "${q}"` : 'No listings in catalog.'}
          hint={
            type !== 'all' || owner !== 'all'
              ? 'Try adjusting your filters to see more results.'
              : undefined
          }
          action={
            type !== 'all' || owner !== 'all'
              ? { label: 'Clear filters', onClick: () => { setType('all'); setOwner('all'); setQ(''); } }
              : undefined
          }
        />
      ) : (
        <StaggeredList>
          {filtered.map((item) => {
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
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 8,
                        flexWrap: 'wrap',
                        marginBottom: 3,
                      }}
                    >
                      <button
                        className="tbh-slug-link"
                        onClick={() =>
                          navigate({
                            page: 'detail',
                            owner: item.owner,
                            type: item.type,
                            slug: item.slug,
                          })
                        }
                        style={{
                          border: 'none',
                          padding: 0,
                          background: 'transparent',
                          color: 'var(--tb-t1)',
                          fontSize: 16,
                          fontWeight: 700,
                          cursor: 'pointer',
                          letterSpacing: '-0.01em',
                          lineHeight: 1.2,
                        }}
                      >
                        {item.slug}
                      </button>
                      <span
                        style={{
                          fontSize: 11,
                          color: 'var(--tb-t3)',
                          border: '1px solid var(--tb-bdr)',
                          borderRadius: 3,
                          padding: '1px 5px',
                        }}
                      >
                        {item.type}
                      </span>
                      <span
                        style={{
                          fontSize: 11,
                          color: 'var(--tb-t3)',
                          border: '1px solid var(--tb-bdr)',
                          borderRadius: 3,
                          padding: '1px 5px',
                        }}
                      >
                        v{item.version}
                      </span>
                    </div>
                    <div
                      style={{
                        fontSize: 13,
                        color: 'var(--tb-t2)',
                        marginBottom: 6,
                        lineHeight: 1.5,
                      }}
                    >
                      {item.description}
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--tb-t3)', marginBottom: 8 }}>
                      <button
                        onClick={() => navigate({ page: 'owner', owner: item.owner })}
                        style={{
                          border: 'none',
                          padding: 0,
                          background: 'transparent',
                          color: 'var(--tb-t3)',
                          fontSize: 11,
                          cursor: 'pointer',
                        }}
                      >
                        @{item.owner}
                      </button>
                      {' · '}
                      {fmtInstalls(item.installs)} installs
                      {item.weeklyInstalls && (
                        <span style={{ marginLeft: 6, color: 'var(--tb-t3)' }}>
                          ({fmtInstalls(item.weeklyInstalls)}/wk)
                        </span>
                      )}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                      <CommandBar command={command} onCopy={onCopyCommand} size={13} />
                      <InstallCTA
                        item={item}
                        onCopy={onCopyCommand}
                        onInstall={onInstall}
                        compact
                        externalFallback={false}
                      />
                      <CopyUrlButton item={item} onCopy={onCopyCommand} />
                    </div>
                  </div>
                </div>
              </article>
            );
          })}
        </StaggeredList>
      )}

      {/* Bottom sticky search (mobile) */}
      <div className="tbh-search-dock" aria-label="Mobile search dock">
        <div
          className="tbh-search-wrap tbh-search-wrap-bottom"
          style={{
            minWidth: 200,
            alignItems: 'center',
            gap: 8,
            border: '1px solid var(--tb-bdr)',
            borderRadius: 8,
            padding: '9px 10px',
            background: 'var(--tb-surface)',
          }}
        >
          <span style={{ color: 'var(--tb-t3)', fontSize: 12 }}>$</span>
          <span
            style={{
              color: 'var(--tb-t3)',
              fontSize: 12,
              fontFamily: 'JetBrains Mono, monospace',
              whiteSpace: 'nowrap',
            }}
          >
            bunx @tbh-md/cli find
          </span>
          <input
            ref={searchBottomRef}
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="[query]"
            style={{
              flex: 1,
              border: 'none',
              outline: 'none',
              background: 'transparent',
              color: 'var(--tb-t1)',
              fontSize: 13,
              fontFamily: 'JetBrains Mono, monospace',
            }}
          />
          {q && (
            <button
              aria-label="Clear search"
              onClick={() => setQ('')}
              style={{
                border: 'none',
                background: 'transparent',
                color: 'var(--tb-t3)',
                fontSize: 12,
                cursor: 'pointer',
                padding: 0,
                lineHeight: 1,
              }}
            >
              ✕
            </button>
          )}
        </div>
      </div>
    </main>
  );
}
