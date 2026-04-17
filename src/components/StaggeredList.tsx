import { useEffect, useRef, useState, type ReactNode } from 'react';

interface StaggeredListProps {
  children: ReactNode[];
  /** Delay per item in ms. Default 30. */
  staggerMs?: number;
  /** Additional className for the wrapper. */
  className?: string;
}

/**
 * Renders children with a staggered fade-in animation.
 * Respects `prefers-reduced-motion` by disabling all transitions.
 */
export default function StaggeredList({ children, staggerMs = 30, className }: StaggeredListProps) {
  const [visible, setVisible] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // SSR guard: window is not available during server-side rendering
    if (typeof window === 'undefined') {
      setVisible(true);
      return;
    }

    // Check reduced motion preference
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) {
      setVisible(true);
      return;
    }

    // Small delay before starting the stagger
    const timer = requestAnimationFrame(() => {
      setVisible(true);
    });
    return () => cancelAnimationFrame(timer);
  }, []);

  return (
    <div ref={containerRef} className={className}>
      {children.map((child, index) => (
        <div
          key={index}
          className="tbh-stagger-item"
          style={{
            opacity: visible ? 1 : 0,
            transform: visible ? 'translateY(0)' : 'translateY(6px)',
            transition: visible
              ? `opacity 0.2s ease ${index * staggerMs}ms, transform 0.2s ease ${index * staggerMs}ms`
              : 'none',
          }}
        >
          {child}
        </div>
      ))}
    </div>
  );
}
