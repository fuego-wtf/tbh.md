import { useState } from 'react';
import type { Listing } from '../core/types';

interface CopyUrlButtonProps {
  item: Listing;
  onCopy?: (msg: string) => void;
}

function listingUrl(item: Listing): string {
  return item.url || `https://tbh.md/@${item.owner}/${item.type}/${item.slug}`;
}

export default function CopyUrlButton({ item, onCopy }: CopyUrlButtonProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    const url = listingUrl(item);
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      onCopy?.(`Copied: ${url}`);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      onCopy?.('Copy failed');
    }
  };

  return (
    <button
      onClick={handleCopy}
      style={{
        border: '1px solid var(--tb-bdr)',
        background: copied ? 'rgba(40,200,64,0.06)' : 'transparent',
        color: copied ? 'var(--tb-ok)' : 'var(--tb-t3)',
        borderRadius: 6,
        padding: '5px 10px',
        fontSize: 11,
        cursor: 'pointer',
        whiteSpace: 'nowrap',
        transition: 'color 0.12s, background 0.12s',
      }}
    >
      {copied ? 'Copied URL' : 'Copy URL'}
    </button>
  );
}
