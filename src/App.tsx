import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import type { GraphynContext, Listing, RouteState } from './core/types';
import { providerRegistry } from './core/providers/registry';
import { backendProvider } from './core/providers/backend-provider';
import { staticProvider } from './core/providers/static-provider';
import { loadCatalog } from './core/catalog-service';
import { installListing } from './core/install-client';
import { parsePath, toPath } from './core/source-parser';
import {
  detectGraphynContext,
  requestGraphynHostContext,
} from './core/graphyn-context';
import FindPage from './features/find/FindPage';
import OwnerPage from './features/owner/OwnerPage';
import DetailPage from './features/detail/DetailPage';
import ManagePage from './features/manage/ManagePage';
import TbhAsciiLogo from './components/TbhAsciiLogo';
import { ToastProvider, useToast } from './components/Toast';
import {
  captureEvent,
  captureException,
  captureRouteView,
  identifyUser,
  resetUser,
} from './core/telemetry';

const ROUTES = { find: '/find', manage: '/manage' };

function useRoute() {
  const [route, setRoute] = useState<RouteState>(() => parsePath(window.location.pathname));

  useEffect(() => {
    const onPop = () => setRoute(parsePath(window.location.pathname));
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, []);

  const navigate = (next: RouteState) => {
    const nextPath = toPath(next);
    if (window.location.pathname === nextPath) return;
    window.history.pushState({}, '', nextPath);
    setRoute(parsePath(nextPath));
  };

  return { route, navigate };
}

/* ------------------------------------------------------------------ */
/*  useGraphynContext — reactive context with sign-out support        */
/* ------------------------------------------------------------------ */

function useGraphynContext() {
  const [ctx, setCtx] = useState<GraphynContext>(() => detectGraphynContext());
  const [authVersion, setAuthVersion] = useState(0);

  // Refresh context when authVersion changes (e.g. after sign-out clears window prop)
  useEffect(() => {
    setCtx(detectGraphynContext());
  }, [authVersion]);

  // Ask Graphyn Desktop for host context when rendered in BrowserPane iframe mode.
  useEffect(() => {
    let cancelled = false;
    void requestGraphynHostContext().then((fresh) => {
      if (!cancelled && fresh) {
        setCtx(fresh);
      }
    });
    return () => {
      cancelled = true;
    };
  }, []);

  // Poll for context injection (race: header renders before Desktop injects)
  useEffect(() => {
    const interval = setInterval(() => {
      const fresh = detectGraphynContext();
      setCtx((prev) => {
        if (prev.isGraphyn !== fresh.isGraphyn || prev.authToken !== fresh.authToken) {
          return fresh;
        }
        return prev;
      });
    }, 500);
    return () => clearInterval(interval);
  }, []);

  const signOut = () => {
    // Clear the window context injected by Desktop
    const w = window as Window & { __GRAPHYN_TBH_CONTEXT__?: unknown };
    delete w.__GRAPHYN_TBH_CONTEXT__;
    setAuthVersion((v) => v + 1);
  };

  const refresh = () => {
    setAuthVersion((v) => v + 1);
  };

  return { ctx, signOut, refresh };
}

/* ------------------------------------------------------------------ */
/*  Header                                                            */
/* ------------------------------------------------------------------ */

function Header({
  navigate,
  currentPage,
  ctx,
  onSignOut,
  toast,
}: {
  navigate: (r: RouteState) => void;
  currentPage: RouteState['page'];
  ctx: GraphynContext;
  onSignOut: () => void;
  toast: { success: (msg: string) => void; error: (msg: string) => void };
}) {
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    if (!userMenuOpen) return;
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setUserMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [userMenuOpen]);

  const navItem = (label: string, page: RouteState['page']) => (
    <button
      onClick={() => navigate({ page } as RouteState)}
      style={{
        border: 'none',
        background: 'transparent',
        fontSize: 13,
        cursor: 'pointer',
        color: currentPage === page ? 'var(--tb-t1)' : 'var(--tb-t2)',
        fontWeight: currentPage === page ? 500 : 400,
        padding: '4px 0',
        borderBottom: currentPage === page ? '1px solid var(--tb-t1)' : '1px solid transparent',
      }}
    >
      {label}
    </button>
  );

  return (
    <header style={{ borderBottom: '1px solid var(--tb-bdr)', padding: '12px 0', position: 'sticky', top: 0, background: 'var(--tb-bg)', zIndex: 10 }}>
      <div className="tbh-shell" style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
        <button onClick={() => navigate({ page: 'find' })} style={{ border: 'none', background: 'transparent', cursor: 'pointer', padding: 0 }}>
          <TbhAsciiLogo />
        </button>

        <div className="tbh-header-nav">
          {navItem('Find', 'find')}
          {ctx.isGraphyn && ctx.user && navItem('Manage', 'manage')}
        </div>

        <span style={{ flex: 1 }} />

        {/* Auth region */}
        {ctx.isGraphyn && ctx.user ? (
          <div ref={menuRef} style={{ position: 'relative' }}>
            <button
              onClick={() => setUserMenuOpen((o) => !o)}
              style={{
                border: 'none',
                background: 'transparent',
                cursor: 'pointer',
                padding: 0,
                display: 'flex',
                alignItems: 'center',
                gap: 8,
              }}
            >
              {/* Green dot + name */}
              <div style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--tb-ok)', flexShrink: 0 }} />
              <span style={{ fontSize: 12, color: 'var(--tb-t3)' }}>{ctx.user.displayName}</span>
            </button>

            {/* Dropdown */}
            {userMenuOpen && (
              <div style={{
                position: 'absolute',
                right: 0,
                top: '100%',
                marginTop: 6,
                background: 'var(--tb-surface)',
                border: '1px solid var(--tb-bdr)',
                borderRadius: 6,
                padding: '4px 0',
                minWidth: 140,
                boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                zIndex: 20,
              }}>
                <button
                  onClick={() => { setUserMenuOpen(false); onSignOut(); }}
                  style={{
                    border: 'none',
                    background: 'transparent',
                    color: 'var(--tb-t2)',
                    fontSize: 12,
                    cursor: 'pointer',
                    padding: '6px 12px',
                    width: '100%',
                    textAlign: 'left',
                  }}
                >
                  Sign out
                </button>
              </div>
            )}
          </div>
        ) : (
          <button
            onClick={async () => {
              try {
                await navigator.clipboard.writeText('bunx @tbh-md/cli login');
                toast.success('Copied login command');
              } catch {
                toast.error('Failed to copy command');
              }
            }}
            style={{ border: '1px solid var(--tb-bdr)', background: 'transparent', color: 'var(--tb-t2)', borderRadius: 6, padding: '5px 10px', fontSize: 12, cursor: 'pointer' }}
          >
            Sign in
          </button>
        )}

        <a
          href="https://github.com/fuego-wtf/tbh.md"
          target="_blank"
          rel="noreferrer"
          style={{ fontSize: 12, color: 'var(--tb-t3)', textDecoration: 'none', border: '1px solid var(--tb-bdr)', borderRadius: 6, padding: '5px 10px' }}
        >
          GitHub
        </a>
      </div>
    </header>
  );
}

