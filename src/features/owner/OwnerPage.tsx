import type { Listing, RouteState } from '../../core/types';
import { shouldIgnoreCardClick, installCmd } from '../../core/view-utils';
import Breadcrumb from '../../components/Breadcrumb';
import CommandBar from '../../components/CommandBar';

interface OwnerPageProps {
  owner: string;
  groups: Record<'modes' | 'lenses' | 'skills' | 'mcps', Listing[]>;
  navigate: (route: RouteState) => void;
  onInstall: (item: Listing) => void;
  onCopyCommand: (msg: string) => void;
}

export default function OwnerPage({ owner, groups, navigate, onInstall, onCopyCommand }: OwnerPageProps) {
  const listings = Object.values(groups).flat().filter((x) => x.owner === owner);

  return (
    <main className="tbh-shell" style={{ paddingTop: 16, paddingBottom: 32 }}>
      <Breadcrumb segments={[{ label: 'Find', route: { page: 'find' } }, { label: `@${owner}` }]} navigate={navigate} />
      <h1 style={{ margin: '0 0 4px', fontSize: 24, fontWeight: 700, letterSpacing: '-0.02em' }}>@{owner}</h1>
      <div style={{ fontSize: 13, color: 'var(--tb-t3)', marginBottom: 16 }}>{listings.length} listing{listings.length !== 1 ? 's' : ''}</div>

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
                  onClick={() => navigate({ page: 'detail', owner: item.owner, type: item.type, slug: item.slug })}
                  style={{ border: 'none', padding: 0, background: 'transparent', color: 'var(--tb-t1)', fontSize: 16, fontWeight: 700, cursor: 'pointer', letterSpacing: '-0.01em' }}
                >
                  {item.slug}
                </button>
                <span style={{ fontSize: 11, color: 'var(--tb-t3)', border: '1px solid var(--tb-bdr)', borderRadius: 3, padding: '1px 5px' }}>{item.type}</span>
              </div>
              <div style={{ fontSize: 13, color: 'var(--tb-t2)', lineHeight: 1.5, marginBottom: 8 }}>{item.description}</div>
              <CommandBar command={installCmd(item.owner, item.slug)} onCopy={onCopyCommand} size={13} />
            </div>
          </div>
        </article>
      ))}

      {listings.length === 0 && (
        <div style={{ padding: '32px 0', textAlign: 'center', color: 'var(--tb-t3)', fontSize: 13 }}>No listings for @{owner}.</div>
      )}
    </main>
  );
}
