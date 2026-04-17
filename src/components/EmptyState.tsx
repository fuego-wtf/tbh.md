interface EmptyStateProps {
  /** Icon/emoji to display. Defaults to empty. */
  icon?: string;
  /** Primary message. */
  title: string;
  /** Secondary hint text. */
  hint?: string;
  /** Optional action button. */
  action?: {
    label: string;
    onClick: () => void;
  };
}

export default function EmptyState({ icon, title, hint, action }: EmptyStateProps) {
  return (
    <div
      style={{
        padding: '40px 0',
        textAlign: 'center',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 8,
      }}
    >
      {icon && (
        <span style={{ fontSize: 24, opacity: 0.5, lineHeight: 1 }}>{icon}</span>
      )}
      <div style={{ color: 'var(--tb-t3)', fontSize: 13 }}>{title}</div>
      {hint && (
        <div style={{ color: 'var(--tb-t3)', fontSize: 12, opacity: 0.7, maxWidth: 280 }}>
          {hint}
        </div>
      )}
      {action && (
        <button
          type="button"
          onClick={action.onClick}
          className="tbh-btn"
          style={{
            border: '1px solid var(--tb-bdr)',
            background: 'transparent',
            color: 'var(--tb-t2)',
            borderRadius: 6,
            padding: '6px 12px',
            fontSize: 12,
            cursor: 'pointer',
            marginTop: 4,
          }}
        >
          {action.label}
        </button>
      )}
    </div>
  );
}
