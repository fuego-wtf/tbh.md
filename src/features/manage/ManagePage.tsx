import { useCallback, useEffect, useRef, useState } from 'react';
import type { Listing, RouteState } from '../../core/types';
import { detectGraphynContext } from '../../core/graphyn-context';
import { emitTbhNotificationSignal } from '../../core/notification-emitter';
import {
  deleteListing,
  fetchMyListings,
  ListingApiError,
  publishListing,
  unpublishListing,
} from '../../lib/listing-api';
import Breadcrumb from '../../components/Breadcrumb';
import CommandBar from '../../components/CommandBar';

/* ------------------------------------------------------------------ */
/*  Helpers                                                           */
/* ------------------------------------------------------------------ */

function bumpVersion(v = '1.0.0'): string {
  const parts = v.split('.').map(Number);
  const major = Number.isFinite(parts[0]) ? parts[0] : 1;
  const minor = Number.isFinite(parts[1]) ? parts[1] : 0;
  const patch = Number.isFinite(parts[2]) ? parts[2] : 0;
  return `${major}.${minor}.${patch + 1}`;
}

function fmtInstalls(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return String(n);
}

/* ------------------------------------------------------------------ */
/*  Types                                                             */
/* ------------------------------------------------------------------ */

interface ManagePageProps {
  navigate: (route: RouteState) => void;
  onCopyCommand: (msg: string) => void;
  onActionError: (msg: string) => void;
  /** Called when auth state changes (e.g. after delete causes sign-out). */
  onAuthChange?: () => void;
}

type FetchState = 'loading' | 'ready' | 'error';

/* ------------------------------------------------------------------ */
/*  ManagePage                                                        */
/* ------------------------------------------------------------------ */

export default function ManagePage({ navigate, onCopyCommand, onActionError, onAuthChange }: ManagePageProps) {
  const ctx = detectGraphynContext();

  const [fetchState, setFetchState] = useState<FetchState>('loading');
  const [listings, setListings] = useState<Listing[]>([]);
  const [errorMessage, setErrorMessage] = useState('');
  const [unpublishConfirm, setUnpublishConfirm] = useState<string | null>(null);
  const [publishedOverrides, setPublishedOverrides] = useState<Record<string, { version?: string; unpublished?: boolean }>>({});
  const [actionInProgress, setActionInProgress] = useState<string | null>(null);

  // ------ Gate: not in Graphyn Desktop ------
  if (!ctx.isGraphyn) {
    return (
      <main className="tbh-shell" style={{ paddingTop: 40, paddingBottom: 32, textAlign: 'center' }}>
        <Breadcrumb segments={[{ label: 'Find', route: { page: 'find' } }, { label: 'Manage' }]} navigate={navigate} />

        <div style={{ maxWidth: 400, margin: '40px auto 0' }}>
          <div style={{ fontSize: 14, color: 'var(--tb-t2)', marginBottom: 16 }}>
            Management is only available through Graphyn Desktop.
          </div>
          <div style={{ fontSize: 13, color: 'var(--tb-t3)', marginBottom: 20 }}>
            Open tbh.md from inside Graphyn Desktop for auto sign-in.
          </div>
          <CommandBar command="bunx @graphyn/tbh login" onCopy={onCopyCommand} size={13} />
        </div>
      </main>
    );
  }

  // ------ Gate: no user ------
  if (!ctx.user) {
    return (
      <main className="tbh-shell" style={{ paddingTop: 40, paddingBottom: 32, textAlign: 'center' }}>
        <Breadcrumb segments={[{ label: 'Find', route: { page: 'find' } }, { label: 'Manage' }]} navigate={navigate} />

        <div style={{ maxWidth: 400, margin: '40px auto 0' }}>
          <div style={{ fontSize: 14, color: 'var(--tb-t2)', marginBottom: 16 }}>
            Sign in to manage your listings.
          </div>
          <div style={{ fontSize: 13, color: 'var(--tb-t3)', marginBottom: 20 }}>
            Manage and publish listings from Graphyn Desktop Settings.<br />
            Web-based sign-in coming soon.
          </div>
          <CommandBar command="bunx @graphyn/tbh login" onCopy={onCopyCommand} size={13} />
        </div>
      </main>
    );
  }

  // ------ Gate: no auth token ------
  if (!ctx.authToken) {
    return (
      <main className="tbh-shell" style={{ paddingTop: 40, paddingBottom: 32, textAlign: 'center' }}>
        <Breadcrumb segments={[{ label: 'Find', route: { page: 'find' } }, { label: 'Manage' }]} navigate={navigate} />

        <div style={{ maxWidth: 400, margin: '40px auto 0' }}>
          <div style={{ fontSize: 14, color: 'var(--tb-t2)', marginBottom: 16 }}>
            Authentication required.
          </div>
          <div style={{ fontSize: 13, color: 'var(--tb-t3)', marginBottom: 20 }}>
            Your session is missing an auth token. Please restart from Graphyn Desktop.
          </div>
          <CommandBar command="bunx @graphyn/tbh login" onCopy={onCopyCommand} size={13} />
        </div>
      </main>
    );
  }

  // ------ Authenticated + ready: this component re-mounts via key below ------
  return (
    <ManagePageInner
      key={ctx.user.handle}
      authToken={ctx.authToken}
      ownerHandle={ctx.user.handle}
      navigate={navigate}
      onCopyCommand={onCopyCommand}
      onActionError={onActionError}
      onAuthChange={onAuthChange}
    />
  );
}

