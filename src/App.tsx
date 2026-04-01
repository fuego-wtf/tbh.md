import { useEffect, useMemo, useRef, useState } from 'react';
import type { InstallResult, Listing, RouteState } from './core/types';
import { detectGraphynContext } from './core/graphyn-context';
import { providerRegistry } from './core/providers/registry';
import { backendProvider } from './core/providers/backend-provider';
import { staticProvider } from './core/providers/static-provider';
import { loadCatalog } from './core/catalog-service';
import { installListing } from './core/install-client';
import { parsePath, toPath } from './core/source-parser';
import FindPage from './features/find/FindPage';
import OwnerPage from './features/owner/OwnerPage';
import DetailPage from './features/detail/DetailPage';
import ManagePage from './features/manage/ManagePage';
import TbhAsciiLogo from './components/TbhAsciiLogo';

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
    window.history.pushState({}, '', nextPath);
    setRoute(parsePath(nextPath));
  };

  return { route, navigate };
}

function Header({ navigate, currentPage, graphynDisplayName }: {
  navigate: (r: RouteState) => void;
  currentPage: RouteState['page'];
  graphynDisplayName: string | null;
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
          {graphynDisplayName && navItem('Manage', 'manage')}
        </div>

        <span style={{ flex: 1 }} />

        {graphynDisplayName ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--tb-ok)', flexShrink: 0 }} />
            <span style={{ fontSize: 12, color: 'var(--tb-t3)' }}>{graphynDisplayName}</span>
          </div>
        ) : (
          <button
            onClick={() => navigator.clipboard.writeText('npx tbh login')}
            style={{ border: '1px solid var(--tb-bdr)', background: 'transparent', color: 'var(--tb-t2)', borderRadius: 6, padding: '5px 10px', fontSize: 12, cursor: 'pointer' }}
          >
            Sign in
          </button>
        )}
      </div>
    </header>
  );
}

export default function App() {
  const { route, navigate } = useRoute();
  const graphyn = useMemo(() => detectGraphynContext(), []);

  const [snapshot, setSnapshot] = useState<any>({ generatedAt: null, groups: { modes: [], lenses: [], skills: [], mcps: [] } });
  const [source, setSource] = useState<any>('loading');
  const [toast, setToast] = useState('');
  const [installStates, setInstallStates] = useState<Record<string, InstallResult>>({});
  const installTimersRef = useRef<Record<string, ReturnType<typeof setInterval>>>({});

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
      const result = await loadCatalog();
      setSnapshot(result.snapshot);
      setSource(result.source);
    };
    load();
  }, []);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(''), 2200);
    return () => clearTimeout(t);
  }, [toast]);

  useEffect(() => {
    return () => {
      Object.values(installTimersRef.current).forEach((id) => clearInterval(id));
    };
  }, []);

  const onCopyCommand = (msg: string) => setToast(msg);

  const onInstall = async (listing: Listing) => {
    if (installStates[listing.id]?.status === 'installing') return;

    setInstallStates((prev) => ({
      ...prev,
      [listing.id]: { status: 'installing', progress: 10 },
    }));

    const apiResult = await installListing(
      { owner: listing.owner, type: listing.type, slug: listing.slug },
      graphyn,
    );

    if (apiResult.status === 'error' && !graphyn.isGraphyn) {
      setToast('External mode: use copy command / deep-link');
      setInstallStates((prev) => ({ ...prev, [listing.id]: apiResult }));
      return;
    }

    if (apiResult.status === 'error') {
      setToast(apiResult.message ?? `${listing.name} install failed.`);
      setInstallStates((prev) => ({ ...prev, [listing.id]: apiResult }));
      return;
    }

    setInstallStates((prev) => ({
      ...prev,
      [listing.id]: {
        status: apiResult.status || 'queued',
        progress: apiResult.progress ?? 20,
        installId: apiResult.installId,
        message: apiResult.message,
      },
    }));

    if (installTimersRef.current[listing.id]) clearInterval(installTimersRef.current[listing.id]);

    installTimersRef.current[listing.id] = setInterval(() => {
      setInstallStates((prev) => {
        const cur = prev[listing.id];
        if (!cur || (cur.status !== 'installing' && cur.status !== 'queued')) return prev;

        const progress = Math.min((cur.progress ?? 0) + 22, 100);
        if (progress >= 100) {
          clearInterval(installTimersRef.current[listing.id]);
          delete installTimersRef.current[listing.id];
          setToast(`${listing.name} installed.`);
          return {
            ...prev,
            [listing.id]: { ...cur, status: 'installed', progress: 100 },
          };
        }

        return {
          ...prev,
          [listing.id]: {
            ...cur,
            status: 'installing',
            progress,
          },
        };
      });
    }, 680);
  };

  const allByGroup = snapshot.groups;

  const detailInstallState = route.page === 'detail'
    ? Object.values(allByGroup).flat().find(
      (x: any) => x.owner === route.owner && x.type === route.type && x.slug === route.slug,
    )
      ? installStates[
        (Object.values(allByGroup).flat().find(
          (x: any) => x.owner === route.owner && x.type === route.type && x.slug === route.slug,
        ) as Listing).id
      ]
      : null
    : null;

  return (
    <div className="tbh-web" style={{ minHeight: '100dvh', background: 'var(--tb-bg)', color: 'var(--tb-t1)' }}>
      <Header navigate={navigate} currentPage={route.page} graphynDisplayName={graphyn.user?.displayName ?? null} />

      {route.page === 'find' && (
        <FindPage
          groups={allByGroup}
          generatedAt={snapshot.generatedAt}
          source={source}
          navigate={navigate}
          installStates={installStates}
          onInstall={onInstall}
          onCopyCommand={onCopyCommand}
          isGraphyn={graphyn.isGraphyn}
        />
      )}

      {route.page === 'owner' && (
        <OwnerPage
          owner={route.owner}
          groups={allByGroup}
          navigate={navigate}
          installStates={installStates}
          onInstall={onInstall}
          onCopyCommand={onCopyCommand}
          isGraphyn={graphyn.isGraphyn}
        />
      )}

      {route.page === 'detail' && (
        <DetailPage
          owner={route.owner}
          type={route.type}
          slug={route.slug}
          groups={allByGroup}
          installState={detailInstallState}
          onInstall={onInstall}
          onCopyCommand={onCopyCommand}
          navigate={navigate}
          isGraphyn={graphyn.isGraphyn}
        />
      )}

      {route.page === 'manage' && (
        <ManagePage
          groups={allByGroup}
          navigate={navigate}
          onCopyCommand={onCopyCommand}
          isGraphyn={graphyn.isGraphyn}
          graphynHandle={graphyn.user?.handle ?? null}
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
