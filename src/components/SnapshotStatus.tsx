import { useMemo } from 'react';
import type { CatalogSource } from '../core/types';

interface SnapshotStatusProps {
  source: CatalogSource;
  generatedAt: string | null;
}

interface StatusInfo {
  dotColor: string;
  label: string;
}

export default function SnapshotStatus({ source, generatedAt }: SnapshotStatusProps) {
  const { dotColor, label } = useMemo<StatusInfo>(() => {
    if (source === 'loading') return { dotColor: 'var(--tb-t3)', label: 'Loading\u2026' };
    if (source === 'unavailable') return { dotColor: 'var(--tb-err)', label: 'Catalog unavailable' };
    if (source === 'cache' || source === 'static-fallback') {
      return { dotColor: 'var(--tb-warn)', label: 'Cached snapshot' };
    }
    // 'network', 'api' — live
    return { dotColor: 'var(--tb-ok)', label: 'Live snapshot' };
  }, [source]);

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 12 }}>
      <div
        style={{
          width: 5,
          height: 5,
          borderRadius: '50%',
          background: dotColor,
          flexShrink: 0,
        }}
      />
      <span style={{ fontSize: 11, color: 'var(--tb-t3)' }}>
        {label}
      </span>
      {generatedAt && (
        <span style={{ fontSize: 11, color: 'var(--tb-t3)', marginLeft: 4 }}>
          (generated {(() => { const d = new Date(generatedAt); return isNaN(d.getTime()) ? 'unknown' : d.toLocaleDateString(); })()})
        </span>
      )}
    </div>
  );
}