/* ------------------------------------------------------------------ */
/*  AppInner (uses toast hook inside ToastProvider)                   */
/* ------------------------------------------------------------------ */

function AppInner() {
  const { route, navigate } = useRoute();
  const { ctx, signOut, refresh } = useGraphynContext();
  const toast = useToast();

  const [snapshot, setSnapshot] = useState<{
    generatedAt: string | null;
    groups: Record<'modes' | 'lenses' | 'skills' | 'mcps', Listing[]>;
  }>({
    generatedAt: null,
    groups: { modes: [], lenses: [], skills: [], mcps: [] },
  });
  const [source, setSource] = useState<import('./core/types').CatalogSource>('loading');

  useLayoutEffect(() => {
    if (typeof window === 'undefined') return;
    const previous = window.history.scrollRestoration;
    if ('scrollRestoration' in window.history) {
      window.history.scrollRestoration = 'manual';
    }
    return () => {
      if ('scrollRestoration' in window.history) {
        window.history.scrollRestoration = previous;
      }
    };
  }, []);

  useEffect(() => {
    try {
      providerRegistry.register(backendProvider);
    } catch {}
    try {
      providerRegistry.register(staticProvider);
    } catch {}
  }, []);

  useEffect(() => {
    const load = async () => {
      try {
        const result = await loadCatalog();
        setSnapshot(result.snapshot);
        setSource(result.source);
        captureEvent('feature.use', {
          feature: 'catalog.loaded',
          catalog_source: result.source,
          groups: Object.keys(result.snapshot?.groups || {}).length,
        }, { dedupeKey: 'catalog-loaded', dedupeMs: 5000 });
      } catch (error) {
        captureException(error, {
          feature: 'catalog.load_failed',
        }, { dedupeKey: 'catalog-load-failed' });
      }
    };
    load();
  }, []);

  useEffect(() => {
    window.scrollTo(0, 0);
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;
  }, [route.page]);

  useEffect(() => {
    captureRouteView(toPath(route));
  }, [route]);

  useEffect(() => {
    if (ctx.isGraphyn && ctx.user?.handle) {
      identifyUser(ctx.user.handle, {
        display_name: ctx.user.displayName,
      });
      captureEvent('feature.use', {
        feature: 'host_context.detected',
        authenticated: Boolean(ctx.authToken),
      }, { dedupeKey: 'host-context-detected', dedupeMs: 30000 });
      return;
    }
    resetUser();
  }, [ctx.isGraphyn, ctx.user, ctx.authToken]);

  const onCopyCommand = (msg: string) => {
    captureEvent('feature.use', {
      feature: 'command.copied',
      route: route.page,
    });
    toast.success(msg);
  };

  const onInstall = async (listing: Listing): Promise<boolean> => {
    captureEvent('feature.use', {
      feature: 'listing.install_clicked',
      owner: listing.owner,
      type: listing.type,
      slug: listing.slug,
    });

    if (listing.type !== 'lens') {
      const message = `${listing.type} installs are not wired through Graphyn Desktop yet. Copy the command instead.`;
      captureEvent('feature.use', {
        feature: 'listing.install_unsupported',
        owner: listing.owner,
        type: listing.type,
        slug: listing.slug,
      });
      toast.error(message);
      return false;
    }

    const result = await installListing({
      owner: listing.owner,
      type: listing.type,
      slug: listing.slug,
      version: listing.version,
      listingId: listing.id,
    });
    if (result.status !== 'installed') {
      captureException(result.message || 'install_failed', {
        feature: 'listing.install_failed',
        owner: listing.owner,
        type: listing.type,
        slug: listing.slug,
      });
      toast.error(result.message ?? 'Install not available.');
      return false;
    }
    captureEvent('feature.use', {
      feature: 'listing.install_sent',
      owner: listing.owner,
      type: listing.type,
      slug: listing.slug,
    });
    toast.success(`Installed @${listing.owner}/${listing.slug}`);
    return true;
  };

  const handleSignOut = () => {
    signOut();
    navigate({ page: 'find' });
  };

  const allByGroup = snapshot.groups;

  return (
    <div className="tbh-web" style={{ minHeight: '100dvh', background: 'var(--tb-bg)', color: 'var(--tb-t1)' }}>
      <Header navigate={navigate} currentPage={route.page} ctx={ctx} onSignOut={handleSignOut} toast={toast} />

      {route.page === 'find' && (
        <FindPage
          groups={allByGroup}
          generatedAt={snapshot.generatedAt}
          source={source}
          navigate={navigate}
          onInstall={onInstall}
          onCopyCommand={onCopyCommand}
        />
      )}

      {route.page === 'owner' && (
        <OwnerPage
          owner={route.owner}
          groups={allByGroup}
          navigate={navigate}
          onInstall={onInstall}
          onCopyCommand={onCopyCommand}
        />
      )}

      {route.page === 'detail' && (
        <DetailPage
          owner={route.owner}
          type={route.type}
          slug={route.slug}
          groups={allByGroup}
          onCopyCommand={onCopyCommand}
          onInstall={onInstall}
          navigate={navigate}
        />
      )}

      {route.page === 'manage' && (
        <ManagePage
          navigate={navigate}
          onCopyCommand={onCopyCommand}
          onActionError={(msg) => toast.error(msg)}
          onAuthChange={refresh}
        />
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  App — wraps AppInner with ToastProvider                           */
/* ------------------------------------------------------------------ */

export default function App() {
  return (
    <ToastProvider>
      <AppInner />
    </ToastProvider>
  );
}
