import { useEffect, useMemo, useState } from 'react';
import type { AgentExperience, Insight, Listing, RouteState } from '../../core/types';
import { installCmd, statusColor } from '../../core/view-utils';
import Breadcrumb from '../../components/Breadcrumb';
import InstallCTA from '../../components/InstallCTA';
import CopyUrlButton from '../../components/CopyUrlButton';
import EmptyState from '../../components/EmptyState';
import { detectGraphynContext } from '../../core/graphyn-context';
import {
  fetchListingInsights,
  type ListingInsightsResponse,
} from '../../lib/listing-api';

interface DetailPageProps {
  owner: string;
  type: 'mode' | 'lens' | 'skill' | 'mcp' | 'state';
  slug: string;
  groups: Record<'modes' | 'lenses' | 'skills' | 'mcps' | 'states', Listing[]>;
  onCopyCommand: (msg: string) => void;
  onInstall?: (item: Listing) => Promise<boolean>;
  navigate: (route: RouteState) => void;
}

const TYPE_TO_GROUP = { mode: 'modes', lens: 'lenses', skill: 'skills', mcp: 'mcps', state: 'states' } as const;

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
  const [insights, setInsights] = useState<ListingInsightsResponse['insights'] | null>(null);
  const [insightsLoading, setInsightsLoading] = useState(false);

  useEffect(() => {
    setSelectedVersion(listing?.version || '');
  }, [listing?.id]);

  // Honesty platform P5b: fetch org-scoped, suppression-first insights live.
  // Org-scoped numbers require an authenticated Graphyn context — a public
  // visitor (no token) gets no fetch and renders suppression-first, by design.
  useEffect(() => {
    let cancelled = false;
    const slugForFetch = listing?.slug;
    setInsights(null);

    if (!slugForFetch) return;
    const ctx = detectGraphynContext();
    if (!ctx.idServiceUrl || !ctx.authToken) {
      setInsightsLoading(false);
      return;
    }

    setInsightsLoading(true);
    fetchListingInsights(slugForFetch, ctx.authToken)
      .then((res) => {
        if (!cancelled) setInsights(res.insights ?? null);
      })
      .catch(() => {
        if (!cancelled) setInsights(null);
      })
      .finally(() => {
        if (!cancelled) setInsightsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [listing?.slug]);

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

          {/* Agent Experiences (honesty P6 surface) — suppression-first: a way of
              work shows only when it is visible AND corroborated by >=50 agents.
              Reuses the existing card vocabulary; empty until real data lands. */}
          <ExperiencesSection experiences={listing.experiences} />
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

          {/* Honesty-platform insights (P5b) \u2014 suppression-first: a rate renders
              only at n>=20; smaller samples stay blank. Freshness is day-1 real. */}
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
              Insights
            </div>
            <InsightRow label="Success rate" insight={insights?.success_rate} loading={insightsLoading} />
            <InsightRow label="Adoption (30d)" insight={insights?.adoption} loading={insightsLoading} />
            <InsightRow label="Retention 7d" insight={insights?.retention_7d} loading={insightsLoading} />
            <InsightRow label="Retention 30d" insight={insights?.retention_30d} loading={insightsLoading} />
            <FreshnessRow firstSeen={listing.firstSeen} />
            <div style={{ fontSize: 10, color: 'var(--tb-t3)', marginTop: 8, lineHeight: 1.5 }}>
              Real product signals, org-scoped. A rate appears only at n&ge;20.
            </div>
          </div>

          {listing.trust && (
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
                Trust
              </div>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'baseline',
                  justifyContent: 'space-between',
                  marginBottom: 8,
                }}
              >
                <span style={{ fontSize: 13, color: 'var(--tb-t2)' }}>Publisher</span>
                <TrustChip label={listing.trust.tier} ok={listing.trust.tier !== 'community'} />
              </div>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'baseline',
                  justifyContent: 'space-between',
                }}
              >
                <span style={{ fontSize: 13, color: 'var(--tb-t2)' }}>Manifest</span>
                <TrustChip
                  label={listing.trust.manifest_signed ? 'signed' : 'unsigned'}
                  ok={listing.trust.manifest_signed}
                />
              </div>
            </div>
          )}

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

/**
 * Suppression-first insight row. A number is rendered ONLY when the insight is
 * `status: 'ok'` with a real value; every other state (insufficient_n, stale,
 * unavailable, not-fetched, loading) renders an em-dash and a muted reason —
 * never a fabricated zero. This is the honesty contract made visible.
 */
