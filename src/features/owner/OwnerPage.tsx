import { useMemo } from 'react';
import type { Listing, RouteState } from '../../core/types';
import { shouldIgnoreCardClick, installCmd } from '../../core/view-utils';
import Breadcrumb from '../../components/Breadcrumb';
import CommandBar from '../../components/CommandBar';
import CopyUrlButton from '../../components/CopyUrlButton';
import EmptyState from '../../components/EmptyState';
import InstallCTA from '../../components/InstallCTA';
import StaggeredList from '../../components/StaggeredList';

interface OwnerPageProps {
  owner: string;
  groups: Record<'modes' | 'lenses' | 'skills' | 'mcps' | 'states', Listing[]>;
  navigate: (route: RouteState) => void;
  onInstall: (item: Listing) => Promise<boolean>;
  onCopyCommand: (msg: string) => void;
}

export default function OwnerPage({ owner, groups, navigate, onInstall, onCopyCommand }: OwnerPageProps) {
  const listings = useMemo(
    () => Object.values(groups).flat().filter((x) => x.owner === owner),
    [groups, owner],
  );

  return (
    <main className="tbh-shell" style={{ paddingTop: 16, paddingBottom: 32 }}>
      <Breadcrumb
        segments={[
          { label: 'Find', route: { page: 'find' } },
          { label: `@${owner}` },
        ]}
        navigate={navigate}
      />

      {/* Owner header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
        <div
          style={{
            width: 40,
            height: 40,
            borderRadius: '50%',
            border: '1px solid var(--tb-bdr)',
            background: 'var(--tb-surface)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 16,
            fontWeight: 700,
            color: 'var(--tb-t2)',
            flexShrink: 0,
          }}
        >
          {owner.charAt(0).toUpperCase()}
        </div>
        <div>
          <h1
            style={{
              margin: 0,
              fontSize: 24,
              fontWeight: 700,
              letterSpacing: '-0.02em',
              lineHeight: 1.2,
            }}
          >
            @{owner}
          </h1>
          <div style={{ fontSize: 13, color: 'var(--tb-t3)' }}>
            {listings.length} listing{listings.length !== 1 ? 's' : ''}
          </div>
        </div>
      </div>

      {/* Listings or empty state */}
      {listings.length === 0 ? (
        <EmptyState
          title={`@${owner} hasn't published any listings yet.`}
          hint="Check back later or browse the catalog to find other publishers."
          action={{ label: 'Browse catalog', onClick: () => navigate({ page: 'find' }) }}
        />
      ) : (
        <StaggeredList>
          {listings.map((item) => (
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
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 3 }}>
                    <button
                      className="tbh-slug-link"
                      onClick={() =>
                        navigate({ page: 'detail', owner: item.owner, type: item.type, slug: item.slug })
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
                  </div>
                  <div style={{ fontSize: 13, color: 'var(--tb-t2)', lineHeight: 1.5, marginBottom: 8 }}>
                    {item.description}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                    <CommandBar command={installCmd(item.owner, item.slug)} onCopy={onCopyCommand} size={13} />
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
          ))}
        </StaggeredList>
      )}
    </main>
  );
}
