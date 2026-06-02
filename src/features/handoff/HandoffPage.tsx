import type { GraphynContext, RouteState } from '../../core/types';
import Breadcrumb from '../../components/Breadcrumb';

interface HandoffPageProps {
  token: string;
  ctx: GraphynContext;
  navigate: (route: RouteState) => void;
  onCopyCommand: (msg: string) => void;
}

interface HandoffPacket {
  token: string;
  title: string;
  creator: string;
  createdAt: string;
  kickoffPrompt: string;
  agentRef: string;
  modeRef: string;
  skillRefs: string[];
  planRef: string;
  redactionReceipt: string;
  provenance: string;
}

const DEMO_HANDOFF_PACKET: HandoffPacket = {
  token: 'gho_019e7b2c_friend_setup',
  title: 'Personal agent handoff',
  creator: 'Resat @ Graphyn',
  createdAt: '2026-05-31',
  kickoffPrompt:
    'Share my current agent, mode, skills, and kickoff prompt so a friend can run the same setup.',
  agentRef: 'Workflow Architect.af',
  modeRef: 'System Designer.mf',
  skillRefs: [
    'graphyn-plan',
    'initiate-design-mode',
    'initiate-heavy-research-mode',
    'initiate-heavy-sprint-mode',
  ],
  planRef: 'tbh-personal-handoff-what-019e7b2c.pf',
  redactionReceipt:
    'No secrets, raw local paths, credentials, production tokens, or unrelated thread content.',
  provenance: 'desktop composer -> tbh.md/h/:token -> Backyard handoff resolver',
};

function packetForToken(token: string): HandoffPacket {
  if (token === DEMO_HANDOFF_PACKET.token) return DEMO_HANDOFF_PACKET;
  return {
    ...DEMO_HANDOFF_PACKET,
    token,
    title: 'Graphyn handoff',
  };
}

function absoluteHandoffUrl(token: string): string {
  if (typeof window === 'undefined') return `https://tbh.md/h/${token}`;
  return `${window.location.origin}/h/${token}`;
}

function copyText(text: string, onDone: (message: string) => void, message: string): void {
  if (!navigator.clipboard) {
    onDone('Clipboard unavailable.');
    return;
  }
  navigator.clipboard
    .writeText(text)
    .then(() => onDone(message))
    .catch(() => onDone('Copy failed.'));
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ marginBottom: 14 }}>
      <div
        style={{
          fontSize: 11,
          color: 'var(--tb-t3)',
          letterSpacing: '0.08em',
          textTransform: 'uppercase',
          marginBottom: 3,
        }}
      >
        {label}
      </div>
      <div style={{ fontSize: 14, color: 'var(--tb-t1)', lineHeight: 1.45 }}>{value}</div>
    </div>
  );
}