/* ------------------------------------------------------------------ */
/*  ManagePageInner — only mounts when auth is confirmed              */
/* ------------------------------------------------------------------ */

interface ManagePageInnerProps {
  authToken: string;
  ownerHandle: string;
  navigate: (route: RouteState) => void;
  onCopyCommand: (msg: string) => void;
  onActionError: (msg: string) => void;
  onAuthChange?: () => void;
}

function ManagePageInner({
  authToken,
  ownerHandle,
  navigate,
  onCopyCommand,
  onActionError,
  onAuthChange,
}: ManagePageInnerProps) {
  const [fetchState, setFetchState] = useState<FetchState>('loading');
  const fetchStateRef = useRef<FetchState>('loading');
  const [listings, setListings] = useState<Listing[]>([]);
  const [errorMessage, setErrorMessage] = useState('');
  const [unpublishConfirm, setUnpublishConfirm] = useState<string | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [publishedOverrides, setPublishedOverrides] = useState<Record<string, { version?: string; unpublished?: boolean }>>({});
  const [actionInProgress, setActionInProgress] = useState<string | null>(null);
  const [retryNonce, setRetryNonce] = useState(0);

  // ------ Fetch listings on mount ------
  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      fetchStateRef.current = 'loading';
      setFetchState('loading');
      setErrorMessage('');
      try {
        const data = await fetchMyListings(authToken);
        if (!cancelled) {
          setListings(data);
          fetchStateRef.current = 'ready';
          setFetchState('ready');
        }
      } catch (err) {
        if (!cancelled) {
          fetchStateRef.current = 'error';
          setFetchState('error');
          if (err instanceof ListingApiError) {
            setErrorMessage(err.message);
          } else {
            setErrorMessage('Unable to reach listing service. Please check your connection.');
          }
        }
      }

      void emitTbhNotificationSignal({
        signal: 'manage_open',
        detail: fetchStateRef.current === 'ready'
          ? 'Manage page opened with ready context.'
          : 'Manage page opened but failed to load listings.',
        metadata: { fetchState: fetchStateRef.current },
      });
    };

    load();
    return () => { cancelled = true; };
  }, [authToken, retryNonce]);

  // ------ Actions ------
  const handlePublish = useCallback(async (item: Listing) => {
    const nextVersion = bumpVersion(
      publishedOverrides[item.id]?.version || item.version,
    );
    setActionInProgress(item.id);
    try {
      await publishListing(authToken, item.slug);
      setPublishedOverrides((prev) => ({
        ...prev,
        [item.id]: { version: nextVersion },
      }));
      onCopyCommand(`${item.slug} v${nextVersion} published`);
    } catch (err) {
      onActionError(
        err instanceof ListingApiError ? err.message : 'Publish failed.',
      );
    } finally {
      setActionInProgress(null);
    }
  }, [authToken, publishedOverrides, onCopyCommand, onActionError]);

  const handleUnpublish = useCallback(async (itemId: string, slug: string) => {
    setActionInProgress(itemId);
    try {
      await unpublishListing(authToken, slug);
      setPublishedOverrides((prev) => ({
        ...prev,
        [itemId]: { ...prev[itemId], unpublished: true },
      }));
      setUnpublishConfirm(null);
      onCopyCommand('Listing unpublished.');
    } catch (err) {
      onActionError(
        err instanceof ListingApiError ? err.message : 'Unpublish failed.',
      );
    } finally {
      setActionInProgress(null);
    }
  }, [authToken, onCopyCommand, onActionError]);

  const handleDelete = useCallback(async (item: Listing) => {
    setActionInProgress(item.id);
    try {
      await deleteListing(authToken, item.slug);
      setListings((prev) => prev.filter((l) => l.id !== item.id));
      onCopyCommand(`${item.slug} deleted.`);
    } catch (err) {
      onActionError(
        err instanceof ListingApiError ? err.message : 'Delete failed.',
      );
    } finally {
      setActionInProgress(null);
    }
  }, [authToken, onCopyCommand, onActionError]);

  const handleCopyUrl = useCallback(async (item: Listing) => {
    const url = item.url || `https://tbh.md/@${item.owner}/${item.type}/${item.slug}`;
    try {
      await navigator.clipboard.writeText(url);
      onCopyCommand(`Copied: ${url}`);
    } catch {
      onActionError('Copy failed.');
    }
  }, [onCopyCommand, onActionError]);

  // ------ Loading state ------
  if (fetchState === 'loading') {
    return (
      <main className="tbh-shell" style={{ paddingTop: 40, paddingBottom: 32, textAlign: 'center' }}>
        <Breadcrumb segments={[{ label: 'Find', route: { page: 'find' } }, { label: 'Manage' }]} navigate={navigate} />
        <div style={{ fontSize: 13, color: 'var(--tb-t3)', marginTop: 40 }}>Loading your listings&hellip;</div>
      </main>
    );
  }

  // ------ Error state ------
  if (fetchState === 'error') {
    return (
      <main className="tbh-shell" style={{ paddingTop: 40, paddingBottom: 32, textAlign: 'center' }}>
        <Breadcrumb segments={[{ label: 'Find', route: { page: 'find' } }, { label: 'Manage' }]} navigate={navigate} />
        <div style={{ maxWidth: 400, margin: '40px auto 0' }}>
          <div style={{ fontSize: 14, color: 'var(--tb-err)', marginBottom: 12 }}>{errorMessage}</div>
          <button
            onClick={() => {
              onAuthChange?.();
              setRetryNonce((n) => n + 1);
            }}
            style={{ border: '1px solid var(--tb-bdr)', background: 'transparent', color: 'var(--tb-t2)', borderRadius: 6, padding: '6px 14px', fontSize: 12, cursor: 'pointer' }}
          >
            Retry
          </button>
        </div>
      </main>
    );
  }

  // ------ Ready: render listing cards ------
  return (
    <main className="tbh-shell" style={{ paddingTop: 16, paddingBottom: 32 }}>
      <Breadcrumb segments={[{ label: 'Find', route: { page: 'find' } }, { label: 'Manage' }]} navigate={navigate} />

      <div style={{ display: 'flex', alignItems: 'baseline', gap: 12, marginBottom: 16 }}>
        <h1 style={{ margin: 0, fontSize: 24, fontWeight: 700, letterSpacing: '-0.02em' }}>Manage</h1>
        <span style={{ fontSize: 13, color: 'var(--tb-t3)' }}>@{ownerHandle}</span>
      </div>

      {listings.length === 0 ? (
        <div style={{ padding: '32px 0', textAlign: 'center' }}>
          <div style={{ fontSize: 13, color: 'var(--tb-t3)', marginBottom: 12 }}>
            You haven&apos;t published any listings yet.
          </div>
          <CommandBar command="bunx @graphyn/tbh publish ./skill.md --type skill" onCopy={onCopyCommand} size={13} />
        </div>
      ) : (
        listings.map((item) => {
          const override = publishedOverrides[item.id];
          const isUnpublished = override?.unpublished === true;
          const displayVersion = override?.version || item.version;
          const nextVersion = bumpVersion(displayVersion);
          const busy = actionInProgress === item.id;

          return (
            <article
              key={item.id}
              className="tbh-card"
              style={{
                padding: 14,
                marginBottom: 10,
                opacity: isUnpublished ? 0.5 : 1,
                transition: 'opacity 0.2s, border-color 0.12s, background 0.12s',
                cursor: 'pointer',
              }}
              onClick={(e) => {
                const target = e.target as HTMLElement;
                if (target.tagName === 'BUTTON' || target.closest('button')) return;
                navigate({ page: 'detail', owner: item.owner, type: item.type, slug: item.slug });
              }}
            >
              {/* Header row */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                <button
                  onClick={() => navigate({ page: 'detail', owner: item.owner, type: item.type, slug: item.slug })}
                  style={{ border: 'none', padding: 0, background: 'transparent', color: 'var(--tb-t1)', fontSize: 16, fontWeight: 700, cursor: 'pointer', letterSpacing: '-0.01em' }}
                >
                  {item.slug}
                </button>
                <span style={{ fontSize: 11, color: 'var(--tb-t3)', border: '1px solid var(--tb-bdr)', borderRadius: 3, padding: '1px 5px' }}>
                  {item.type}
                </span>
                <span style={{ fontSize: 11, color: 'var(--tb-t3)', border: '1px solid var(--tb-bdr)', borderRadius: 3, padding: '1px 5px', fontFamily: 'JetBrains Mono, monospace' }}>
                  v{displayVersion}
                </span>
                {isUnpublished && (
                  <span style={{ fontSize: 11, color: 'var(--tb-warn)', border: '1px solid var(--tb-bdr)', borderRadius: 3, padding: '1px 5px' }}>Unpublished</span>
                )}
                <span style={{ flex: 1 }} />
                <span style={{ fontSize: 12, color: 'var(--tb-t3)' }}>{fmtInstalls(item.installs)} installs</span>
              </div>

              <div style={{ fontSize: 13, color: 'var(--tb-t2)', marginBottom: 10, lineHeight: 1.5 }}>
                {item.description}
              </div>

              {/* Actions */}
              {!isUnpublished && (
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  {/* Copy listing URL */}
                  <button
                    onClick={() => handleCopyUrl(item)}
                    disabled={busy}
                    style={{ border: '1px solid var(--tb-bdr)', background: 'transparent', color: 'var(--tb-t2)', borderRadius: 6, padding: '5px 10px', fontSize: 12, cursor: busy ? 'not-allowed' : 'pointer', opacity: busy ? 0.5 : 1 }}
                  >
                    Copy listing URL
                  </button>

                  {/* Publish new version */}
                  <button
                    onClick={() => handlePublish(item)}
                    disabled={busy}
                    style={{ border: '1px solid var(--tb-bdr)', background: 'transparent', color: 'var(--tb-t2)', borderRadius: 6, padding: '5px 10px', fontSize: 12, cursor: busy ? 'not-allowed' : 'pointer', opacity: busy ? 0.5 : 1 }}
                  >
                    {busy ? 'Publishing\u2026' : `Publish v${nextVersion}`}
                  </button>

                  {/* Unpublish */}
                  {unpublishConfirm === item.id ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span style={{ fontSize: 12, color: 'var(--tb-t3)' }}>Unpublish from tbh.md?</span>
                      <button
                        onClick={() => setUnpublishConfirm(null)}
                        style={{ border: 'none', background: 'transparent', color: 'var(--tb-t3)', fontSize: 12, cursor: 'pointer', padding: '4px 6px' }}
                      >
                        Cancel
                      </button>
                      <button
                        onClick={() => handleUnpublish(item.id, item.slug)}
                        disabled={busy}
                        style={{ border: '1px solid var(--tb-bdr)', background: 'rgba(255,95,87,0.08)', color: 'var(--tb-err)', borderRadius: 6, padding: '4px 10px', fontSize: 12, cursor: busy ? 'not-allowed' : 'pointer' }}
                      >
                        Unpublish
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setUnpublishConfirm(item.id)}
                      disabled={busy}
                      style={{ border: '1px solid var(--tb-bdr)', background: 'transparent', color: 'var(--tb-t3)', borderRadius: 6, padding: '5px 10px', fontSize: 12, cursor: busy ? 'not-allowed' : 'pointer', opacity: busy ? 0.5 : 1 }}
                    >
                      Unpublish
                    </button>
                  )}

                  {/* Delete */}
                  {deleteConfirm === item.id ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span style={{ fontSize: 12, color: 'var(--tb-t3)' }}>Delete permanently?</span>
                      <button
                        onClick={() => setDeleteConfirm(null)}
                        style={{ border: 'none', background: 'transparent', color: 'var(--tb-t3)', fontSize: 12, cursor: 'pointer', padding: '4px 6px' }}
                      >
                        Cancel
                      </button>
                      <button
                        onClick={() => handleDelete(item)}
                        disabled={busy}
                        style={{ border: '1px solid var(--tb-bdr)', background: 'rgba(255,95,87,0.08)', color: 'var(--tb-err)', borderRadius: 6, padding: '4px 10px', fontSize: 12, cursor: busy ? 'not-allowed' : 'pointer' }}
                      >
                        Delete
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setDeleteConfirm(item.id)}
                      disabled={busy}
                      style={{ border: '1px solid var(--tb-bdr)', background: 'transparent', color: 'var(--tb-err)', borderRadius: 6, padding: '5px 10px', fontSize: 12, cursor: busy ? 'not-allowed' : 'pointer', opacity: busy ? 0.5 : 1 }}
                    >
                      Delete
                    </button>
                  )}
                </div>
              )}
            </article>
          );
        })
      )}
    </main>
  );
}
