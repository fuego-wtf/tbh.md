import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import type { RouteState } from './core/types';
import { providerRegistry } from './core/providers/registry';
import { backendProvider } from './core/providers/backend-provider';
import { staticProvider } from './core/providers/static-provider';
import { loadCatalog } from './core/catalog-service';
import { installListing } from './core/install-client';
import { parsePath, toPath } from './core/source-parser';
import { detectGraphynContext } from './core/graphyn-context';
import FindPage from './features/find/FindPage';
import OwnerPage from './features/owner/OwnerPage';
import DetailPage from './features/detail/DetailPage';
import ManagePage from './features/manage/ManagePage';
import TbhAsciiLogo from './components/TbhAsciiLogo';
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

function Header({ navigate, currentPage }: {
  navigate: (r: RouteState) => void;
  currentPage: RouteState['page'];
}) {
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
        </div>

        <span style={{ flex: 1 }} />

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

export default function App() {
  const { route, navigate } = useRoute();

  const [snapshot, setSnapshot] = useState<any>({ generatedAt: null, groups: { modes: [], lenses: [], skills: [], mcps: [] } });
  const [source, setSource] = useState<any>('loading');
  const [toast, setToast] = useState('');

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
    if (!toast) return;
    const t = setTimeout(() => setToast(''), 2200);
    return () => clearTimeout(t);
  }, [toast]);

  useEffect(() => {
    window.scrollTo(0, 0);
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;
  }, [route.page]);

  useEffect(() => {
    captureRouteView(toPath(route));
  }, [route]);

  useEffect(() => {
    const ctx = detectGraphynContext();
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
  }, []);

  const onCopyCommand = (msg: string) => {
    captureEvent('feature.use', {
      feature: 'command.copied',
      route: route.page,
    });
    setToast(msg);
  };

  const onInstall = async (listing: import('./core/types').Listing) => {
    captureEvent('feature.use', {
      feature: 'listing.install_clicked',
      owner: listing.owner,
      type: listing.type,
      slug: listing.slug,
    });
    const result = await installListing({
      owner: listing.owner,
      type: listing.type,
      slug: listing.slug,
    });
    if (result.status === 'error') {
      captureException(result.message || 'install_failed', {
        feature: 'listing.install_failed',
        owner: listing.owner,
        type: listing.type,
        slug: listing.slug,
      });
      setToast(result.message ?? 'Install not available.');
      return;
    }
    captureEvent('feature.use', {
      feature: 'listing.install_sent',
      owner: listing.owner,
      type: listing.type,
      slug: listing.slug,
    });
  };

  const allByGroup = snapshot.groups;

  return (
    <div className="tbh-web" style={{ minHeight: '100dvh', background: 'var(--tb-bg)', color: 'var(--tb-t1)' }}>
      <Header navigate={navigate} currentPage={route.page} />

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
          navigate={navigate}
        />
      )}

      {route.page === 'manage' && (
        <ManagePage
          navigate={navigate}
          onCopyCommand={onCopyCommand}
        />
      )}

      {toast && (
        <div style={{ position: 'fixed', left: '50%', bottom: 20, transform: 'translateX(-50%)', border: '1px solid var(--tb-bdr)', borderRadius: 6, background: 'var(--tb-surface)', color: 'var(--tb-t2)', fontSize: 12, padding: '7px 12px', zIndex: 10, pointerEvents: 'none' }}>
          {toast}
        </div>
      )}
    </div>
  );
}