export default function HandoffPage({
  token,
  ctx,
  navigate,
  onCopyCommand,
}: HandoffPageProps) {
  const packet = packetForToken(token);
  const link = absoluteHandoffUrl(token);
  const isAuthorized = ctx.isGraphyn && Boolean(ctx.user);

  const copyLink = () => copyText(link, onCopyCommand, 'Copied handoff link');
  const copyImportReceipt = () =>
    copyText(
      `graphyn handoff accept ${link}`,
      onCopyCommand,
      'Copied handoff accept command',
    );

  if (!isAuthorized) {
    return (
      <main className="tbh-shell" style={{ paddingTop: 42, paddingBottom: 48, maxWidth: 720 }}>
        <Breadcrumb
          segments={[{ label: 'Find', route: { page: 'find' } }, { label: 'Personal handoff' }]}
          navigate={navigate}
        />
        <section
          style={{
            border: '1px solid var(--tb-bdr)',
            borderRadius: 12,
            background: 'var(--tb-surface)',
            padding: 22,
          }}
        >
          <div
            style={{
              width: 8,
              height: 8,
              borderRadius: '50%',
              background: 'var(--tb-warn)',
              marginBottom: 14,
            }}
          />
          <h1
            style={{
              margin: '0 0 8px',
              fontSize: 28,
              letterSpacing: '-0.03em',
              color: 'var(--tb-t1)',
            }}
          >
            Sign in to view this Graphyn handoff
          </h1>
          <p style={{ margin: '0 0 18px', fontSize: 14, lineHeight: 1.65, color: 'var(--tb-t2)' }}>
            This is a personal agent setup share, not public discovery content. Graphyn ID is
            required before tbh.md can reveal the kickoff prompt, AgentFile, ModeFile, skills,
            or PlanFile.
          </p>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
            <button
              type="button"
              onClick={copyLink}
              style={{
                border: '1px solid var(--tb-bdr-strong)',
                background: 'var(--tb-t1)',
                color: 'var(--tb-bg)',
                borderRadius: 7,
                padding: '8px 14px',
                fontSize: 13,
                fontWeight: 650,
                cursor: 'pointer',
              }}
            >
              Copy handoff link
            </button>
            <span style={{ fontSize: 12, color: 'var(--tb-t3)', lineHeight: 1.55 }}>
              Open this route inside Graphyn Desktop with an authenticated Graphyn context.
            </span>
          </div>
          <div
            style={{
              marginTop: 16,
              borderTop: '1px solid var(--tb-bdr)',
              paddingTop: 12,
              fontSize: 12,
              lineHeight: 1.6,
              color: 'var(--tb-t3)',
            }}
          >
            Public tbh.md listings stay public. Personal handoff routes stay behind ID.
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className="tbh-shell" style={{ paddingTop: 18, paddingBottom: 36 }}>
      <Breadcrumb
        segments={[
          { label: 'Find', route: { page: 'find' } },
          { label: 'Personal handoff' },
          { label: token },
        ]}
        navigate={navigate}
      />
      <div className="tbh-detail-grid">
        <section className="tbh-detail-main" style={{ minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
            <span
              style={{
                border: '1px solid var(--tb-bdr)',
                borderRadius: 4,
                padding: '2px 7px',
                fontSize: 11,
                color: 'var(--tb-ok)',
              }}
            >
              ID verified
            </span>
            <span style={{ fontSize: 12, color: 'var(--tb-t3)', fontFamily: 'JetBrains Mono, monospace' }}>
              /h/{token}
            </span>
          </div>
          <h1 style={{ margin: '0 0 6px', fontSize: 32, fontWeight: 750, letterSpacing: '-0.03em' }}>
            {packet.title}
          </h1>
          <p style={{ margin: '0 0 18px', color: 'var(--tb-t2)', lineHeight: 1.65, fontSize: 14 }}>
            Authenticated handoff packet for recreating a trusted agent setup. Backend
            authorization, revocation, expiry, and accept receipts are not simulated here.
          </p>

          <section
            style={{
              border: '1px solid var(--tb-bdr)',
              borderRadius: 8,
              background: 'var(--tb-surface)',
              padding: 14,
              marginBottom: 14,
            }}
          >
            <div style={{ fontSize: 11, color: 'var(--tb-t3)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>
              Packet
            </div>
            {[
              ['kickoff', packet.kickoffPrompt],
              ['.af', packet.agentRef],
              ['.mf', packet.modeRef],
              ['.pf', packet.planRef],
              ['skills', packet.skillRefs.join(' + ')],
            ].map(([label, value]) => (
              <div
                key={label}
                style={{
                  display: 'grid',
                  gridTemplateColumns: '86px minmax(0, 1fr)',
                  gap: 10,
                  padding: '7px 0',
                  borderTop: label === 'kickoff' ? 'none' : '1px solid var(--tb-bdr)',
                }}
              >
                <span style={{ color: 'var(--tb-t3)', fontSize: 12, fontFamily: 'JetBrains Mono, monospace' }}>
                  {label}
                </span>
                <span style={{ color: 'var(--tb-t2)', fontSize: 13, lineHeight: 1.5 }}>
                  {value}
                </span>
              </div>
            ))}
          </section>

          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            <button
              type="button"
              onClick={copyImportReceipt}
              style={{
                border: '1px solid var(--tb-bdr-strong)',
                background: 'var(--tb-t1)',
                color: 'var(--tb-bg)',
                borderRadius: 7,
                padding: '8px 14px',
                fontSize: 13,
                fontWeight: 650,
                cursor: 'pointer',
              }}
            >
              Copy accept command
            </button>
            <button
              type="button"
              onClick={copyLink}
              style={{
                border: '1px solid var(--tb-bdr)',
                background: 'transparent',
                color: 'var(--tb-t2)',
                borderRadius: 7,
                padding: '8px 12px',
                fontSize: 13,
                cursor: 'pointer',
              }}
            >
              Copy link
            </button>
          </div>
        </section>

        <aside
          className="tbh-detail-sidebar"
          style={{
            border: '1px solid var(--tb-bdr)',
            borderRadius: 8,
            padding: 14,
            background: 'var(--tb-surface)',
          }}
        >
          <Stat label="Creator" value={packet.creator} />
          <Stat label="Created" value={packet.createdAt} />
          <Stat label="Access" value="Graphyn ID" />
          <div style={{ marginTop: 14, paddingTop: 14, borderTop: '1px solid var(--tb-bdr)' }}>
            <div style={{ fontSize: 11, color: 'var(--tb-t3)', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 8 }}>
              Redaction receipt
            </div>
            <p style={{ margin: 0, color: 'var(--tb-t2)', fontSize: 12, lineHeight: 1.6 }}>
              {packet.redactionReceipt}
            </p>
          </div>
          <div style={{ marginTop: 14, paddingTop: 14, borderTop: '1px solid var(--tb-bdr)' }}>
            <div style={{ fontSize: 11, color: 'var(--tb-t3)', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 8 }}>
              Provenance
            </div>
            <p style={{ margin: 0, color: 'var(--tb-t2)', fontSize: 12, lineHeight: 1.6 }}>
              {packet.provenance}
            </p>
          </div>
        </aside>
      </div>
    </main>
  );
}
