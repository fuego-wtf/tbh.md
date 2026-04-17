import { useMemo } from 'react';
import type { Listing, ListingType } from '../core/types';
import { TYPE_ORDER } from '../core/view-utils';

interface FilterPillsProps {
  /** All listings (to derive unique owners). */
  all: Listing[];
  /** Currently selected type filter. */
  selectedType: 'all' | ListingType;
  /** Currently selected owner filter. */
  selectedOwner: string;
  /** Callback when type changes. */
  onTypeChange: (type: 'all' | ListingType) => void;
  /** Callback when owner changes. */
  onOwnerChange: (owner: string) => void;
}

/**
 * Type/owner toggle pills — cycles through options on click.
 * Derives unique owners from the listing data.
 */
export default function FilterPills({
  all,
  selectedType,
  selectedOwner,
  onTypeChange,
  onOwnerChange,
}: FilterPillsProps) {
  const owners = useMemo(() => {
    const set = new Set(all.map((x) => x.owner));
    return ['all', ...Array.from(set).sort()];
  }, [all]);

  const cycleType = () => {
    const opts: Array<'all' | ListingType> = ['all', ...TYPE_ORDER];
    const idx = opts.indexOf(selectedType);
    onTypeChange(opts[(idx + 1) % opts.length]!);
  };

  const cycleOwner = () => {
    const idx = owners.indexOf(selectedOwner);
    onOwnerChange(owners[(idx + 1) % owners.length]!);
  };

  return (
    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
      <Pill
        label={selectedType === 'all' ? 'All types' : selectedType}
        active={selectedType !== 'all'}
        onClick={cycleType}
      />
      <Pill
        label={selectedOwner === 'all' ? 'All owners' : `@${selectedOwner}`}
        active={selectedOwner !== 'all'}
        onClick={cycleOwner}
      />
    </div>
  );
}

function Pill({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      className="tbh-btn"
      style={{
        border: '1px solid var(--tb-bdr)',
        background: active ? 'var(--tb-surface)' : 'transparent',
        color: active ? 'var(--tb-t1)' : 'var(--tb-t2)',
        borderRadius: 6,
        padding: '7px 10px',
        fontSize: 12,
        cursor: 'pointer',
        transition: 'background 0.12s, color 0.12s',
      }}
    >
      {label}
    </button>
  );
}
