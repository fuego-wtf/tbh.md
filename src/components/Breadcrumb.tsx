import type { RouteState } from '../core/types';

export interface Crumb {
  label: string;
  route?: RouteState;
}

interface BreadcrumbProps {
  segments: Crumb[];
  navigate: (route: RouteState) => void;
}

export default function Breadcrumb({ segments, navigate }: BreadcrumbProps) {
  return (
    <nav style={{ display: 'flex', alignItems: 'center', gap: 4, marginBottom: 16, fontSize: 12, color: 'var(--tb-t3)' }}>
      {segments.map((seg, i) => (
        <span key={`${seg.label}-${i}`} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          {i > 0 && <span style={{ opacity: 0.4 }}>/</span>}
          {seg.route ? (
            <button
              className="tbh-breadcrumb-link"
              onClick={() => navigate(seg.route!)}
              style={{ border: 'none', padding: 0, background: 'transparent', color: 'var(--tb-t2)', fontSize: 12, cursor: 'pointer' }}
            >
              {seg.label}
            </button>
          ) : (
            <span style={{ color: 'var(--tb-t3)' }}>{seg.label}</span>
          )}
        </span>
      ))}
    </nav>
  );
}
