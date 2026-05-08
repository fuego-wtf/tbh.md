import { useEffect, useMemo, useState } from 'react';
import type { Listing, RouteState } from '../../core/types';
import { installCmd, statusColor } from '../../core/view-utils';
import Breadcrumb from '../../components/Breadcrumb';
import InstallCTA from '../../components/InstallCTA';
import CopyUrlButton from '../../components/CopyUrlButton';
import EmptyState from '../../components/EmptyState';

interface DetailPageProps {
  owner: string;
  type: 'mode' | 'lens' | 'skill' | 'mcp';
  slug: string;
  groups: Record<'modes' | 'lenses' | 'skills' | 'mcps', Listing[]>;
  onCopyCommand: (msg: string) => void;
  onInstall?: (item: Listing) => Promise<boolean>;
  navigate: (route: RouteState) => void;
}

const TYPE_TO_GROUP = { mode: 'modes', lens: 'lenses', skill: 'skills', mcp: 'mcps' } as const;

export default function DetailPage({
  owner,
  type,
  slug,
  groups,
  onCopyCommand,
  onInstall,
  navigate,
}: DetailPageProps) {
  const listing = useMemo(() => {
    const bucket = groups[TYPE_TO_GROUP[type]] || [];
    return bucket.find((x) => x.owner === owner && x.slug === slug) || null;
  }, [groups, owner, type, slug]);

  const [selectedVersion, setSelectedVersion] = useState(listing?.version || '');
  const [artifact, setArtifact] = useState<string | null>(null);

  useEffect(() => {
    setSelectedVersion(listing?.version || '');
  }, [listing?.id]);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      if (!listing?.artifactPath) {
        setArtifact('No artifact available.');
        return;
      }
      setArtifact(null);
      try {
        const res = await fetch(listing.artifactPath, { cache: 'no-store' });
        if (!res.ok) throw new Error('unavailable');
        const text = await res.text();
        if (!cancelled) setArtifact(text);
      } catch {
        if (!cancelled) setArtifact('Artifact unavailable.');
      }
    };

    load();
    return () => {
      cancelled = true;
    };
  }, [listing?.artifactPath]);

  if (!listing) {
    return (
      <main className="tbh-shell" style={{ paddingTop: 16 }}>
        <Breadcrumb
          segments={[
            { label: 'Find', route: { page: 'find' } },
            { label: 'Not found' },
          ]}
          navigate={navigate}
        />
        <EmptyState
          title="Listing not found."
          hint="It may have been removed or the URL is incorrect."
          action={{ label: 'Browse catalog', onClick: () => navigate({ page: 'find' }) }}
        />
      </main>
    );
  }

  const command = installCmd(
    listing.owner,
    listing.slug,
    selectedVersion !== listing.version ? selectedVersion : null,
  );

  return (
    <main className="tbh-shell" style={{ paddingTop: 16, paddingBottom: 32 }}>
      <Breadcrumb
        navigate={navigate}
        segments={[
          { label: 'Find', route: { page: 'find' } },
          { label: `@${listing.owner}`, route: { page: 'owner', owner: listing.owner } },
          { label: listing.type },
          { label: listing.slug },
        ]}
      />

      <div className="tbh-detail-grid">
        <section className="tbh-detail-main" style={{ minWidth: 0 }}>
          <h1
            className="tbh-detail-h1"
            style={{
              margin: '0 0 4px',
              fontSize: 32,
              fontWeight: 700,
              letterSpacing: '-0.03em',
              lineHeight: 1.05,
            }}
          >
            {listing.slug}
          </h1>
          <div
            style={{ fontSize: 14, color: 'var(--tb-t2)', marginBottom: 14, lineHeight: 1.6 }}
          >
            {listing.description}
          </div>

          {/* Version selector chips with latest badge */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
            <span style={{ fontSize: 12, color: 'var(--tb-t3)' }}>Version</span>
            <div className="tbh-version-chips">
              {listing.versions.map((v) => {
                const isLatest = v === listing.version;
                const isSelected = v === selectedVersion;
                return (
                  <button
                    key={v}
                    onClick={() => setSelectedVersion(v)}
                    style={{
                      border: '1px solid var(--tb-bdr)',
                      borderRadius: 4,
                      padding: '3px 8px',
                      fontSize: 11,
                      cursor: 'pointer',
                      fontFamily: 'JetBrains Mono, monospace',
                      background: isSelected ? 'var(--tb-bdr-strong)' : 'transparent',
                      color: isSelected ? 'var(--tb-t1)' : 'var(--tb-t3)',
                      transition: 'background 0.12s, color 0.12s',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 4,
                    }}
                  >
                    {v}
                    {isLatest && (
                      <span
                        style={{
                          fontSize: 9,
                          color: 'var(--tb-ok)',
                          border: '1px solid var(--tb-bdr)',
                          borderRadius: 2,
                          padding: '0 3px',
                          lineHeight: '14px',
                        }}
                      >
                        latest
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Install CTA + Copy URL */}
          <div style={{ marginBottom: 20, display: 'flex', flexDirection: 'column', gap: 8 }}>
            <InstallCTA item={listing} onCopy={onCopyCommand} onInstall={onInstall} />
            <CopyUrlButton item={listing} onCopy={onCopyCommand} />
          </div>

          <article
            style={{
              border: '1px solid var(--tb-bdr)',
              borderRadius: 8,
              background: 'var(--tb-surface)',
            }}
          >
            <div
              style={{
                padding: '8px 12px',
                borderBottom: '1px solid var(--tb-bdr)',
                display: 'flex',
                alignItems: 'center',
                gap: 6,
              }}
            >
              <span
                style={{
                  fontSize: 11,
                  color: 'var(--tb-t3)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.06em',
                }}
              >
                {listing.type.toUpperCase()}.md
              </span>
            </div>
            <div style={{ padding: '14px 16px' }}>
              {artifact === null ? (
                <span style={{ fontSize: 13, color: 'var(--tb-t3)' }}>Loading\u2026</span>
              ) : (
                <pre
                  style={{
                    margin: 0,
                    whiteSpace: 'pre-wrap',
                    fontFamily: 'inherit',
                    fontSize: 14,
                    lineHeight: 1.75,
                    color: 'var(--tb-t2)',
                  }}
                >
                  {artifact}
                </pre>
              )}
            </div>
          </article>
        </section>

        <aside
          className="tbh-detail-sidebar"
          style={{
            border: '1px solid var(--tb-bdr)',
            borderRadius: 8,
            padding: 14,
            background: 'var(--tb-surface)',
          }}
        >
          <Stat
            label="WEEKLY INSTALLS"
            value={listing.weeklyInstalls ? `${listing.weeklyInstalls}` : '\u2014'}
            big
          />
          <Stat label="REPOSITORY" value={listing.repository || '\u2014'} mono />
          <Stat
            label="GITHUB STARS"
            value={listing.githubStars ? `\u2605 ${listing.githubStars}` : '\u2014'}
          />
          <Stat
            label="FIRST SEEN"
            value={listing.firstSeen ? new Date(listing.firstSeen).toLocaleDateString() : '\u2014'}
          />

          {listing.audits?.length > 0 && (
            <div
              style={{
                marginTop: 16,
                paddingTop: 16,
                borderTop: '1px solid var(--tb-bdr)',
              }}
            >
              <div
                style={{
                  fontSize: 11,
                  color: 'var(--tb-t3)',
                  letterSpacing: '0.08em',
                  textTransform: 'uppercase',
                  marginBottom: 10,
                }}
              >
                Security Audits
              </div>
              {listing.audits.map((a) => (
                <div
                  key={a.name}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginBottom: 8,
                  }}
                >
                  <span style={{ fontSize: 13, color: 'var(--tb-t2)' }}>{a.name}</span>
                  <span
                    style={{
                      fontSize: 10,
                      border: '1px solid var(--tb-bdr)',
                      borderRadius: 3,
                      padding: '2px 6px',
                      color: statusColor(a.status),
                      letterSpacing: '0.04em',
                    }}
                  >
                    {a.status}
                  </span>
                </div>
              ))}
            </div>
          )}

          <div style={{ marginTop: 12 }}>
            <code
              style={{
                color: 'var(--tb-t3)',
                fontFamily: 'JetBrains Mono, monospace',
                fontSize: 12,
              }}
            >
              {command}
            </code>
          </div>
        </aside>
      </div>
    </main>
  );
}

function Stat({
  label,
  value,
  mono = false,
  big = false,
}: {
  label: string;
  value: string;
  mono?: boolean;
  big?: boolean;
}) {
  return (
    <div style={{ marginBottom: 14 }}>
      <div
        style={{
          fontSize: 11,
          color: 'var(--tb-t3)',
          letterSpacing: '0.08em',
          textTransform: 'uppercase',
          marginBottom: 3,
        }}
      >
        {label}
      </div>
      <div
        style={{
          fontSize: big ? 22 : 14,
          fontWeight: big ? 700 : 400,
          color: 'var(--tb-t1)',
          fontFamily: mono ? 'JetBrains Mono, monospace' : 'inherit',
        }}
      >
        {value}
      </div>
    </div>
  );
}
