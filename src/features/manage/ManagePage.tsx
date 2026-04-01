import { useMemo, useState } from 'react';
import type { Listing, RouteState } from '../../core/types';
import Breadcrumb from '../../components/Breadcrumb';
import CommandBar from '../../components/CommandBar';
import { fmtInstalls, shouldIgnoreCardClick } from '../../core/view-utils';

interface ManagePageProps {
  groups: Record<'modes' | 'lenses' | 'skills' | 'mcps', Listing[]>;
  navigate: (route: RouteState) => void;
  onCopyCommand: (msg: string) => void;
  isGraphyn: boolean;
  graphynHandle: string | null;
}

export default function ManagePage({ groups, navigate, onCopyCommand, isGraphyn, graphynHandle }: ManagePageProps) {
  const [unpublishConfirm, setUnpublishConfirm] = useState<string | null>(null);
  const [publishedItems, setPublishedItems] = useState<Record<string, { version?: string; unpublished?: boolean }>>({});
  const [toast, setToast] = useState('');

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(''), 2400);
  };

  if (!isGraphyn || !graphynHandle) {
    return (
      <main className="tbh-shell" style={{ paddingTop: 40, paddingBottom: 32, textAlign: 'center' }}>
        <div style={{ fontSize: 14, color: 'var(--tb-t2)', marginBottom: 16 }}>Sign in to manage your listings.</div>
        <CommandBar command="npx tbh login" onCopy={onCopyCommand} size={13} />
        <div style={{ marginTop: 12, fontSize: 12, color: 'var(--tb-t3)' }}>
          Or open tbh.md from inside Graphyn desktop for auto sign-in.
        </div>
      </main>
    );
  }

  const mine = useMemo(() => Object.values(groups).flat().filter((x) => x.owner === graphynHandle), [groups, graphynHandle]);

  const bumpVersion = (v = '1.0.0') => {
    const [maj, min, patch] = v.split('.').map(Number);
    return `${maj}.${min}.${(patch || 0) + 1}`;
  };

  return (
    <main className="tbh-shell" style={{ paddingTop: 16, paddingBottom: 32 }}>
      <Breadcrumb segments={[{ label: 'Find', route: { page: 'find' } }, { label: 'Manage' }]} navigate={navigate} />

      <div style={{ display: 'flex', alignItems: 'baseline', gap: 12, marginBottom: 16 }}>
        <h1 className="tbh-section-h1" style={{ margin: 0, fontSize: 24, fontWeight: 700, letterSpacing: '-0.02em' }}>Manage</h1>
        <span style={{ fontSize: 13, color: 'var(--tb-t3)' }}>@{graphynHandle}</span>
      </div>

      {mine.length === 0 ? (
        <div style={{ padding: '32px 0', textAlign: 'center' }}>
          <div style={{ fontSize: 13, color: 'var(--tb-t3)', marginBottom: 12 }}>No listings yet.</div>
          <CommandBar command="npx tbh publish ./skill.md --type skill" onCopy={onCopyCommand} size={13} />
        </div>
      ) : (
        mine.map((item) => {
          const published = publishedItems[item.id];
          const isUnpublished = published?.unpublished;
          const nextVersion = bumpVersion(published?.version || item.version);

          return (
            <article
              key={item.id}
              className="tbh-card"
              onClick={(e) => {
                if (shouldIgnoreCardClick(e.target)) return;
                navigate({ page: 'detail', owner: item.owner, type: item.type, slug: item.slug });
              }}
              style={{ padding: 14, marginBottom: 10, opacity: isUnpublished ? 0.5 : 1, cursor: 'pointer' }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                <button
                  onClick={() => navigate({ page: 'detail', owner: item.owner, type: item.type, slug: item.slug })}
                  style={{ border: 'none', padding: 0, background: 'transparent', color: 'var(--tb-t1)', fontSize: 16, fontWeight: 700, cursor: 'pointer', letterSpacing: '-0.01em' }}
                >
                  {item.slug}
                </button>
                <span style={{ fontSize: 11, color: 'var(--tb-t3)', border: '1px solid var(--tb-bdr)', borderRadius: 3, padding: '1px 5px' }}>{item.type}</span>
                <span style={{ fontSize: 11, color: 'var(--tb-t3)', border: '1px solid var(--tb-bdr)', borderRadius: 3, padding: '1px 5px', fontFamily: 'JetBrains Mono, monospace' }}>
                  v{published?.version || item.version}
                </span>
                {isUnpublished && (
                  <span style={{ fontSize: 11, color: 'var(--tb-warn)', border: '1px solid var(--tb-bdr)', borderRadius: 3, padding: '1px 5px' }}>Unpublished</span>
                )}
                <span style={{ flex: 1 }} />
                <span style={{ fontSize: 12, color: 'var(--tb-t3)' }}>{fmtInstalls(item.installs)} installs</span>
              </div>

              <div style={{ fontSize: 13, color: 'var(--tb-t2)', marginBottom: 10, lineHeight: 1.5 }}>{item.description}</div>

              {!isUnpublished && (
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  <button
                    onClick={async () => {
                      const url = item.url || `https://tbh.md/@${item.owner}/${item.type}/${item.slug}`;
                      await navigator.clipboard.writeText(url);
                      onCopyCommand(`Copied: ${url}`);
                      showToast('Listing URL copied');
                    }}
                    style={{ border: '1px solid var(--tb-bdr)', background: 'transparent', color: 'var(--tb-t2)', borderRadius: 6, padding: '5px 10px', fontSize: 12, cursor: 'pointer' }}
                  >
                    Copy listing URL
                  </button>

                  <button
                    onClick={() => {
                      setPublishedItems((prev) => ({ ...prev, [item.id]: { version: bumpVersion(item.version) } }));
                      showToast(`${item.slug} v${bumpVersion(item.version)} published`);
                    }}
                    style={{ border: '1px solid var(--tb-bdr)', background: 'transparent', color: 'var(--tb-t2)', borderRadius: 6, padding: '5px 10px', fontSize: 12, cursor: 'pointer' }}
                  >
                    Publish v{nextVersion}
                  </button>

                  {unpublishConfirm === item.id ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span style={{ fontSize: 12, color: 'var(--tb-t3)' }}>Unpublish from tbh.md?</span>
                      <button onClick={() => setUnpublishConfirm(null)} style={{ border: 'none', background: 'transparent', color: 'var(--tb-t3)', fontSize: 12, cursor: 'pointer', padding: '4px 6px' }}>Cancel</button>
                      <button
                        onClick={() => {
                          setPublishedItems((prev) => ({ ...prev, [item.id]: { unpublished: true } }));
                          setUnpublishConfirm(null);
                          showToast('Listing unpublished.');
                        }}
                        style={{ border: '1px solid var(--tb-bdr)', background: 'rgba(255,95,87,0.08)', color: 'var(--tb-err)', borderRadius: 6, padding: '4px 10px', fontSize: 12, cursor: 'pointer' }}
                      >
                        Unpublish
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setUnpublishConfirm(item.id)}
                      style={{ border: '1px solid var(--tb-bdr)', background: 'transparent', color: 'var(--tb-t3)', borderRadius: 6, padding: '5px 10px', fontSize: 12, cursor: 'pointer' }}
                    >
                      Unpublish
                    </button>
                  )}
                </div>
              )}
            </article>
          );
        })
      )}

      {toast && (
        <div style={{ position: 'fixed', left: '50%', bottom: 20, transform: 'translateX(-50%)', border: '1px solid var(--tb-bdr)', borderRadius: 6, background: 'var(--tb-surface)', color: 'var(--tb-t2)', fontSize: 12, padding: '7px 12px', zIndex: 10 }}>
          {toast}
        </div>
      )}
    </main>
  );
}
