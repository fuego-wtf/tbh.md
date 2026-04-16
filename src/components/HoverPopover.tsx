/**
 * HoverPopover — portal-based tooltip anchored to children.
 *
 * Ported from prototypes/tbh.jsx:41-130 with TypeScript types applied.
 * T-TBH-W175-002
 */
import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

export interface HoverPopoverProps {
  content: React.ReactNode;
  children: React.ReactNode;
  side?: 'top' | 'bottom';
  delay?: number;
  disabled?: boolean;
}

export default function HoverPopover({
  content,
  children,
  side = 'top',
  delay = 180,
  disabled = false,
}: HoverPopoverProps) {
  const anchorRef = useRef<HTMLSpanElement>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [open, setOpen] = useState(false);
  const [anchorRect, setAnchorRect] = useState<DOMRect | null>(null);

  const clearTimer = () => {
    if (!timerRef.current) return;
    clearTimeout(timerRef.current);
    timerRef.current = null;
  };

  const openWithDelay = () => {
    if (!content || disabled) return;
    clearTimer();
    timerRef.current = setTimeout(() => {
      if (anchorRef.current) setAnchorRect(anchorRef.current.getBoundingClientRect());
      setOpen(true);
    }, delay);
  };

  const closeNow = () => {
    clearTimer();
    setOpen(false);
  };

  // Cleanup timer on unmount
  useEffect(() => () => clearTimer(), []);

  // Refresh anchor rect on scroll/resize while open
  useEffect(() => {
    if (!open) return;
    const refreshRect = () => {
      if (!anchorRef.current) return;
      setAnchorRect(anchorRef.current.getBoundingClientRect());
    };
    refreshRect();
    window.addEventListener('scroll', refreshRect, true);
    window.addEventListener('resize', refreshRect);
    return () => {
      window.removeEventListener('scroll', refreshRect, true);
      window.removeEventListener('resize', refreshRect);
    };
  }, [open]);

  const bubble =
    open && anchorRect && typeof document !== 'undefined'
      ? createPortal(
          <div
            role="tooltip"
            style={{
              position: 'fixed',
              zIndex: 13000,
              left: Math.max(
                10,
                Math.min(
                  window.innerWidth - 10,
                  anchorRect.left + anchorRect.width / 2,
                ),
              ),
              top:
                side === 'bottom'
                  ? anchorRect.bottom + 8
                  : anchorRect.top - 8,
              transform:
                side === 'bottom'
                  ? 'translate(-50%, 0)'
                  : 'translate(-50%, -100%)',
              pointerEvents: 'none',
              padding: '4px 8px',
              borderRadius: 6,
              background: 'rgba(20, 21, 26, 0.94)',
              border: '1px solid rgba(255,255,255,0.07)',
              boxShadow: '0 6px 16px rgba(0,0,0,0.35)',
              backdropFilter: 'blur(6px)',
              WebkitBackdropFilter: 'blur(6px)',
              color: 'rgba(226, 232, 240, 0.92)',
              fontFamily: "'Host Grotesk', system-ui, -apple-system, sans-serif",
              fontSize: 11,
              fontWeight: 500,
              lineHeight: '14px',
              whiteSpace: 'nowrap',
              letterSpacing: '0.01em',
            }}
          >
            {content}
          </div>,
          document.body,
        )
      : null;

  return (
    <span
      ref={anchorRef}
      onMouseEnter={openWithDelay}
      onMouseLeave={closeNow}
      onFocus={openWithDelay}
      onBlur={closeNow}
      style={{ display: 'inline-flex', alignItems: 'center' }}
    >
      {children}
      {bubble}
    </span>
  );
}