function InsightRow({
  label,
  insight,
  loading,
}: {
  label: string;
  insight?: Insight;
  loading: boolean;
}) {
  const isOk =
    insight?.status === 'ok' &&
    insight.value !== null &&
    insight.value !== undefined;

  let display: string;
  let detail: string | null = null;
  if (loading && !insight) {
    display = '…';
  } else if (isOk) {
    display = `${Math.round((insight!.value as number) * 100)}%`;
    detail = `n=${insight!.n}`;
  } else {
    display = '—';
    detail =
      insight?.status === 'insufficient_n'
        ? `n=${insight.n} (<20)`
        : 'no signal yet';
  }

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'baseline',
        justifyContent: 'space-between',
        marginBottom: 8,
      }}
    >
      <span style={{ fontSize: 13, color: 'var(--tb-t2)' }}>{label}</span>
      <span style={{ display: 'inline-flex', alignItems: 'baseline', gap: 6 }}>
        <span
          style={{
            fontSize: 14,
            color: isOk ? 'var(--tb-t1)' : 'var(--tb-t3)',
            fontFamily: 'JetBrains Mono, monospace',
          }}
        >
          {display}
        </span>
        {detail && <span style={{ fontSize: 10, color: 'var(--tb-t3)' }}>{detail}</span>}
      </span>
    </div>
  );
}

/**
 * Freshness is computable day-1 from the publish date — a real number that needs
 * no suppression floor. Days since the listing was first seen.
 */
function FreshnessRow({ firstSeen }: { firstSeen: string | null }) {
  let display = '—';
  if (firstSeen) {
    const days = Math.max(
      0,
      Math.floor((Date.now() - new Date(firstSeen).getTime()) / 86400000),
    );
    display = days === 0 ? 'today' : `${days}d ago`;
  }
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'baseline',
        justifyContent: 'space-between',
        marginBottom: 8,
      }}
    >
      <span style={{ fontSize: 13, color: 'var(--tb-t2)' }}>Freshness</span>
      <span
        style={{
          fontSize: 14,
          color: 'var(--tb-t1)',
          fontFamily: 'JetBrains Mono, monospace',
        }}
      >
        {display}
      </span>
    </div>
  );
}

/** An experience is published only once corroborated by this many agents. */
const CORROBORATION_FLOOR = 50;

/**
 * Agent Experiences — suppression-first social proof. A way of work is rendered
 * ONLY when the backend marked it visible AND it cleared the corroboration
 * floor; otherwise an honest empty state, never a fabricated tip.
 */
function ExperiencesSection({ experiences }: { experiences?: AgentExperience[] }) {
  const visible = (experiences ?? []).filter(
    (e) => e.visible && e.corroborations >= CORROBORATION_FLOOR,
  );

  return (
    <div style={{ marginTop: 20 }}>
      <div
        style={{
          fontSize: 11,
          color: 'var(--tb-t3)',
          letterSpacing: '0.08em',
          textTransform: 'uppercase',
          marginBottom: 10,
        }}
      >
        Agent Experiences{visible.length > 0 ? ` (${visible.length})` : ''}
      </div>
      {visible.length === 0 ? (
        <div
          style={{
            border: '1px dashed var(--tb-bdr)',
            borderRadius: 8,
            padding: 16,
            textAlign: 'center',
            fontSize: 12,
            color: 'var(--tb-t3)',
            lineHeight: 1.6,
          }}
        >
          No experiences yet. A way of work appears here once{' '}
          {CORROBORATION_FLOOR}+ agents corroborate it — never on the strength of
          one voice.
        </div>
      ) : (
        visible.map((exp, i) => <ExperienceCard key={i} exp={exp} />)
      )}
    </div>
  );
}

function ExperienceCard({ exp }: { exp: AgentExperience }) {
  return (
    <article
      style={{
        border: '1px solid var(--tb-bdr)',
        borderRadius: 8,
        background: 'var(--tb-surface)',
        padding: 12,
        marginBottom: 10,
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          flexWrap: 'wrap',
          fontSize: 11,
          color: 'var(--tb-t3)',
          fontFamily: 'JetBrains Mono, monospace',
          marginBottom: 6,
        }}
      >
        <span
          style={{
            color: 'var(--tb-ok)',
            border: '1px solid rgba(40,200,64,.3)',
            borderRadius: 3,
            padding: '1px 6px',
          }}
        >
          {exp.corroborations} corroborated
        </span>
        <span>v{exp.listing_version_used}</span>
        {exp.manifest_sha_used && <span>manifest {exp.manifest_sha_used.slice(0, 8)}</span>}
      </div>
      <div style={{ fontSize: 13, color: 'var(--tb-t1)', lineHeight: 1.6 }}>
        {exp.way_of_work}
      </div>
      {exp.outcome_evidence && (
        <div style={{ fontSize: 12, color: 'var(--tb-t2)', marginTop: 6 }}>
          {exp.outcome_evidence}
        </div>
      )}
    </article>
  );
}

/** Small trust/provenance chip — green when the signal is positive. */
function TrustChip({ label, ok }: { label: string; ok: boolean }) {
  return (
    <span
      style={{
        fontSize: 10,
        border: `1px solid ${ok ? 'rgba(40,200,64,.3)' : 'var(--tb-bdr)'}`,
        borderRadius: 3,
        padding: '1px 6px',
        color: ok ? 'var(--tb-ok)' : 'var(--tb-t3)',
        fontFamily: 'JetBrains Mono, monospace',
      }}
    >
      {label}
    </span>
  );
}
